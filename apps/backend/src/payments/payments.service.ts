import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';
import { GatewayFactory } from './gateways/gateway.factory';
import { ChargeParams } from './gateways/payment-gateway.interface';

export interface ChargeOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  customerId: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private gatewayFactory: GatewayFactory,
    private eventEmitter: EventEmitter2,
  ) {}

  async charge(params: ChargeOrderParams) {
    // 1. Check idempotency — never charge twice for same order
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });

    if (existing) {
      this.logger.warn(`Duplicate charge attempt for key: ${params.idempotencyKey}`);
      return existing;
    }

    // 2. Create payment record in PENDING state
    const payment = await this.prisma.payment.create({
      data: {
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency,
        status: 'PENDING',
        idempotencyKey: params.idempotencyKey,
        paymentMethodId: params.paymentMethodId,
      },
    });

    try {
      // 3. Get appropriate gateway (default: MercadoPago for BR)
      const gateway = await this.gatewayFactory.getForCountry('BR');

      // 4. Charge
      const result = await gateway.charge({
        amount: params.amount,
        currency: params.currency,
        customerId: params.customerId,
        paymentMethodId: params.paymentMethodId,
        idempotencyKey: params.idempotencyKey,
        metadata: params.metadata,
      });

      // 5. Update payment with gateway result
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          gatewayTransactionId: result.gatewayTransactionId,
          gatewayName: result.gateway,
          processedAt: new Date(),
        },
      });

      this.eventEmitter.emit('payment.processed', {
        paymentId: payment.id,
        orderId: params.orderId,
        status: result.status,
        amount: params.amount,
      });

      return updatedPayment;
    } catch (error) {
      this.logger.error(`Payment failed for order ${params.orderId}:`, error);

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', errorMessage: error.message },
      });

      throw new BadRequestException('Falha no processamento do pagamento');
    }
  }

  async refund(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status !== 'SUCCEEDED') {
      throw new BadRequestException('Pagamento não pode ser reembolsado');
    }

    const refundAmount = amount || payment.amount;
    const idempotencyKey = `refund:${paymentId}:${refundAmount}`;

    // Check for existing refund
    const existingRefund = await this.prisma.refund.findFirst({
      where: { paymentId, idempotencyKey },
    });

    if (existingRefund) {
      return existingRefund;
    }

    const gateway = this.gatewayFactory.getByName(payment.gatewayName || 'MERCADOPAGO');

    const result = await gateway.refund({
      gatewayTransactionId: payment.gatewayTransactionId,
      amount: refundAmount,
      reason,
      idempotencyKey,
    });

    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        amount: refundAmount,
        status: result.status,
        gatewayRefundId: result.gatewayRefundId,
        reason,
        idempotencyKey,
      },
    });

    if (result.status === 'SUCCEEDED') {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: refundAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
      });
    }

    this.eventEmitter.emit('payment.refunded', {
      paymentId,
      refundId: refund.id,
      amount: refundAmount,
    });

    return refund;
  }

  async savePaymentMethod(userId: string, token: string) {
    const gateway = await this.gatewayFactory.getForCountry('BR');

    // Get or create gateway customer
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    let gatewayCustomerId = user?.gatewayCustomerId;

    if (!gatewayCustomerId) {
      const customer = await gateway.createCustomer({
        email: user?.email || '',
        name: user?.fullName || '',
      });
      gatewayCustomerId = customer.gatewayCustomerId;

      await this.prisma.user.update({
        where: { id: userId },
        data: { gatewayCustomerId },
      });
    }

    const pm = await gateway.savePaymentMethod({
      customerId: gatewayCustomerId,
      token,
    });

    return this.prisma.paymentMethod.create({
      data: {
        userId,
        type: pm.type,
        last4: pm.last4,
        brand: pm.brand,
        expiryMonth: pm.expiryMonth,
        expiryYear: pm.expiryYear,
        gatewayPaymentMethodId: pm.gatewayPaymentMethodId,
        gatewayName: gateway.name,
        isDefault: false,
      },
    });
  }

  async processWebhook(gatewayName: string, payload: string, signature: string) {
    const gateway = this.gatewayFactory.getByName(gatewayName);
    const event = await gateway.processWebhook(payload, signature);

    this.logger.log(`Webhook received: ${event.type} - ${event.transactionId}`);

    // Find payment by gateway transaction ID
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayTransactionId: event.transactionId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for transaction: ${event.transactionId}`);
      return;
    }

    if (event.type === 'PAYMENT_SUCCEEDED' && payment.status !== 'SUCCEEDED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED', processedAt: new Date() },
      });

      this.eventEmitter.emit('payment.succeeded.webhook', {
        paymentId: payment.id,
        orderId: payment.orderId,
      });
    }
  }
}
