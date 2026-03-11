import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Analytics Service — Captura eventos para BI e ML futuro.
 * Schema de evento: { type, actorId, actorType, entityType, entityId, properties }
 */
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(event: {
    type: string;
    actorId?: string;
    actorType?: string;
    entityType?: string;
    entityId?: string;
    properties?: Record<string, any>;
    sessionId?: string;
    countryCode?: string;
    city?: string;
  }) {
    return this.prisma.analyticsEvent.create({ data: event });
  }

  // ── Domain event listeners ──────────────────────────────────

  @OnEvent('booking.created')
  async onBookingCreated(payload: any) {
    await this.track({
      type: 'booking_created',
      actorId: payload.clientId,
      actorType: 'USER',
      entityType: 'ORDER',
      entityId: payload.bookingId,
      properties: {
        providerId: payload.providerId,
        serviceId: payload.serviceId,
        amount: payload.amount,
      },
    });
  }

  @OnEvent('booking.completed')
  async onBookingCompleted(payload: any) {
    await this.track({
      type: 'booking_completed',
      entityType: 'ORDER',
      entityId: payload.bookingId,
    });
  }

  @OnEvent('payment.processed')
  async onPaymentProcessed(payload: any) {
    await this.track({
      type: 'payment_processed',
      entityType: 'PAYMENT',
      entityId: payload.paymentId,
      properties: { status: payload.status, amount: payload.amount },
    });
  }

  // ── Admin metrics ────────────────────────────────────────────

  async getDashboardMetrics(from: Date, to: Date) {
    const [ordersCompleted, ordersTotal, newUsers] = await Promise.all([
      this.prisma.serviceOrder.count({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } } }),
      this.prisma.serviceOrder.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    ]);

    const gmvResult = await this.prisma.serviceOrder.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } },
      _sum: { totalAmount: true },
    });

    const platformRevenueResult = await this.prisma.monetizationLedger.aggregate({
      where: { recordedAt: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    const gmv = gmvResult._sum.totalAmount || 0;
    const revenue = platformRevenueResult._sum.amount || 0;

    return {
      gmv,
      revenue,
      takeRate: gmv > 0 ? (revenue / gmv) * 100 : 0,
      ordersTotal,
      ordersCompleted,
      completionRate: ordersTotal > 0 ? (ordersCompleted / ordersTotal) * 100 : 0,
      newUsers,
      avgTicket: ordersCompleted > 0 ? gmv / ordersCompleted : 0,
    };
  }
}
