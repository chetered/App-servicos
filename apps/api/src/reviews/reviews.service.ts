import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, RespondReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, clientId: userId, status: 'COMPLETED', deletedAt: null },
      include: { provider: true },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado ou não concluído');

    const existing = await this.prisma.review.findUnique({ where: { bookingId: dto.bookingId } });
    if (existing) throw new ConflictException('Avaliação já enviada para este agendamento');

    const review = await this.prisma.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          bookingId: dto.bookingId,
          reviewerId: userId,
          reviewedId: booking.provider.userId,
          rating: dto.rating,
          comment: dto.comment,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      // Recalculate provider average rating
      const stats = await tx.review.aggregate({
        where: { reviewedId: booking.provider.userId, status: 'PUBLISHED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          overallRating: stats._avg.rating ?? 0,
          totalReviews: stats._count.rating,
        },
      });

      return rev;
    });

    return review;
  }

  async respond(reviewId: string, userId: string, dto: RespondReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId },
      include: { reviewed: true, response: true },
    });
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    if (review.reviewed.id !== userId) throw new ForbiddenException('Apenas o prestador pode responder');
    if (review.response) throw new ConflictException('Resposta já enviada');

    return this.prisma.reviewResponse.create({
      data: { reviewId, authorId: userId, content: dto.response },
    });
  }

  async findByProvider(providerUserId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [total, items] = await Promise.all([
      this.prisma.review.count({ where: { reviewedId: providerUserId, status: 'PUBLISHED' } }),
      this.prisma.review.findMany({
        where: { reviewedId: providerUserId, status: 'PUBLISHED' },
        include: {
          reviewer: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
          response: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(perPage, 50),
      }),
    ]);

    return {
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }
}
