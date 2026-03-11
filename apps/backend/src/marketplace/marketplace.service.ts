import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface SearchProvidersDto {
  categorySlug?: string;
  serviceSlug?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  bookingType?: 'IMMEDIATE' | 'SCHEDULED';
  countryCode?: string;
  query?: string; // Search by provider name
  page?: number;
  limit?: number;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async searchProviders(dto: SearchProvidersDto, requesterId?: string) {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = { status: 'ACTIVE' };

    if (dto.bookingType === 'IMMEDIATE') {
      where.isAvailableNow = true;
    }

    // Filter by category or service
    if (dto.categorySlug || dto.serviceSlug) {
      const serviceWhere: any = { isActive: true };
      if (dto.serviceSlug) serviceWhere.slug = dto.serviceSlug;
      if (dto.categorySlug) serviceWhere.category = { slug: dto.categorySlug };

      where.services = { some: { service: serviceWhere } };
    }

    // Geo filter (simple radius using bounding box; upgrade to PostGIS for production)
    if (dto.latitude && dto.longitude && dto.radiusKm) {
      const latDelta = dto.radiusKm / 111; // 1 degree lat ≈ 111km
      const lngDelta = dto.radiusKm / (111 * Math.cos((dto.latitude * Math.PI) / 180));

      where.currentLatitude = { gte: dto.latitude - latDelta, lte: dto.latitude + latDelta };
      where.currentLongitude = { gte: dto.longitude - lngDelta, lte: dto.longitude + lngDelta };
    }

    // Name search
    if (dto.query) {
      where.user = { fullName: { contains: dto.query, mode: 'insensitive' } };
    }

    // Check for sponsored slots to boost
    const sponsoredProviderIds = await this.getSponsoredProviderIds(dto.categorySlug);

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
          services: {
            where: { isActive: true },
            include: { service: { include: { category: true } } },
            take: 5,
          },
          pricingRules: { where: { isActive: true }, take: 3 },
          verification: { select: { status: true } },
          sponsoredSlots: {
            where: { isActive: true, endDate: { gte: new Date() } },
            take: 1,
          },
        },
        orderBy: { rankingScore: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.provider.count({ where }),
    ]);

    // Apply sponsored boost to ranking order
    const ranked = this.applyRankingBoosts(providers, sponsoredProviderIds);

    // Emit search analytics
    if (requesterId) {
      this.eventEmitter.emit('search.performed', {
        actorId: requesterId,
        categorySlug: dto.categorySlug,
        latitude: dto.latitude,
        longitude: dto.longitude,
        resultsCount: total,
      });
    }

    return {
      items: ranked,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProviderProfile(providerId: string, viewerId?: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { fullName: true, avatarUrl: true, createdAt: true } },
        services: {
          where: { isActive: true },
          include: { service: { include: { category: true } } },
        },
        pricingRules: { where: { isActive: true } },
        availability: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
        verification: { select: { status: true, verifiedAt: true } },
        displacementRule: true,
        zones: true,
        sponsoredSlots: { where: { isActive: true, endDate: { gte: new Date() } }, take: 1 },
      },
    });

    if (!provider) return null;

    // Get recent published reviews
    const reviews = await this.prisma.review.findMany({
      where: { targetId: provider.userId, isPublished: true, isFlagged: false },
      include: { author: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Emit view event
    if (viewerId && viewerId !== provider.userId) {
      this.eventEmitter.emit('provider.viewed', { providerId, viewerId });
    }

    return { ...provider, reviews };
  }

  async getFeaturedProviders(countryCode?: string, categorySlug?: string) {
    return this.prisma.provider.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ isFeatured: true }, { isPremium: true }],
      },
      include: {
        user: { select: { fullName: true, avatarUrl: true } },
        verification: { select: { status: true } },
      },
      orderBy: { rankingScore: 'desc' },
      take: 10,
    });
  }

  async updateProviderLocation(providerId: string, latitude: number, longitude: number) {
    return this.prisma.provider.update({
      where: { id: providerId },
      data: { currentLatitude: latitude, currentLongitude: longitude, isAvailableNow: true },
    });
  }

  async toggleAvailability(providerId: string, isAvailable: boolean) {
    return this.prisma.provider.update({
      where: { id: providerId },
      data: { isAvailableNow: isAvailable },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async getSponsoredProviderIds(categorySlug?: string): Promise<string[]> {
    const now = new Date();
    const slots = await this.prisma.sponsoredSlot.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { providerId: true },
    });
    return slots.map((s) => s.providerId);
  }

  private applyRankingBoosts(providers: any[], sponsoredIds: string[]) {
    return providers
      .map((p) => ({
        ...p,
        isSponsored: sponsoredIds.includes(p.id),
        effectiveScore:
          (p.rankingScore ?? 0) *
          (sponsoredIds.includes(p.id) ? 1.5 : 1) *
          (p.isPremium ? 1.1 : 1),
      }))
      .sort((a, b) => b.effectiveScore - a.effectiveScore);
  }
}
