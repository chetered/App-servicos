import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingCacheService } from './matching.cache.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'feature-updates',
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    }),
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingCacheService],
  exports: [MatchingService],
})
export class MatchingModule {}
