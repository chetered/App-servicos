import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
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
 * Stripe Gateway — For international markets (US, EU, etc.)
 */
@Injectable()
export class StripeGateway implements IPaymentGateway {
  readonly name = 'STRIPE';
  readonly supportedCountries = ['US', 'GB', 'DE', 'FR', 'PT', 'ES', 'IT'];
  private readonly logger = new Logger(StripeGateway.name);
  private stripe: Stripe | null = null;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey && secretKey !== 'placeholder') {
      this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
      this.logger.log('Stripe initialized');
    } else {
      this.logger.warn('Stripe not configured (using mock mode)');
    }
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    this.logger.log(`Charging ${params.amount} via Stripe`);

    if (!this.stripe) {
      // Mock for development
      return {
        gatewayTransactionId: `pi_mock_${Date.now()}`,
        status: 'SUCCEEDED',
        amount: params.amount,
        currency: params.currency,
        gateway: this.name,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: params.amount, // Already in cents
        currency: params.currency.toLowerCase(),
        customer: params.metadata?.stripeCustomerId,
        payment_method: params.paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: params.metadata || {},
        description: params.description,
      },
      {
        idempotencyKey: params.idempotencyKey,
      },
    );

    return {
      gatewayTransactionId: paymentIntent.id,
      status: paymentIntent.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      gateway: this.name,
      rawResponse: paymentIntent,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!this.stripe) {
      return {
        gatewayRefundId: `re_mock_${Date.now()}`,
        status: 'SUCCEEDED',
        amount: params.amount || 0,
      };
    }

    const refund = await this.stripe.refunds.create(
      {
        payment_intent: params.gatewayTransactionId,
        ...(params.amount && { amount: params.amount }),
        reason: (params.reason as any) || 'requested_by_customer',
      },
      { idempotencyKey: params.idempotencyKey },
    );

    return {
      gatewayRefundId: refund.id,
      status: refund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
      amount: refund.amount,
    };
  }

  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult> {
    if (!this.stripe) {
      return { gatewayCustomerId: `cus_mock_${Date.now()}` };
    }

    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata || {},
    });

    return { gatewayCustomerId: customer.id };
  }

  async savePaymentMethod(params: SavePaymentMethodParams): Promise<SavePaymentMethodResult> {
    if (!this.stripe) {
      return {
        gatewayPaymentMethodId: `pm_mock_${Date.now()}`,
        last4: '4242',
        brand: 'VISA',
        type: 'CARD',
      };
    }

    const pm = await this.stripe.paymentMethods.attach(params.token, {
      customer: params.customerId,
    });

    return {
      gatewayPaymentMethodId: pm.id,
      last4: pm.card?.last4,
      brand: pm.card?.brand?.toUpperCase(),
      expiryMonth: pm.card?.exp_month,
      expiryYear: pm.card?.exp_year,
      type: 'CARD',
    };
  }

  async processWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!this.stripe || !webhookSecret) {
      throw new Error('Stripe webhook not configured');
    }

    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        return {
          type: 'PAYMENT_SUCCEEDED',
          transactionId: (event.data.object as Stripe.PaymentIntent).id,
          status: 'succeeded',
        };
      case 'payment_intent.payment_failed':
        return {
          type: 'PAYMENT_FAILED',
          transactionId: (event.data.object as Stripe.PaymentIntent).id,
          status: 'failed',
        };
      default:
        throw new Error(`Unhandled event type: ${event.type}`);
    }
  }
}
