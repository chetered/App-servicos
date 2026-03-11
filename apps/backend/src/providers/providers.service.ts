import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        services: { include: { service: { include: { category: true } } } },
        pricingRules: true,
        availability: true,
        zones: true,
        displacementRule: true,
        verification: { select: { status: true } },
      },
    });
    if (!provider) throw new NotFoundException('Prestador não encontrado');
    return provider;
  }

  async getMyProvider(userId: string) {
    return this.prisma.provider.findUnique({
      where: { userId },
      include: {
        services: { include: { service: true } },
        pricingRules: true,
        availability: true,
        displacementRule: true,
        verification: true,
      },
    });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.provider.update({
      where: { userId },
      data: {
        bio: data.bio,
        yearsOfExperience: data.yearsOfExperience,
        serviceRadiusKm: data.serviceRadiusKm,
        isAvailableNow: data.isAvailableNow,
      },
    });
  }

  async getEarnings(userId: string, from?: Date, to?: Date) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new NotFoundException('Perfil de prestador não encontrado');

    const splits = await this.prisma.paymentSplit.findMany({
      where: {
        order: {
          providerId: provider.id,
          status: 'COMPLETED',
          ...(from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
        },
      },
      include: { order: { include: { service: true } } },
      orderBy: { order: { completedAt: 'desc' } },
    });

    const total = splits.reduce((s, p) => s + p.providerAmount, 0);
    return { total, pendingPayout: provider.pendingPayout, history: splits };
  }
}
