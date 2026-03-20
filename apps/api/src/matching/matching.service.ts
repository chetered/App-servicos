import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingCacheService } from './matching.cache.service';

interface MatchingContext {
  clientId: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  scheduledAt: Date;
  radiusKm: number;
}

interface RankedProvider {
  searchId: string;
  providerId: string;
  totalScore: number;
  distanceKm: number;
  breakdown: Record<string, number>;
}

interface ProviderRow {
  id: string;
  overallRating: number;
  totalReviews: number;
  completionRate: number;
  acceptanceRate: number;
  verificationStatus: string;
  subscriptionPlan: string;
  createdAt: Date;
  totalCompletions: number;
  openDisputesCount: number;
  basePriceCents: number | null;
  lastKnownLatitude: number;
  lastKnownLongitude: number;
  serviceRadiusKm: number;
  bookingsToday: number;
  avgDailyCapacity: number;
  slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}

@Injectable()
export class MatchingService implements OnModuleInit {
  private readonly logger = new Logger(MatchingService.name);

  // ─── Pesos (hot-reload via Redis pub/sub) ────────────────────────────────
  private WEIGHTS = {
    distance: 0.20, rating: 0.25, completion: 0.20, acceptance: 0.10,
    availability: 0.10, trust: 0.10, recurrence: 0.03, price: 0.02,
  };

