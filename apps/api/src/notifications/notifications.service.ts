import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';

export interface SendNotificationOptions {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async send(opts: SendNotificationOptions) {
    const channels = opts.channels ?? ['IN_APP', 'PUSH'];

    // Persist in-app notification
    if (channels.includes('IN_APP')) {
      await this.prisma.notification.create({
        data: {
          userId: opts.userId,
          type: opts.type as never,
          title: opts.title,
          body: opts.body,
          data: opts.data ?? {},
        },
      });
    }

    // Push via Firebase FCM
    if (channels.includes('PUSH')) {
      await this.sendPush(opts.userId, opts.title, opts.body, opts.data);
    }

    return { sent: true };
  }

  async findAll(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(perPage, 50),
      }),
    ]);

    return {
      data: items,
      meta: { total, page, perPage, unreadCount: await this.prisma.notification.count({ where: { userId, readAt: null } }) },
    };
  }

  async markRead(userId: string, ids?: string[]) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  private async sendPush(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const devices = await this.prisma.device.findMany({
      where: { userId, pushToken: { not: null } },
      select: { pushToken: true, platform: true },
    });

    if (!devices.length) return;

    // In a real implementation, batch-send via Firebase Admin SDK
    for (const device of devices) {
      this.logger.debug(`[FCM] -> ${device.platform} ${device.pushToken?.slice(0, 20)}... | ${title}`);
    }
  }
}
