import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(countryCode?: string) {
    if (countryCode) {
      const country = await this.prisma.country.findUnique({
        where: { code: countryCode },
        include: {
          categories: {
            include: {
              category: {
                where: { isActive: true, parentId: null },
                include: { children: { where: { isActive: true } } },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
      return country?.categories.map((cc) => cc.category) ?? [];
    }

    return this.prisma.serviceCategory.findMany({
      where: { isActive: true, parentId: null },
      include: { children: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(slug: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        services: { where: { isActive: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category '${slug}' not found`);
    return category;
  }

  async findServices(categorySlug: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug: categorySlug },
    });
    if (!category) throw new NotFoundException(`Category '${categorySlug}' not found`);

    return this.prisma.service.findMany({
      where: { categoryId: category.id, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findService(serviceSlug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug: serviceSlug },
      include: { category: true },
    });
    if (!service) throw new NotFoundException(`Service '${serviceSlug}' not found`);
    return service;
  }
}