  private readonly FAIRNESS = { maxConcentration: 0.15, lowActivityThreshold: 5, lowActivityBoost: 1.15 };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MatchingCacheService,
  ) {}

  async onModuleInit() {
    await this.cache.subscribeToWeightsUpdate((weights) => {
      this.WEIGHTS = { ...this.WEIGHTS, ...weights };
      this.logger.log('Matching weights reloaded');
    });
  }

  // ─── PONTO DE ENTRADA ────────────────────────────────────────────────────
  async search(ctx: MatchingContext): Promise<RankedProvider[]> {
    const searchId = uuidv4();

    const candidates = await this.fetchCandidates(ctx);
    if (!candidates.length) {
      void this.logSearch(searchId, ctx, []);
      return [];
    }

    const [categoryAvgPrice, prevProviders] = await Promise.all([
      this.cache.getCategoryAvgPrice(ctx.categoryId).then((v) => v ?? this.computeAndCacheAvgPrice(ctx.categoryId)),
      this.cache.getClientPreviousProviders(ctx.clientId),
    ]);

    const scored = candidates.map((p) => {
      const dist = this.haversine(ctx.latitude, ctx.longitude, p.lastKnownLatitude, p.lastKnownLongitude);
      const breakdown = {
        distanceScore:        this.scoreDistance(dist, p.serviceRadiusKm),
        ratingScore:          this.scoreRating(p.overallRating, p.totalReviews),
        completionScore:      this.scoreCompletion(p.completionRate),
        acceptanceScore:      this.scoreAcceptance(p.acceptanceRate),
        availabilityScore:    this.scoreAvailability(p, ctx.scheduledAt),
        trustScore:           this.scoreTrust(p),
        recurrenceBonus:      prevProviders.includes(p.id) ? 1 : 0,
        priceCompetitiveness: this.scorePrice(p.basePriceCents ?? 15000, categoryAvgPrice),
      };

      const boost = this.newProviderBoost(p.totalCompletions);
      const raw = Object.entries(this.WEIGHTS).reduce((sum, [k, w]) => {
        const key = k === 'distance' ? 'distanceScore' : k === 'rating' ? 'ratingScore'
          : k === 'completion' ? 'completionScore' : k === 'acceptance' ? 'acceptanceScore'
          : k === 'availability' ? 'availabilityScore' : k === 'trust' ? 'trustScore'
          : k === 'recurrence' ? 'recurrenceBonus' : 'priceCompetitiveness';
        return sum + w * (breakdown[key as keyof typeof breakdown] ?? 0);
      }, 0);

      return {
        searchId,
        providerId: p.id,
        totalScore: Math.min(1.0, raw * (1 + boost)),
        distanceKm: dist,
        breakdown: { ...breakdown, newProviderBoost: boost },
      };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);
    const fair = await this.applyFairness(scored, ctx);

    void this.logSearch(searchId, ctx, fair);
    return fair.slice(0, 20);
  }

  // ─── FETCH CANDIDATOS ────────────────────────────────────────────────────
  private async fetchCandidates(ctx: MatchingContext): Promise<ProviderRow[]> {
    const dow = ctx.scheduledAt.getDay();
    const time = `${String(ctx.scheduledAt.getHours()).padStart(2, '0')}:00`;

    const rows = await this.prisma.$queryRaw<ProviderRow[]>`
      SELECT
        pp.id,
        CAST(pp.overall_rating AS FLOAT)    AS "overallRating",
        pp.total_reviews                    AS "totalReviews",
        CAST(pp.completion_rate AS FLOAT)   AS "completionRate",
        CAST(pp.acceptance_rate AS FLOAT)   AS "acceptanceRate",
        pp.verification_status              AS "verificationStatus",
        pp.subscription_plan                AS "subscriptionPlan",
        pp.created_at                       AS "createdAt",
        pp.total_completions                AS "totalCompletions",
        pp.open_disputes_count              AS "openDisputesCount",
        pp.service_radius_km                AS "serviceRadiusKm",
        ppc.base_price_cents                AS "basePriceCents",
        CAST(loc.latitude  AS FLOAT)        AS "lastKnownLatitude",
        CAST(loc.longitude AS FLOAT)        AS "lastKnownLongitude",
        COALESCE(today.cnt, 0)              AS "bookingsToday",
        COALESCE(avg_cap.avg, 3)            AS "avgDailyCapacity"
      FROM provider_profiles pp
      JOIN LATERAL (
        SELECT latitude, longitude FROM provider_locations
        WHERE provider_id = pp.id ORDER BY recorded_at DESC LIMIT 1
      ) loc ON true
      JOIN provider_categories pc
        ON pc.provider_id = pp.id AND pc.category_id = ${ctx.categoryId}::uuid
      JOIN provider_availability pa
        ON pa.provider_id = pp.id
        AND pa.day_of_week = ${dow}
        AND pa.start_time::time <= ${time}::time
        AND pa.end_time::time > ${time}::time
        AND pa.is_available = true
      LEFT JOIN provider_price_configs ppc
        ON ppc.provider_id = pp.id AND ppc.category_id = ${ctx.categoryId}::uuid
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt FROM bookings
        WHERE provider_id = pp.id AND DATE(scheduled_at) = CURRENT_DATE
          AND status IN ('CONFIRMED','IN_PROGRESS')
      ) today ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(AVG(cnt), 3) AS avg FROM (
          SELECT COUNT(*) AS cnt FROM bookings
          WHERE provider_id = pp.id AND scheduled_at >= NOW() - INTERVAL '28 days'
            AND status = 'COMPLETED'
          GROUP BY DATE(scheduled_at)
        ) t
      ) avg_cap ON true
      WHERE pp.verification_status = 'APPROVED'
        AND pp.is_available = true
        AND pp.deleted_at IS NULL
        AND ST_DWithin(
          ST_MakePoint(loc.longitude, loc.latitude)::geography,
          ST_MakePoint(${ctx.longitude}, ${ctx.latitude})::geography,
          pp.service_radius_km * 1000
        )
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.provider_id = pp.id
            AND b.status IN ('CONFIRMED','IN_PROGRESS')
            AND b.scheduled_at BETWEEN
              ${ctx.scheduledAt}::timestamptz - INTERVAL '2 hours' AND
              ${ctx.scheduledAt}::timestamptz + INTERVAL '2 hours'
        )
      ORDER BY ST_Distance(
        ST_MakePoint(loc.longitude, loc.latitude)::geography,
        ST_MakePoint(${ctx.longitude}, ${ctx.latitude})::geography
      ) ASC
      LIMIT 100
    `;

    // Buscar slots de disponibilidade para calcAvailabilityScore
    const ids = rows.map((r) => r.id);
    if (!ids.length) return [];

    const slots = await this.prisma.providerAvailability.findMany({
      where: { providerId: { in: ids }, isAvailable: true },
      select: { providerId: true, dayOfWeek: true, startTime: true, endTime: true },
    });

    const slotMap = new Map<string, Array<{ dayOfWeek: number; startTime: string; endTime: string }>>();
    for (const s of slots) {
      const list = slotMap.get(s.providerId) ?? [];
      list.push({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime });
      slotMap.set(s.providerId, list);
    }

    return rows.map((r) => ({ ...r, slots: slotMap.get(r.id) ?? [] }));
  }

  // ─── FAIRNESS ────────────────────────────────────────────────────────────
  private async applyFairness(ranked: RankedProvider[], ctx: MatchingContext): Promise<RankedProvider[]> {
    const zone = await this.resolveZone(ctx.latitude, ctx.longitude);
    const dist = await this.cache.getZoneBookingDistribution(zone, ctx.categoryId);

    return ranked
      .filter((r) => (dist[r.providerId] ?? 0) < this.FAIRNESS.maxConcentration)
      .map((r) => {
        const monthly = (dist[r.providerId] ?? 0) * 100;
        if (monthly < this.FAIRNESS.lowActivityThreshold) {
          return { ...r, totalScore: Math.min(1.0, r.totalScore * this.FAIRNESS.lowActivityBoost) };
        }
        return r;
      });
  }

  // ─── LOG DE IMPRESSÕES ────────────────────────────────────────────────────
  private async logSearch(searchId: string, ctx: MatchingContext, results: RankedProvider[]): Promise<void> {
    try {
      await this.prisma.searchLog.create({
        data: {
          id: searchId, clientId: ctx.clientId, categoryId: ctx.categoryId,
          latitude: ctx.latitude, longitude: ctx.longitude,
          scheduledAt: ctx.scheduledAt, resultsCount: results.length,
        },
      });
      if (results.length) {
        await this.prisma.providerImpression.createMany({
          data: results.map((r, i) => ({
            searchId, providerId: r.providerId,
            position: i + 1, score: r.totalScore,
            featuresSnapshot: r.breakdown as object,
          })),
        });
      }
    } catch (e) {
      this.logger.error('logSearch failed', e);
    }
  }

  // ─── SCORERS ─────────────────────────────────────────────────────────────
  private scoreDistance(distKm: number, radiusKm: number): number {
    if (distKm > radiusKm) return 0;
    return Math.exp(-(Math.log(10) / radiusKm) * distKm);
  }

  private scoreRating(rating: number, reviews: number): number {
    const bayesian = (20 * 4.0 + rating * reviews) / (20 + reviews);
    return Math.max(0, (bayesian - 1) / 4);
  }

  private scoreCompletion(rate: number): number {
    if (rate >= 0.95) return 1.00;
    if (rate >= 0.90) return 0.85;
    if (rate >= 0.85) return 0.70;
    if (rate >= 0.80) return 0.50;
    if (rate >= 0.70) return 0.25;
    return 0.05;
  }

  private scoreAcceptance(rate: number): number {
    return Math.pow(rate, 2);
  }

  private scoreAvailability(p: ProviderRow, at: Date): number {
    const min = at.getHours() * 60 + at.getMinutes();
    const dow = at.getDay();
    const ok = p.slots.some((s) => s.dayOfWeek === dow
      && this.timeToMin(s.startTime) <= min && this.timeToMin(s.endTime) > min);
    if (!ok) return 0;
    const density = p.bookingsToday / Math.max(1, p.avgDailyCapacity);
    return Math.max(0.3, 1 - density * 0.5);
  }

  private scoreTrust(p: ProviderRow): number {
    let s = 0;
    if (p.verificationStatus === 'APPROVED') s += 0.4;
    else if (p.verificationStatus === 'SUBMITTED') s += 0.2;
    const months = (Date.now() - p.createdAt.getTime()) / (30 * 24 * 3600 * 1000);
    s += Math.min(0.2, (months / 24) * 0.2);
    s += Math.max(0, 0.2 - p.openDisputesCount * 0.05);
    if (p.subscriptionPlan !== 'FREE') s += 0.2;
    return Math.min(1, s);
  }

  private scorePrice(price: number, avg: number): number {
    if (!avg) return 0.5;
    const r = price / avg;
    if (r <= 0.80) return 1.00;
    if (r <= 0.95) return 0.75;
    if (r <= 1.05) return 0.50;
    if (r <= 1.20) return 0.25;
    return 0;
  }

  private newProviderBoost(total: number): number {
    if (total < 5) return 0.30;
    if (total < 10) return 0.20;
    if (total < 20) return 0.10;
    return 0;
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371, dLat = this.rad(lat2 - lat1), dLng = this.rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.rad(lat1)) * Math.cos(this.rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  private rad = (d: number) => (d * Math.PI) / 180;
  private timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); };

  private async resolveZone(lat: number, lng: number): Promise<string> {
    try {
      const res = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM service_zones
        WHERE ST_Contains(boundary, ST_MakePoint(${lng}, ${lat})) LIMIT 1
      `;
      return res[0]?.id ?? 'default';
    } catch { return 'default'; }
  }

  private async computeAndCacheAvgPrice(categoryId: string): Promise<number> {
    const res = await this.prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT COALESCE(AVG(base_price_cents), 15000) AS avg
      FROM provider_price_configs WHERE category_id = ${categoryId}::uuid
    `;
    const avg = res[0]?.avg ?? 15000;
    await this.cache.setCategoryAvgPrice(categoryId, avg);
    return avg;
  }
}
