import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; perPage?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 20, 50);
    const skip = (page - 1) * perPage;
    const [total, items] = await Promise.all([
      this.prisma.providerProfile.count({ where: { deletedAt: null } }),
      this.prisma.providerProfile.findMany({
        where: { deletedAt: null },
        include: { user: { include: { profile: true } }, categories: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
    ]);
    return {
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage), hasNextPage: skip + perPage < total, hasPrevPage: page > 1 },
    };
  }

  async findById(id: string) {
    const p = await this.prisma.providerProfile.findUnique({ where: { id }, include: { user: { include: { profile: true } }, categories: { include: { category: true } }, availability: true } });
    if (!p) throw new NotFoundException('Prestador não encontrado');
    return p;
  }
  async findByUserId(userId: string) {
    const p = await this.prisma.providerProfile.findUnique({ where: { userId }, include: { user: { include: { profile: true } }, categories: { include: { category: true } }, availability: true } });
    if (!p) throw new NotFoundException('Perfil de prestador não encontrado');
    return p;
  }
  async updateAvailability(userId: string, slots: Array<{dayOfWeek:number;startTime:string;endTime:string}>) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil não encontrado');
    await this.prisma.providerAvailability.deleteMany({ where: { providerId: profile.id } });
    return this.prisma.providerAvailability.createMany({ data: slots.map(s => ({ ...s, providerId: profile.id })) });
  }
}
