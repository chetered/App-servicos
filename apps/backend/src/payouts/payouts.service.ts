import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Manual payout request by provider ─────────────────────────

  async requestPayout(providerId: string, amount: number, method: string, destination: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    if (provider.pendingPayout < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${provider.pendingPayout}, requested: ${amount}`,
      );
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payout.create({
        data: {
          providerId,
          amount,
          currency: 'BRL',
          method,
          destination,
          status: 'PENDING',
        },
      });

      // Reserve the amount (deduct from pending)
      await tx.provider.update({
        where: { id: providerId },
        data: { pendingPayout: { decrement: amount } },
      });

      return p;
    });

    this.eventEmitter.emit('payout.requested', { payoutId: payout.id, providerId, amount });
    return payout;
  }

  async findProviderPayouts(providerId: string) {
    return this.prisma.payout.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin ─────────────────────────────────────────────────────

  async findAll(status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: { provider: { include: { user: { select: { fullName: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async approvePayout(payoutId: string, adminId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'PENDING') throw new BadRequestException('Payout is not in PENDING state');

    // TODO: call actual payment gateway transfer API here
    // For now, mark as PROCESSING → will be finalized by webhook or scheduler
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PROCESSING', reference: `admin-approved-${adminId}` },
    });
  }

  async markFailed(payoutId: string, reason: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');

    // Refund the reserved amount back to provider
    await this.prisma.$transaction([
      this.prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'FAILED', failureReason: reason },
      }),
      this.prisma.provider.update({
        where: { id: payout.providerId },
        data: { pendingPayout: { increment: payout.amount } },
      }),
    ]);

    return { success: true };
  }

  // ── Scheduled D+1 automatic payouts ───────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processScheduledPayouts() {
    this.logger.log('Running scheduled payout processor...');

    // Find all providers with pending payouts above minimum threshold
    const providers = await this.prisma.provider.findMany({
      where: { pendingPayout: { gte: 1000 }, status: 'ACTIVE' }, // Min 10 BRL (1000 cents)
    });

    this.logger.log(`Processing payouts for ${providers.length} providers`);

    for (const provider of providers) {
      try {
        // Skip if there's already a pending payout in processing
        const existingProcessing = await this.prisma.payout.findFirst({
          where: { providerId: provider.id, status: { in: ['PENDING', 'PROCESSING'] } },
        });
        if (existingProcessing) continue;

        await this.requestPayout(
          provider.id,
          provider.pendingPayout,
          'PIX',
          provider.pixKey ?? 'pending',
        );

        this.logger.log(`Queued payout of ${provider.pendingPayout} for provider ${provider.id}`);
      } catch (err) {
        this.logger.error(`Failed to queue payout for provider ${provider.id}:`, err);
      }
    }
  }

  // Provider wallet summary
  async getWalletSummary(providerId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const last30DaysEarnings = await this.prisma.monetizationLedger.aggregate({
      where: {
        order: { providerId },
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        source: 'COMMISSION', // Exclude commission from provider earnings calc
      },
      _sum: { amount: true },
    });

    const pendingPayouts = await this.prisma.payout.findMany({
      where: { providerId, status: { in: ['PENDING', 'PROCESSING'] } },
    });

    return {
      totalEarnings: provider.totalEarnings,
      pendingPayout: provider.pendingPayout,
      pendingPayouts,
      last30Days: provider.totalEarnings - (last30DaysEarnings._sum.amount ?? 0),
    };
  }
}
