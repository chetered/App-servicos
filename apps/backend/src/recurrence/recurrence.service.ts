import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Logger } from '@nestjs/common';

export interface CreateRecurringPlanDto {
  serviceId: string;
  providerId?: string;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  preferredDayOfWeek: number; // 0-6
  preferredTime: string; // HH:mm
  totalOccurrences?: number;
}

@Injectable()
export class RecurrenceService {
  private readonly logger = new Logger(RecurrenceService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('recurrence') private recurrenceQueue: Queue,
  ) {}

  async createPlan(clientId: string, dto: CreateRecurringPlanDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    const nextScheduledAt = this.calculateNextDate(dto.preferredDayOfWeek, dto.preferredTime);

    const plan = await this.prisma.recurringServicePlan.create({
      data: {
        clientId,
        serviceId: dto.serviceId,
        providerId: dto.providerId,
        frequency: dto.frequency,
        preferredDayOfWeek: dto.preferredDayOfWeek,
        preferredTime: dto.preferredTime,
        totalOccurrences: dto.totalOccurrences,
        nextScheduledAt,
        status: 'ACTIVE',
      },
    });

    // Create initial payment schedules (next 4 occurrences)
    await this.generateUpcomingSchedules(plan.id, 4);

    return plan;
  }

  async findMyPlans(clientId: string) {
    return this.prisma.recurringServicePlan.findMany({
      where: { clientId },
      include: {
        paymentSchedules: { orderBy: { scheduledFor: 'asc' }, take: 5 },
        executions: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pausePlan(planId: string, clientId: string) {
    const plan = await this.prisma.recurringServicePlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.clientId !== clientId) throw new ForbiddenException('Not your plan');
    if (plan.status !== 'ACTIVE') throw new BadRequestException('Plan is not active');

    return this.prisma.recurringServicePlan.update({
      where: { id: planId },
      data: { status: 'PAUSED', pausedAt: new Date() },
    });
  }

  async resumePlan(planId: string, clientId: string) {
    const plan = await this.prisma.recurringServicePlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.clientId !== clientId) throw new ForbiddenException('Not your plan');
    if (plan.status !== 'PAUSED') throw new BadRequestException('Plan is not paused');

    const nextScheduledAt = this.calculateNextDate(plan.preferredDayOfWeek!, plan.preferredTime!);

    return this.prisma.recurringServicePlan.update({
      where: { id: planId },
      data: { status: 'ACTIVE', pausedAt: null, nextScheduledAt },
    });
  }

  async cancelPlan(planId: string, clientId: string, reason?: string) {
    const plan = await this.prisma.recurringServicePlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.clientId !== clientId) throw new ForbiddenException('Not your plan');
    if (plan.status === 'CANCELLED') throw new BadRequestException('Plan already cancelled');

    // Mark pending schedules as SKIPPED
    await this.prisma.paymentSchedule.updateMany({
      where: { planId, status: 'PENDING' },
      data: { status: 'SKIPPED' },
    });

    return this.prisma.recurringServicePlan.update({
      where: { id: planId },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    });
  }

  // ── Scheduler ─────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processScheduledRecurrences() {
    this.logger.log('Running recurrence scheduler...');

    const dueSchedules = await this.prisma.paymentSchedule.findMany({
      where: { status: 'PENDING', scheduledFor: { lte: new Date() } },
      include: { plan: true },
    });

    this.logger.log(`Found ${dueSchedules.length} due recurrence schedules`);

    for (const schedule of dueSchedules) {
      if (schedule.plan.status !== 'ACTIVE') {
        await this.prisma.paymentSchedule.update({
          where: { id: schedule.id },
          data: { status: 'SKIPPED' },
        });
        continue;
      }

      await this.recurrenceQueue.add('execute-recurrence', {
        scheduleId: schedule.id,
        planId: schedule.planId,
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  private calculateNextDate(dayOfWeek: number, preferredTime: string): Date {
    const now = new Date();
    const [hours, minutes] = preferredTime.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    // Advance to the next occurrence of the preferred day
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + (daysUntil === 0 ? 7 : daysUntil));

    return next;
  }

  private async generateUpcomingSchedules(planId: string, count: number) {
    const plan = await this.prisma.recurringServicePlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.nextScheduledAt) return;

    const schedules = [];
    let currentDate = new Date(plan.nextScheduledAt);

    for (let i = 0; i < count; i++) {
      schedules.push({ planId, scheduledFor: new Date(currentDate), status: 'PENDING' });
      currentDate = this.advanceByFrequency(currentDate, plan.frequency);
    }

    await this.prisma.paymentSchedule.createMany({ data: schedules });
  }

  private advanceByFrequency(date: Date, frequency: string): Date {
    const next = new Date(date);
    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }
}
