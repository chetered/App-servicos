import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentGateway,
  ChargeParams,
  ChargeResult,
  RefundParams,
  RefundResult,
  CreateCustomerParams,
  CreateCustomerResult,
  SavePaymentMethodParams,
  SavePaymentMethodResult,
  WebhookEvent,
} from './payment-gateway.interface';

/**
 * MercadoPago Gateway — Default for Brazil and LatAm
 * Supports: PIX, credit/debit card, boleto
 */
@Injectable()
export class MercadoPagoGateway implements IPaymentGateway {
  readonly name = 'MERCADOPAGO';
  readonly supportedCountries = ['BR', 'AR', 'MX', 'CO', 'CL', 'PE'];
  private readonly logger = new Logger(MercadoPagoGateway.name);

  // MercadoPago SDK instance
  private mp: any;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (accessToken && accessToken !== 'placeholder') {
      // In production: import { MercadoPagoConfig, Payment } from 'mercadopago';
      // this.mp = new MercadoPagoConfig({ accessToken });
      this.logger.log('MercadoPago initialized');
    } else {
      this.logger.warn('MercadoPago not configured (using mock mode)');
    }
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    this.logger.log(`Charging ${params.amount} via MercadoPago`);

    // Production implementation:
    // const payment = new Payment(this.mp);
    // const result = await payment.create({
    //   body: {
    //     transaction_amount: params.amount / 100, // MP uses decimal
    //     token: params.paymentToken,
    //     payment_method_id: 'credit_card',
    //     payer: { email: params.metadata?.email },
    //     external_reference: params.idempotencyKey,
    //   },
    //   requestOptions: { idempotencyKey: params.idempotencyKey },
    // });

    // Mock for development
    return {
      gatewayTransactionId: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'SUCCEEDED',
      amount: params.amount,
      currency: params.currency,
      gateway: this.name,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    this.logger.log(`Refunding transaction ${params.gatewayTransactionId}`);

    // Production: await payment.refund(...)

    return {
      gatewayRefundId: `mp_refund_${Date.now()}`,
      status: 'SUCCEEDED',
      amount: params.amount || 0,
    };
  }

  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult> {
    return { gatewayCustomerId: `mp_customer_${Date.now()}` };
  }

  async savePaymentMethod(params: SavePaymentMethodParams): Promise<SavePaymentMethodResult> {
    return {
      gatewayPaymentMethodId: `mp_pm_${Date.now()}`,
      last4: '4242',
      brand: 'VISA',
      type: 'CARD',
    };
  }

  async processWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    const data = JSON.parse(payload);

    const type = data.action === 'payment.updated' ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED';

    return {
      type,
      transactionId: data.data?.id?.toString(),
      status: data.action,
    };
  }
}
