import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { providers: true } },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isActive: true },
      include: {
        services: { orderBy: { name: 'asc' } },
        _count: { select: { providers: true } },
      },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }
}
