import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { providerCategories: { where: { provider: { verificationStatus: 'APPROVED', isAvailable: true } } } } },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        services: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: { select: { providerCategories: true } },
      },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }
}
