import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateReviewDto {
  orderId: string;
  rating: number; // 1-5
  comment?: string;
  photos?: string[];
}

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: dto.orderId },
      include: { provider: { include: { user: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.clientId !== authorId) throw new ForbiddenException('Not your order');
    if (order.status !== 'COMPLETED') throw new BadRequestException('Order must be COMPLETED to review');

    const existing = await this.prisma.review.findUnique({ where: { orderId: dto.orderId } });
    if (existing) throw new BadRequestException('Review already submitted for this order');

    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          orderId: dto.orderId,
          authorId,
          targetId: order.provider.userId,
          rating: dto.rating,
          comment: dto.comment,
          photos: dto.photos ?? [],
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      // Update provider average rating
      const stats = await tx.review.aggregate({
        where: { targetId: order.provider.userId, isPublished: true, isFlagged: false },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.provider.update({
        where: { id: order.providerId },
        data: {
          averageRating: stats._avg.rating ?? 0,
          totalReviews: stats._count.id,
        },
      });

      return r;
    });

    this.eventEmitter.emit('review.created', {
      reviewId: review.id,
      orderId: dto.orderId,
      providerId: order.providerId,
      rating: dto.rating,
    });

    return review;
  }

  async findByProvider(providerId: string, page = 1, limit = 20) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { targetId: provider.userId, isPublished: true, isFlagged: false },
        include: { author: { select: { fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { targetId: provider.userId, isPublished: true, isFlagged: false },
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async replyToReview(reviewId: string, providerId: string, reply: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider || review.targetId !== provider.userId) {
      throw new ForbiddenException('Not your review');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { providerReply: reply },
    });
  }

  async flagReview(reviewId: string, reason: string, reporterId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isFlagged: true, flagReason: `Reported by ${reporterId}: ${reason}` },
    });
  }

  // Admin: moderate flagged reviews
  async moderateFlagged(reviewId: string, approve: boolean, moderatorId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isPublished: approve,
        isFlagged: !approve,
        moderatedAt: new Date(),
        moderatedBy: moderatorId,
      },
    });
  }
}
