import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecurrenceService, CreateRecurringPlanDto } from './recurrence.service';

@ApiTags('Recurrence')
@Controller('recurrence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecurrenceController {
  constructor(private recurrenceService: RecurrenceService) {}

  @Post('plans')
  @ApiOperation({ summary: 'Create a recurring service plan' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRecurringPlanDto) {
    return this.recurrenceService.createPlan(userId, dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List my recurring plans' })
  findMy(@CurrentUser('id') userId: string) {
    return this.recurrenceService.findMyPlans(userId);
  }

  @Patch('plans/:id/pause')
  @ApiOperation({ summary: 'Pause a recurring plan' })
  pause(@Param('id') planId: string, @CurrentUser('id') userId: string) {
    return this.recurrenceService.pausePlan(planId, userId);
  }

  @Patch('plans/:id/resume')
  @ApiOperation({ summary: 'Resume a paused plan' })
  resume(@Param('id') planId: string, @CurrentUser('id') userId: string) {
    return this.recurrenceService.resumePlan(planId, userId);
  }

  @Patch('plans/:id/cancel')
  @ApiOperation({ summary: 'Cancel a recurring plan' })
  cancel(
    @Param('id') planId: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.recurrenceService.cancelPlan(planId, userId, reason);
  }
}
