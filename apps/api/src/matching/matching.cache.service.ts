import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class MatchingCacheService implements OnModuleInit {
  private readonly logger = new Logger(MatchingCacheService.name);
  private redis!: Redis;

  private readonly TTL = {
    batchFeatures: 3600,
    realtimeFeatures: 300,
    categoryAvgPrice: 1800,
    clientHistory: 900,
    bookingDistribution: 300,
  };

  constructor(private readonly config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, { lazyConnect: false, enableReadyCheck: false, maxRetriesPerRequest: null });
    this.redis.on('error', (e) => this.logger.warn(`Redis error: ${e.message}`));
  }

  onModuleInit() { /* Redis initialized in constructor */ }

  async getCategoryAvgPrice(categoryId: string): Promise<number | null> {
    const val = await this.redis.get(`matching:price:cat:${categoryId}`);
    return val ? parseFloat(val) : null;
  }

  async setCategoryAvgPrice(categoryId: string, avg: number): Promise<void> {
    await this.redis.setex(`matching:price:cat:${categoryId}`, this.TTL.categoryAvgPrice, String(avg));
  }

  async getClientPreviousProviders(clientId: string): Promise<string[]> {
    const val = await this.redis.get(`matching:history:client:${clientId}`);
    return val ? (JSON.parse(val) as string[]) : [];
  }

  async setClientPreviousProviders(clientId: string, ids: string[]): Promise<void> {
    await this.redis.setex(`matching:history:client:${clientId}`, this.TTL.clientHistory, JSON.stringify(ids));
  }

  async getZoneBookingDistribution(zone: string, categoryId: string): Promise<Record<string, number>> {
    const val = await this.redis.get(`matching:fairness:${zone}:${categoryId}`);
    return val ? (JSON.parse(val) as Record<string, number>) : {};
  }

  async publishWeightsUpdate(weights: Record<string, number>): Promise<void> {
    await this.redis.publish('matching:weights:update', JSON.stringify(weights));
  }

  async subscribeToWeightsUpdate(cb: (w: Record<string, number>) => void): Promise<void> {
    const sub = this.redis.duplicate();
    await sub.subscribe('matching:weights:update');
    sub.on('message', (_, msg) => {
      try { cb(JSON.parse(msg) as Record<string, number>); } catch { /* ignore */ }
    });
  }
}
