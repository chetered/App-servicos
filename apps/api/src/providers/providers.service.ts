import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}
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
