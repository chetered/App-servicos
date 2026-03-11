import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { subDays, startOfDay } from 'date-fns';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ── Platform KPIs ─────────────────────────────────────────────

  async getDashboardMetrics() {
    const now = new Date();
    const today = startOfDay(now);
    const last30 = subDays(today, 30);
    const last7 = subDays(today, 7);

    const [
      totalUsers,
      newUsersLast30,
      totalProviders,
      pendingProviders,
      totalOrders,
      ordersLast30,
      completedLast30,
      gmvLast30,
      revenueLast30,
      openTickets,
      openDisputes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: last30 } } }),
      this.prisma.provider.count(),
      this.prisma.provider.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.serviceOrder.count(),
      this.prisma.serviceOrder.count({ where: { createdAt: { gte: last30 } } }),
      this.prisma.serviceOrder.count({ where: { status: 'COMPLETED', createdAt: { gte: last30 } } }),
      this.prisma.serviceOrder.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: last30 } },
        _sum: { totalAmount: true },
      }),
      this.prisma.monetizationLedger.aggregate({
        where: { recordedAt: { gte: last30 } },
        _sum: { amount: true },
      }),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
    ]);

    const conversionRate = ordersLast30 > 0 ? (completedLast30 / ordersLast30) * 100 : 0;

    return {
      users: { total: totalUsers, newLast30Days: newUsersLast30 },
      providers: { total: totalProviders, pendingReview: pendingProviders },
      orders: {
        total: totalOrders,
        last30Days: ordersLast30,
        completedLast30Days: completedLast30,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      financial: {
        gmvLast30Days: gmvLast30._sum.totalAmount ?? 0,
        revenueLast30Days: revenueLast30._sum.amount ?? 0,
      },
      support: { openTickets, openDisputes },
    };
  }

  // ── User management ───────────────────────────────────────────

  async listUsers(search?: string, role?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    if (role) where.roles = { has: role };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true, provider: { select: { status: true, averageRating: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async banUser(userId: string, reason: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { isBanned: true, banReason: reason } }),
      this.prisma.auditLog.create({
        data: { actorId: adminId, action: 'user.banned', entityType: 'User', entityId: userId, newValues: { reason } },
      }),
    ]);
    return { success: true };
  }

  async unbanUser(userId: string, adminId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { isBanned: false, banReason: null } }),
      this.prisma.auditLog.create({
        data: { actorId: adminId, action: 'user.unbanned', entityType: 'User', entityId: userId },
      }),
    ]);
    return { success: true };
  }

  // ── Provider review queue ─────────────────────────────────────

  async listPendingProviders() {
    return this.prisma.provider.findMany({
      where: { status: { in: ['PENDING_REVIEW', 'UNDER_REVIEW'] } },
      include: {
        user: { select: { fullName: true, email: true, phone: true, createdAt: true } },
        documents: true,
        verification: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveProvider(providerId: string, adminId: string) {
    return this.prisma.$transaction([
      this.prisma.provider.update({
        where: { id: providerId },
        data: { status: 'ACTIVE', reviewedAt: new Date(), reviewedBy: adminId },
      }),
      this.prisma.auditLog.create({
        data: { actorId: adminId, action: 'provider.approved', entityType: 'Provider', entityId: providerId },
      }),
    ]);
  }

  async rejectProvider(providerId: string, adminId: string, notes: string) {
    return this.prisma.$transaction([
      this.prisma.provider.update({
        where: { id: providerId },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: adminId, reviewNotes: notes },
      }),
      this.prisma.auditLog.create({
        data: { actorId: adminId, action: 'provider.rejected', entityType: 'Provider', entityId: providerId, newValues: { notes } },
      }),
    ]);
  }

  // ── Orders ────────────────────────────────────────────────────

  async listOrders(status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        include: {
          client: { select: { fullName: true, email: true } },
          provider: { include: { user: { select: { fullName: true } } } },
          service: { select: { name: true } },
          payments: { select: { status: true, amount: true, gatewayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── Revenue analytics ─────────────────────────────────────────

  async getRevenueBySource(days = 30) {
    const since = subDays(new Date(), days);
    const breakdown = await this.prisma.monetizationLedger.groupBy({
      by: ['source'],
      where: { recordedAt: { gte: since } },
      _sum: { amount: true },
      _count: { id: true },
    });
    return breakdown.map((b) => ({ source: b.source, amount: b._sum.amount ?? 0, count: b._count.id }));
  }

  async getOrdersTimeSeries(days = 30) {
    const since = subDays(new Date(), days);
    const orders = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay: Record<string, { date: string; count: number; gmv: number }> = {};
    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (!byDay[key]) byDay[key] = { date: key, count: 0, gmv: 0 };
      byDay[key].count++;
      if (order.status === 'COMPLETED') byDay[key].gmv += order.totalAmount;
    }
    return Object.values(byDay);
  }

  // ── Feature flags ─────────────────────────────────────────────

  async listFeatureFlags(countryCode?: string) {
    const where: any = {};
    if (countryCode) {
      const country = await this.prisma.country.findUnique({ where: { code: countryCode } });
      if (country) where.countryId = country.id;
    }
    return this.prisma.featureFlag.findMany({ where, include: { country: true } });
  }

  async toggleFeatureFlag(key: string, countryId: string | null, status: string, adminId: string) {
    const flag = await this.prisma.featureFlag.findFirst({ where: { key, countryId } });
    if (!flag) throw new NotFoundException(`Feature flag '${key}' not found`);

    await this.prisma.$transaction([
      this.prisma.featureFlag.update({ where: { id: flag.id }, data: { status: status as any } }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'feature_flag.toggled',
          entityType: 'FeatureFlag',
          entityId: flag.id,
          newValues: { key, status },
        },
      }),
    ]);
    return { success: true };
  }

  // ── Audit log ─────────────────────────────────────────────────

  async getAuditLog(page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { actor: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, limit };
  }
}
