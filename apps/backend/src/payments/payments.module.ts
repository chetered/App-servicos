import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { GatewayFactory } from './gateways/gateway.factory';
import { StripeGateway } from './gateways/stripe.gateway';
import { MercadoPagoGateway } from './gateways/mercadopago.gateway';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'payments' }),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    GatewayFactory,
    StripeGateway,
    MercadoPagoGateway,
    WebhookProcessor,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
