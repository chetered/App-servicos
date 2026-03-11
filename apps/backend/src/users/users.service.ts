import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
        profile: { update: { displayName: data.fullName } },
      },
      select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true, roles: true },
    });
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, isSnapshot: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addAddress(userId: string, data: any) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data: { ...data, userId } });
  }

  async toggleFavorite(userId: string, providerId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const favorites: string[] = (profile?.favoriteProviders as string[]) || [];
    const isFav = favorites.includes(providerId);
    const updated = isFav
      ? favorites.filter((id) => id !== providerId)
      : [...favorites, providerId];
    await this.prisma.userProfile.update({
      where: { userId },
      data: { favoriteProviders: updated },
    });
    return { isFavorite: !isFav };
  }
}
