import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { CategoriesModule } from './categories/categories.module';
import { SearchModule } from './search/search.module';
import { BookingsModule } from './bookings/bookings.module';
import { RecurrenceModule } from './recurrence/recurrence.module';
import { PaymentsModule } from './payments/payments.module';
import { CommissionsModule } from './commissions/commissions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { TrustModule } from './trust/trust.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LocalizationModule } from './localization/localization.module';
import { AdminModule } from './admin/admin.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';
import authConfig from './common/config/auth.config';
import paymentsConfig from './common/config/payments.config';
import notificationsConfig from './common/config/notifications.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, paymentsConfig, notificationsConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Queue system
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    // Events
    EventEmitterModule.forRoot({ wildcard: true }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Infrastructure
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProvidersModule,
    CategoriesModule,
    SearchModule,
    MarketplaceModule,
    BookingsModule,
    RecurrenceModule,
    PaymentsModule,
    CommissionsModule,
    PayoutsModule,
    TrustModule,
    ReviewsModule,
    SupportModule,
    NotificationsModule,
    AnalyticsModule,
    LocalizationModule,
    AdminModule,
    FeatureFlagsModule,
  ],
})
export class AppModule {}
