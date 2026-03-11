import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DisplacementService } from '../bookings/displacement.service';

export interface SearchProvidersParams {
  categoryId?: string;
  serviceId?: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  minRating?: number;
  maxPrice?: number;
  isAvailableNow?: boolean;
  acceptsRecurrence?: boolean;
  sortBy?: 'relevance' | 'price' | 'rating' | 'distance';
  cursor?: string;
  limit?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async searchProviders(params: SearchProvidersParams) {
    const {
      categoryId,
      serviceId,
      latitude,
      longitude,
      radiusKm = 20,
      minRating,
      maxPrice,
      isAvailableNow,
      sortBy = 'relevance',
      cursor,
      limit = 20,
    } = params;

    // Use PostGIS-like query with raw SQL for geospatial search
    // In production: use ST_DWithin with PostGIS extension
    // Simplified version using bounding box + JS distance filter

    const latDelta = radiusKm / 111; // ~1 degree = 111km
    const lonDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

    const providers = await this.prisma.provider.findMany({
      where: {
        status: 'ACTIVE',
        currentLatitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        currentLongitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta,
        },
        ...(minRating && { averageRating: { gte: minRating } }),
        ...(isAvailableNow && { isAvailableNow: true }),
        ...(categoryId && {
          services: {
            some: {
              service: { categoryId },
              isActive: true,
            },
          },
        }),
        ...(serviceId && {
          services: {
            some: { serviceId, isActive: true },
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        services: {
          where: { isActive: true },
          include: { service: true },
        },
        pricingRules: {
          where: { isActive: true },
          ...(serviceId && { where: { serviceId, isActive: true } }),
        },
        verification: { select: { status: true } },
        sponsoredSlots: {
          where: {
            isActive: true,
            endDate: { gte: new Date() },
          },
        },
      },
      take: limit + 1,
      orderBy: this.getSortOrder(sortBy),
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    // Apply geospatial filter precisely (JS-side)
    const filtered = providers.filter((p) => {
      if (!p.currentLatitude || !p.currentLongitude) return false;
      // Simple distance check (in production use PostGIS)
      const dLat = p.currentLatitude - latitude;
      const dLon = p.currentLongitude - longitude;
      const distance = Math.sqrt(dLat * dLat + dLon * dLon) * 111;
      return distance <= radiusKm;
    });

    // Apply sponsored boost to ranking
    const ranked = this.applyRankingWithSponsored(filtered, latitude, longitude);

    const hasMore = ranked.length > limit;
    const data = hasMore ? ranked.slice(0, -1) : ranked;

    return {
      data: data.map((p) => this.formatProviderResult(p, latitude, longitude)),
      meta: {
        hasMore,
        nextCursor: hasMore ? data[data.length - 1].id : null,
        total: data.length,
        limit,
      },
    };
  }

  async getCategories(countryCode = 'BR') {
    return this.prisma.serviceCategory.findMany({
      where: {
        isActive: true,
        parentId: null, // Top level only
        countryCategories: {
          some: { country: { code: countryCode }, isActive: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private getSortOrder(sortBy: string): any {
    switch (sortBy) {
      case 'rating': return { averageRating: 'desc' };
      case 'relevance': return { rankingScore: 'desc' };
      default: return { rankingScore: 'desc' };
    }
  }

  private applyRankingWithSponsored(providers: any[], clientLat: number, clientLon: number) {
    return providers
      .map((p) => {
        const baseScore = p.rankingScore || 0;
        const sponsorBoost = p.sponsoredSlots?.length > 0 ? 1.5 : 1;
        const finalScore = baseScore * sponsorBoost;
        return { ...p, _finalScore: finalScore };
      })
      .sort((a, b) => b._finalScore - a._finalScore);
  }

  private formatProviderResult(provider: any, clientLat: number, clientLon: number) {
    const distanceKm = provider.currentLatitude && provider.currentLongitude
      ? Math.sqrt(
          Math.pow((provider.currentLatitude - clientLat) * 111, 2) +
          Math.pow((provider.currentLongitude - clientLon) * 111, 2),
        )
      : null;

    return {
      id: provider.id,
      user: provider.user,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      totalCompletedJobs: provider.totalCompletedJobs,
      isVerified: provider.verification?.status === 'APPROVED',
      isPremium: provider.isPremium,
      isSponsored: provider.sponsoredSlots?.length > 0,
      isAvailableNow: provider.isAvailableNow,
      distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : null,
      startingPrice: provider.pricingRules?.[0]?.basePrice || null,
      services: provider.services?.map((ps: any) => ps.service?.name),
    };
  }
}
