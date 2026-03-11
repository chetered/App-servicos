import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PricingService } from './pricing.service';
import { DisplacementService } from './displacement.service';
import { BookingStatusService } from './booking-status.service';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'bookings' }),
    PaymentsModule,
    NotificationsModule,
    CommissionsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, PricingService, DisplacementService, BookingStatusService],
  exports: [BookingsService, PricingService],
})
export class BookingsModule {}
