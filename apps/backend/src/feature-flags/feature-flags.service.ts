import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FeatureFlagsService {
  // Simple in-memory cache to avoid DB queries on every request
  private cache: Map<string, boolean> = new Map();
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  async isEnabled(key: string, countryCode?: string): Promise<boolean> {
    const cacheKey = `${key}:${countryCode ?? 'global'}`;

    if (Date.now() < this.cacheExpiresAt && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const country = countryCode
      ? await this.prisma.country.findUnique({ where: { code: countryCode } })
      : null;

    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        key,
        OR: [
          { countryId: country?.id ?? null },
          { countryId: null },
        ],
      },
      orderBy: { countryId: 'asc' }, // country-specific first
    });

    let enabled = false;
    if (flag) {
      if (flag.status === 'ENABLED') enabled = true;
      else if (flag.status === 'ROLLOUT' && flag.rolloutPercentage) {
        // Consistent hash: same user/country gets same result
        const hash = this.simpleHash(cacheKey) % 100;
        enabled = hash < flag.rolloutPercentage;
      }
    }

    this.cache.set(cacheKey, enabled);
    this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;
    return enabled;
  }

  invalidateCache() {
    this.cache.clear();
    this.cacheExpiresAt = 0;
  }

  private simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
}
