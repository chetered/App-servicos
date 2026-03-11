import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { PricingService } from './pricing.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CreateBookingDto, BookingType } from './dto/create-booking.dto';
import { v4 as uuidv4 } from 'uuid';

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  ACCEPTED = 'ACCEPTED',
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED_BY_CLIENT = 'CANCELLED_BY_CLIENT',
  CANCELLED_BY_PROVIDER = 'CANCELLED_BY_PROVIDER',
  IN_DISPUTE = 'IN_DISPUTE',
  REFUNDED = 'REFUNDED',
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService,
    private commissionsService: CommissionsService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('bookings') private bookingsQueue: Queue,
  ) {}

  async create(clientId: string, dto: CreateBookingDto) {
    // 1. Validate provider availability
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
      include: { user: true },
    });

    if (!provider || provider.status !== 'ACTIVE') {
      throw new BadRequestException('Prestador não disponível');
    }

    // 2. Check for conflicts in scheduled time
    if (dto.scheduledAt) {
      await this.checkSchedulingConflict(dto.providerId, new Date(dto.scheduledAt));
    }

    // 3. Calculate price
    const priceBreakdown = await this.pricingService.estimate({
      providerId: dto.providerId,
      serviceId: dto.serviceId,
      bookingType: dto.bookingType,
      clientLatitude: dto.address.latitude,
      clientLongitude: dto.address.longitude,
      couponCode: dto.couponCode,
      addInsurance: dto.addInsurance,
      customFields: dto.customFields,
    });

    // 4. Create booking record (idempotent)
    const idempotencyKey = `booking:${clientId}:${dto.providerId}:${dto.serviceId}:${Date.now()}`;

    const booking = await this.prisma.$transaction(async (tx) => {
      // Create address snapshot
      const address = await tx.address.create({
        data: {
          userId: clientId,
          street: dto.address.street,
          number: dto.address.number,
          complement: dto.address.complement,
          neighborhood: dto.address.neighborhood,
          city: dto.address.city,
          state: dto.address.state,
          postalCode: dto.address.postalCode,
          latitude: dto.address.latitude,
          longitude: dto.address.longitude,
          isSnapshot: true,
        },
      });

      // Create booking
      const newBooking = await tx.serviceOrder.create({
        data: {
          clientId,
          providerId: dto.providerId,
          serviceId: dto.serviceId,
          bookingType: dto.bookingType,
          status: BookingStatus.PENDING_PAYMENT,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          addressId: address.id,
          notes: dto.notes,
          customFields: dto.customFields,

          // Price snapshot (immutable)
          servicePrice: priceBreakdown.servicePrice,
          displacementFee: priceBreakdown.displacementFee,
          urgencyFee: priceBreakdown.urgencyFee,
          platformFee: priceBreakdown.platformFee,
          couponDiscount: priceBreakdown.couponDiscount,
          insuranceFee: priceBreakdown.insuranceFee,
          totalAmount: priceBreakdown.total,
          currency: priceBreakdown.currency,
          priceBreakdown: JSON.stringify(priceBreakdown.breakdown),

          // Idempotency
          idempotencyKey,
        },
      });

      // Record initial status
      await tx.orderStatusHistory.create({
        data: {
          orderId: newBooking.id,
          status: BookingStatus.PENDING_PAYMENT,
          actorId: clientId,
          actorType: 'CLIENT',
        },
      });

      return newBooking;
    });

    // 5. Process payment (async-safe)
    try {
      const payment = await this.paymentsService.charge({
        orderId: booking.id,
        amount: priceBreakdown.total,
        currency: priceBreakdown.currency,
        paymentMethodId: dto.paymentMethodId,
        customerId: clientId,
        idempotencyKey: `payment:${booking.id}`,
        metadata: {
          bookingId: booking.id,
          providerId: dto.providerId,
          serviceId: dto.serviceId,
        },
      });

      // Update booking status
      if (payment.status === 'SUCCEEDED') {
        await this.updateStatus(booking.id, BookingStatus.PAID, clientId, 'CLIENT');

        // Notify provider
        await this.notificationsService.sendToUser(provider.userId, {
          title: 'Novo pedido recebido!',
          body: `Você tem um novo pedido para ${new Date(dto.scheduledAt || Date.now()).toLocaleString('pt-BR')}`,
          data: { bookingId: booking.id, type: 'NEW_BOOKING' },
        });

        // Schedule timeout for acceptance
        await this.bookingsQueue.add(
          'check-acceptance-timeout',
          { bookingId: booking.id },
          { delay: 5 * 60 * 1000 }, // 5 minutes
        );

        // Emit event for analytics
        this.eventEmitter.emit('booking.created', {
          bookingId: booking.id,
          clientId,
          providerId: dto.providerId,
          serviceId: dto.serviceId,
          amount: priceBreakdown.total,
        });
      }
    } catch (error) {
      this.logger.error(`Payment failed for booking ${booking.id}:`, error);
      await this.updateStatus(booking.id, BookingStatus.CANCELLED_BY_CLIENT, clientId, 'CLIENT');
      throw new BadRequestException('Falha no processamento do pagamento');
    }

    return this.findOne(booking.id, clientId);
  }

  async findOne(bookingId: string, requesterId: string) {
    const booking = await this.prisma.serviceOrder.findUnique({
      where: { id: bookingId },
      include: {
        provider: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true, phone: true },
            },
          },
        },
        client: {
          select: { id: true, fullName: true, avatarUrl: true, phone: true },
        },
        service: true,
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        review: true,
      },
    });

    if (!booking) throw new NotFoundException('Pedido não encontrado');

    // Authorize: only client, provider, admin can view
    const isAuthorized =
      booking.clientId === requesterId ||
      booking.provider?.userId === requesterId;

    if (!isAuthorized) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return booking;
  }

  async updateStatus(
    bookingId: string,
    newStatus: BookingStatus,
    actorId: string,
    actorType: 'CLIENT' | 'PROVIDER' | 'SYSTEM' | 'ADMIN',
    metadata?: Record<string, any>,
  ) {
    const booking = await this.prisma.serviceOrder.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: bookingId,
        status: newStatus,
        actorId,
        actorType,
        metadata,
      },
    });

    this.eventEmitter.emit(`booking.status.${newStatus.toLowerCase()}`, {
      bookingId,
      status: newStatus,
      actorId,
    });

    return booking;
  }

  async acceptByProvider(bookingId: string, providerId: string) {
    const booking = await this.prisma.serviceOrder.findFirst({
      where: { id: bookingId, provider: { userId: providerId } },
    });

    if (!booking) throw new NotFoundException('Pedido não encontrado');
    if (booking.status !== BookingStatus.PAID) {
      throw new BadRequestException('Pedido não pode ser aceito neste status');
    }

    const newStatus =
      booking.bookingType === BookingType.SCHEDULED
        ? BookingStatus.SCHEDULED
        : BookingStatus.ACCEPTED;

    await this.updateStatus(bookingId, newStatus, providerId, 'PROVIDER');

    // Notify client
    await this.notificationsService.sendToUser(booking.clientId, {
      title: 'Pedido aceito!',
      body: 'Seu profissional aceitou o pedido',
      data: { bookingId, type: 'BOOKING_ACCEPTED' },
    });

    return this.findOne(bookingId, providerId);
  }

  async completeByProvider(bookingId: string, providerId: string) {
    const booking = await this.prisma.serviceOrder.findFirst({
      where: {
        id: bookingId,
        provider: { userId: providerId },
        status: { in: [BookingStatus.IN_PROGRESS, BookingStatus.ACCEPTED] },
      },
    });

    if (!booking) throw new NotFoundException('Pedido não pode ser concluído');

    await this.updateStatus(bookingId, BookingStatus.COMPLETED, providerId, 'PROVIDER');

    // Process payout to provider
    await this.commissionsService.processOrderPayout(bookingId);

    // Notify client to review
    await this.notificationsService.sendToUser(booking.clientId, {
      title: 'Serviço concluído!',
      body: 'Como foi seu atendimento? Avalie o profissional',
      data: { bookingId, type: 'BOOKING_COMPLETED', action: 'REVIEW' },
    });

    this.eventEmitter.emit('booking.completed', { bookingId });

    return this.findOne(bookingId, providerId);
  }

  async listByClient(
    clientId: string,
    params: { status?: string; cursor?: string; limit?: number },
  ) {
    const { status, cursor, limit = 20 } = params;

    const bookings = await this.prisma.serviceOrder.findMany({
      where: {
        clientId,
        ...(status && { status }),
      },
      include: {
        provider: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        service: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    const hasMore = bookings.length > limit;
    const data = hasMore ? bookings.slice(0, -1) : bookings;

    return {
      data,
      meta: {
        hasMore,
        nextCursor: hasMore ? data[data.length - 1].id : null,
        limit,
      },
    };
  }

  private async checkSchedulingConflict(
    providerId: string,
    scheduledAt: Date,
  ): Promise<void> {
    const conflictWindow = new Date(scheduledAt);
    conflictWindow.setHours(conflictWindow.getHours() - 1); // 1h buffer

    const endWindow = new Date(scheduledAt);
    endWindow.setHours(endWindow.getHours() + 2); // 2h window

    const conflict = await this.prisma.serviceOrder.findFirst({
      where: {
        providerId,
        status: { in: [BookingStatus.PAID, BookingStatus.ACCEPTED, BookingStatus.SCHEDULED] },
        scheduledAt: {
          gte: conflictWindow,
          lte: endWindow,
        },
      },
    });

    if (conflict) {
      throw new ConflictException('Prestador indisponível no horário selecionado');
    }
  }
}
