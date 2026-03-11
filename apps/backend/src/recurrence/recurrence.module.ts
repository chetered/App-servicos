import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RecurrenceController } from './recurrence.controller';
import { RecurrenceService } from './recurrence.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'recurrence' })],
  controllers: [RecurrenceController],
  providers: [RecurrenceService],
  exports: [RecurrenceService],
})
export class RecurrenceModule {}
