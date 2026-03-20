import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; perPage?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 20, 50);
    const skip = (page - 1) * perPage;
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        include: { profile: true },
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
    const user = await this.prisma.user.findUnique({ where: { id }, include: { profile: true, addresses: { where: { deletedAt: null } } } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.update({ where: { userId: id }, data: dto });
  }
  async findAddresses(id: string) {
    return this.prisma.userAddress.findMany({ where: { userId: id, deletedAt: null }, orderBy: { isDefault: 'desc' } });
  }
}
