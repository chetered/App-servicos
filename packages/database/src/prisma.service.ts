import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env['NODE_ENV'] === 'development'
          ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');

    // Log slow queries in development
    if (process.env['NODE_ENV'] === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.$on as any)('query', (e: { query: string; duration: number }) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /** Utilitário para testes: limpar o banco em ordem respeitando FKs */
  async cleanDatabase(): Promise<void> {
    if (process.env['NODE_ENV'] !== 'test') {
      throw new Error('cleanDatabase() only allowed in test environment');
    }
    const tableNames = [
      'analytics_events',
      'provider_impressions',
      'search_logs',
      'trust_score_history',
      'trust_scores',
      'disputes',
      'review_responses',
      'reviews',
      'wallet_transactions',
      'wallets',
      'payouts',
      'commissions',
      'payments',
      'booking_timeline',
      'recurring_bookings',
      'bookings',
      'provider_services',
      'provider_categories',
      'provider_price_configs',
      'provider_availability',
      'provider_locations',
      'provider_documents',
      'provider_profiles',
      'user_addresses',
      'user_consents',
      'devices',
      'otp_codes',
      'refresh_tokens',
      'user_sessions',
      'user_profiles',
      'users',
      'categories',
      'system_configs',
      'feature_flags',
    ];
    for (const table of tableNames) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
  }
}
