import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly asaasBaseUrl: string;
  private readonly asaasApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.asaasBaseUrl = this.config.get('ASAAS_BASE_URL', 'https://sandbox.asaas.com/api/v3');
    this.asaasApiKey = this.config.getOrThrow('ASAAS_API_KEY');
  }

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, clientId: userId, status: 'PENDING_PAYMENT', deletedAt: null },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado ou já pago');
    if (booking.payment) throw new BadRequestException('Pagamento já iniciado para este agendamento');

    // Create payment record optimistically
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        method: dto.method as never,
        status: 'PENDING',
        amountCents: booking.totalCents,
        idempotencyKey: `booking-${booking.id}-${Date.now()}`,
      },
    });

    try {
      const asaasPayload = this.buildAsaasPayload(booking, payment, dto);
      const { data: asaasResponse } = await firstValueFrom(
        this.http.post(`${this.asaasBaseUrl}/payments`, asaasPayload, {
          headers: { access_token: this.asaasApiKey },
        }),
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayId: asaasResponse.id,
          status: dto.method === 'PIX' ? 'PENDING' : 'AUTHORIZED',
          pixQrCode: asaasResponse.pixQrCode?.payload,
          pixExpiresAt: asaasResponse.pixQrCode ? new Date(Date.now() + 30 * 60 * 1000) : null,
        },
      });

      // Update booking status
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: dto.method === 'PIX' ? 'PENDING_PAYMENT' : 'PAYMENT_AUTHORIZED',
          timeline: { create: { status: 'PAYMENT_AUTHORIZED', actorId: userId, note: `Pagamento via ${dto.method}` } },
        },
      });

      return { paymentId: payment.id, method: dto.method, pixQrCode: asaasResponse.pixQrCode?.payload };
    } catch (err) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      this.logger.error('Asaas payment error', err);
      throw new BadRequestException('Falha ao processar pagamento');
    }
  }

  async handleWebhook(payload: Record<string, unknown>) {
    const event = payload.event as string;
    const gatewayPayment = payload.payment as Record<string, string>;
    if (!gatewayPayment?.id) return;

    const payment = await this.prisma.payment.findFirst({ where: { gatewayId: gatewayPayment.id } });
    if (!payment) return;

    const statusMap: Record<string, string> = {
      PAYMENT_CONFIRMED: 'PAID',
      PAYMENT_RECEIVED: 'PAID',
      PAYMENT_OVERDUE: 'FAILED',
      PAYMENT_DELETED: 'REFUNDED',
      PAYMENT_REFUNDED: 'REFUNDED',
    };

    const newStatus = statusMap[event];
    if (!newStatus) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: newStatus as never, paidAt: newStatus === 'PAID' ? new Date() : null } });

      if (newStatus === 'PAID') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'PAYMENT_AUTHORIZED', timeline: { create: { status: 'PAYMENT_AUTHORIZED', actorId: 'SYSTEM', note: 'PIX confirmado' } } },
        });
      }
    });
  }

  async findByBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, OR: [{ clientId: userId }, { provider: { userId } }] },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    return this.prisma.payment.findUnique({ where: { bookingId } });
  }

  private buildAsaasPayload(booking: { totalCents: number; scheduledAt: Date; clientId: string }, payment: { id: string }, dto: InitiatePaymentDto) {
    const amount = booking.totalCents / 100;
    const base = {
      billingType: dto.method === 'PIX' ? 'PIX' : dto.method === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'DEBIT_CARD',
      value: amount,
      dueDate: new Date(booking.scheduledAt).toISOString().split('T')[0],
      externalReference: payment.id,
      description: 'Serviço App Serviços',
    };
    if (dto.cardToken) return { ...base, creditCard: { creditCardToken: dto.cardToken } };
    return base;
  }
}
