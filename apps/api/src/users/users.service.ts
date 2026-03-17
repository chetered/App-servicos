import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
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
