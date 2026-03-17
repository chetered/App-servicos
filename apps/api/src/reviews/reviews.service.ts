import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, RespondReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, clientId: userId, status: 'COMPLETED', deletedAt: null },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado ou não concluído');

    const existing = await this.prisma.review.findUnique({ where: { bookingId: dto.bookingId } });
    if (existing) throw new ConflictException('Avaliação já enviada para este agendamento');

    const review = await this.prisma.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          bookingId: dto.bookingId,
          clientId: userId,
          providerId: booking.providerId,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: { client: { include: { profile: true } } },
      });

      // Recalculate provider average rating
      const stats = await tx.review.aggregate({
        where: { providerId: booking.providerId, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          avgRating: stats._avg.rating ?? 0,
          totalReviews: stats._count.rating,
        },
      });

      return rev;
    });

    return review;
  }

  async respond(reviewId: string, userId: string, dto: RespondReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
      include: { provider: true },
    });
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    if (review.provider.userId !== userId) throw new ForbiddenException('Apenas o prestador pode responder');
    if (review.reviewResponse) throw new ConflictException('Resposta já enviada');

    return this.prisma.reviewResponse.create({
      data: { reviewId, response: dto.response },
    });
  }

  async findByProvider(providerId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [total, items] = await Promise.all([
      this.prisma.review.count({ where: { providerId, deletedAt: null } }),
      this.prisma.review.findMany({
        where: { providerId, deletedAt: null },
        include: {
          client: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
          reviewResponse: true,
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
