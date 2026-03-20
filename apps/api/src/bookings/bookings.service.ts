import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto, PaginationQueryDto } from './dto/bookings.dto';

const BOOKING_INCLUDE = {
  provider: { include: { user: { include: { profile: true } } } },
  service: true,
  address: true,
  review: true,
  payment: { select: { id: true, method: true, status: true, amountCents: true } },
} as const;

// State machine: quais transições são válidas por quem
const VALID_TRANSITIONS: Record<string, { from: string[]; actor: 'client' | 'provider' | 'system' }> = {
  CONFIRMED:          { from: ['PAYMENT_AUTHORIZED'], actor: 'provider' },
  PROVIDER_EN_ROUTE:  { from: ['CONFIRMED'],          actor: 'provider' },
  IN_PROGRESS:        { from: ['PROVIDER_EN_ROUTE'],  actor: 'provider' },
  COMPLETED:          { from: ['IN_PROGRESS'],         actor: 'provider' },
  CANCELLED_CLIENT:   { from: ['PAYMENT_AUTHORIZED', 'CONFIRMED'], actor: 'client' },
  CANCELLED_PROVIDER: { from: ['PAYMENT_AUTHORIZED', 'CONFIRMED'], actor: 'provider' },
  DISPUTED:           { from: ['COMPLETED'],           actor: 'client' },
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateBookingDto) {
    // Verificar que o endereço pertence ao cliente
    const address = await this.prisma.userAddress.findFirst({
      where: { id: dto.addressId, userId: clientId, deletedAt: null },
    });
    if (!address) throw new NotFoundException('Endereço não encontrado');

    // Verificar que o prestador existe e está disponível
    const provider = await this.prisma.providerProfile.findFirst({
      where: { id: dto.providerId, verificationStatus: 'APPROVED', isAvailable: true, deletedAt: null },
    });
    if (!provider) throw new BadRequestException('Prestador não disponível');

    // Calcular preço baseado no serviço ou na configuração do prestador
    let basePriceCents = 0;
    if (dto.serviceId) {
      const service = await this.prisma.providerService.findUnique({ where: { id: dto.serviceId } });
      basePriceCents = service?.basePriceCents ?? 0;
    }

    const serviceFee = Math.round(basePriceCents * 0.08); // 8% service fee

    const booking = await this.prisma.booking.create({
      data: {
        clientId,
        providerId: dto.providerId,
        serviceId: dto.serviceId,
        addressId: dto.addressId,
        scheduledAt: new Date(dto.scheduledAt),
        clientNotes: dto.clientNotes,
        subtotalCents: basePriceCents,
        serviceFee,
        totalCents: basePriceCents + serviceFee,
        timeline: {
          create: { status: 'PENDING_PAYMENT', actorId: clientId },
        },
      },
      include: BOOKING_INCLUDE,
    });

    return booking;
  }

  async findAll(userId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 20, 50);
    const skip = (page - 1) * perPage;

    const where = {
      OR: [{ clientId: userId }, { provider: { userId } }],
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: perPage,
      }),
    ]);

    return {
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage), hasNextPage: skip + perPage < total, hasPrevPage: page > 1 },
    };
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: BOOKING_INCLUDE });
    if (!booking || booking.deletedAt) throw new NotFoundException('Agendamento não encontrado');

    const isClient = booking.clientId === userId;
    const isProvider = booking.provider.userId === userId;
    if (!isClient && !isProvider) throw new ForbiddenException('Acesso negado');

    return booking;
  }

  async updateStatus(id: string, userId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id, userId);
    const isClient = booking.clientId === userId;
    const isProvider = booking.provider.userId === userId;
    const actor = isClient ? 'client' : isProvider ? 'provider' : null;

    if (!actor) throw new ForbiddenException('Acesso negado');

    const transition = VALID_TRANSITIONS[dto.status];
    if (!transition) throw new BadRequestException(`Status "${dto.status}" inválido`);
    if (!transition.from.includes(booking.status)) {
      throw new BadRequestException(`Transição inválida: ${booking.status} → ${dto.status}`);
    }
    if (transition.actor !== actor) {
      throw new ForbiddenException(`Apenas ${transition.actor === 'client' ? 'o cliente' : 'o prestador'} pode realizar esta ação`);
    }

    const now = new Date();
    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status as Parameters<typeof this.prisma.booking.update>[0]['data']['status'],
        ...(dto.status === 'COMPLETED' ? { completedAt: now } : {}),
        ...(dto.status.startsWith('CANCELLED') ? { cancelledAt: now, cancelReason: dto.cancelReason } : {}),
        timeline: { create: { status: dto.status as never, actorId: userId, note: dto.cancelReason } },
      },
      include: BOOKING_INCLUDE,
    });

    return updated;
  }
}
