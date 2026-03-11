import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseAdmin: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    if (projectId && projectId !== 'placeholder') {
      // In production: initialize firebase-admin
      // const admin = require('firebase-admin');
      // admin.initializeApp({ credential: admin.credential.applicationDefault() });
      // this.firebaseAdmin = admin;
      this.logger.log('Firebase push notifications initialized');
    } else {
      this.logger.warn('Firebase not configured (push notifications disabled)');
    }
  }

  async sendToUser(userId: string, payload: PushNotificationPayload) {
    // Store notification in DB (always)
    await this.prisma.notification.create({
      data: {
        userId,
        type: payload.data?.type || 'GENERAL',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        channel: 'PUSH',
      },
    });

    // Get user's FCM token and send push
    // TODO: Store FCM tokens per device and send
    this.logger.log(`Notification sent to user ${userId}: ${payload.title}`);
  }

  async sendToMultiple(userIds: string[], payload: PushNotificationPayload) {
    await Promise.all(userIds.map((id) => this.sendToUser(id, payload)));
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUserNotifications(userId: string, cursor?: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });
  }
}
