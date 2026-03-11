import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private prisma: PrismaService) {}

  async processOrderPayout(orderId: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: { provider: true, payments: true },
    });

    if (!order || order.status !== 'COMPLETED') return;

    const payment = order.payments.find((p) => p.status === 'SUCCEEDED');
    if (!payment) return;

    const providerAmount = order.totalAmount - order.platformFee;

    // Create payment split record
    await this.prisma.paymentSplit.upsert({
      where: { orderId },
      update: {},
      create: {
        orderId,
        paymentId: payment.id,
        totalAmount: order.totalAmount,
        platformAmount: order.platformFee,
        providerAmount,
        currency: order.currency,
        commissionRate: order.platformFee / order.servicePrice * 100,
        isSettled: false,
      },
    });

    // Update provider wallet
    await this.prisma.provider.update({
      where: { id: order.providerId },
      data: {
        pendingPayout: { increment: providerAmount },
        totalEarnings: { increment: providerAmount },
        totalCompletedJobs: { increment: 1 },
      },
    });

    // Record monetization sources
    const monetizationEntries = [
      { source: 'COMMISSION', amount: order.platformFee },
    ];

    if (order.urgencyFee > 0) {
      monetizationEntries.push({ source: 'URGENCY_FEE', amount: order.urgencyFee });
    }
    if (order.insuranceFee > 0) {
      monetizationEntries.push({ source: 'INSURANCE_FEE', amount: order.insuranceFee });
    }

    for (const entry of monetizationEntries) {
      await this.prisma.monetizationLedger.create({
        data: {
          orderId,
          source: entry.source as any,
          amount: entry.amount,
          currency: order.currency,
        },
      });
    }

    this.logger.log(
      `Payout processed for order ${orderId}: provider gets ${providerAmount}, platform keeps ${order.platformFee}`,
    );
  }

  async getProviderEarnings(providerId: string, params: { from?: Date; to?: Date }) {
    const splits = await this.prisma.paymentSplit.findMany({
      where: {
        order: {
          providerId,
          status: 'COMPLETED',
          createdAt: {
            ...(params.from && { gte: params.from }),
            ...(params.to && { lte: params.to }),
          },
        },
      },
      include: { order: { include: { service: true } } },
    });

    const total = splits.reduce((sum, s) => sum + s.providerAmount, 0);
    const platformTotal = splits.reduce((sum, s) => sum + s.platformAmount, 0);

    return {
      totalEarnings: total,
      totalOrders: splits.length,
      platformFees: platformTotal,
      splits,
    };
  }
}
