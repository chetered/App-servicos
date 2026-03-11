import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TrustService {
  private readonly logger = new Logger(TrustService.name);

  constructor(private prisma: PrismaService) {}

  // ── Public queries ────────────────────────────────────────────

  async getScore(userId: string) {
    return this.prisma.trustScore.findUnique({ where: { userId } });
  }

  // ── Score recalculation ───────────────────────────────────────

  async recalculateForUser(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: { verification: true },
    });

    // Identity score: based on document verification
    let identityScore = 0;
    if (provider?.verification?.status === 'APPROVED') {
      identityScore = provider.verification.identityScore ?? 80;
    } else if (provider?.verification?.status === 'PENDING') {
      identityScore = 30;
    }

    // Rating score: average rating normalized to 0-100
    const ratingScore = provider ? ((provider.averageRating ?? 0) / 5) * 100 : 0;

    // Completion score: completion rate
    const completionScore = provider?.completionRate ?? 0;

    // Behavior score: no disputes decided against
    let behaviorScore = 100;
    if (provider) {
      const totalOrders = await this.prisma.serviceOrder.count({
        where: { providerId: provider.id, status: { in: ['COMPLETED', 'CANCELLED_BY_PROVIDER'] } },
      });
      const disputesAgainst = await this.prisma.dispute.count({
        where: { order: { providerId: provider.id }, decidedFor: 'CLIENT' },
      });
      if (totalOrders > 0) {
        behaviorScore = Math.max(0, 100 - (disputesAgainst / totalOrders) * 100);
      }
    }

    // Weighted average
    const overallScore =
      identityScore * 0.25 +
      behaviorScore * 0.25 +
      ratingScore * 0.25 +
      completionScore * 0.25;

    return this.prisma.trustScore.upsert({
      where: { userId },
      update: { overallScore, identityScore, behaviorScore, ratingScore, completionScore, recalculatedAt: new Date() },
      create: { userId, overallScore, identityScore, behaviorScore, ratingScore, completionScore },
    });
  }

  async recalculateRankingScore(providerId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) return;

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Acceptance rate (last 30d)
    const acceptanceRate = provider.acceptanceRate ?? 50;
    const acceptanceScore = acceptanceRate;

    // Completion rate (last 90d)
    const completionScore = provider.completionRate ?? 50;

    // Rating score (all time)
    const ratingScore = ((provider.averageRating ?? 0) / 5) * 100;

    // Response time score (lower is better; target <5min = 100, >60min = 0)
    const responseMinutes = provider.responseTimeMinutes ?? 30;
    const responseScore = Math.max(0, 100 - (responseMinutes / 60) * 100);

    // Recurrence score: % of returning clients
    const totalClients = await this.prisma.serviceOrder.findMany({
      where: { providerId, status: 'COMPLETED', createdAt: { gte: last90Days } },
      select: { clientId: true },
      distinct: ['clientId'],
    });
    const returningClients = await this.prisma.serviceOrder.groupBy({
      by: ['clientId'],
      where: { providerId, status: 'COMPLETED', createdAt: { gte: last90Days } },
      having: { clientId: { _count: { gt: 1 } } },
    });
    const recurrenceScore =
      totalClients.length > 0 ? (returningClients.length / totalClients.length) * 100 : 0;

    // Reliability score: no late cancellations (last 30d)
    const lateCancellations = await this.prisma.serviceOrder.count({
      where: {
        providerId,
        status: 'CANCELLED_BY_PROVIDER',
        createdAt: { gte: last30Days },
      },
    });
    const reliabilityScore = Math.max(0, 100 - lateCancellations * 10);

    const score =
      ratingScore * 0.35 +
      acceptanceScore * 0.2 +
      completionScore * 0.2 +
      responseScore * 0.15 +
      recurrenceScore * 0.05 +
      reliabilityScore * 0.05;

    await this.prisma.$transaction([
      this.prisma.provider.update({
        where: { id: providerId },
        data: { rankingScore: score },
      }),
      this.prisma.providerRankingScore.create({
        data: {
          providerId,
          score,
          ratingScore,
          acceptanceScore,
          completionScore,
          responseScore,
          recurrenceScore,
          reliabilityScore,
        },
      }),
    ]);

    return score;
  }

  // ── Domain event listeners ────────────────────────────────────

  @OnEvent('review.created')
  async onReviewCreated(payload: { providerId: string; rating: number }) {
    const provider = await this.prisma.provider.findUnique({ where: { id: payload.providerId } });
    if (provider) {
      await this.recalculateForUser(provider.userId);
      await this.recalculateRankingScore(payload.providerId);
    }
  }

  @OnEvent('dispute.opened')
  async onDisputeOpened(payload: { orderId: string }) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id: payload.orderId } });
    if (order) {
      const provider = await this.prisma.provider.findUnique({ where: { id: order.providerId } });
      if (provider) await this.recalculateForUser(provider.userId);
    }
  }

  // ── Weekly full recalculation ─────────────────────────────────

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyRecalculation() {
    this.logger.log('Running weekly trust score recalculation...');

    const providers = await this.prisma.provider.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, userId: true },
    });

    for (const provider of providers) {
      try {
        await this.recalculateForUser(provider.userId);
        await this.recalculateRankingScore(provider.id);
      } catch (err) {
        this.logger.error(`Failed to recalculate trust for provider ${provider.id}:`, err);
      }
    }

    this.logger.log(`Recalculated trust scores for ${providers.length} providers`);
  }
}
