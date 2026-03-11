import { Injectable, BadRequestException } from '@nestjs/common';
import { IPaymentGateway } from './payment-gateway.interface';
import { StripeGateway } from './stripe.gateway';
import { MercadoPagoGateway } from './mercadopago.gateway';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GatewayFactory {
  constructor(
    private prisma: PrismaService,
    private stripeGateway: StripeGateway,
    private mercadoPagoGateway: MercadoPagoGateway,
  ) {}

  private gateways: Record<string, IPaymentGateway> = {};

  onModuleInit() {
    this.gateways['STRIPE'] = this.stripeGateway;
    this.gateways['MERCADOPAGO'] = this.mercadoPagoGateway;
  }

  /**
   * Returns the appropriate gateway for a given country.
   * Gateway is configured per-country in the database.
   */
  async getForCountry(countryCode: string): Promise<IPaymentGateway> {
    const config = await this.prisma.paymentGatewayConfig.findFirst({
      where: { countryCode, isDefault: true, isActive: true },
    });

    const gatewayName = config?.gatewayName || 'MERCADOPAGO'; // Default for Brazil
    const gateway = this.gateways[gatewayName];

    if (!gateway) {
      throw new BadRequestException(`Gateway ${gatewayName} not configured`);
    }

    return gateway;
  }

  getByName(name: string): IPaymentGateway {
    const gateway = this.gateways[name.toUpperCase()];
    if (!gateway) {
      throw new BadRequestException(`Gateway ${name} not found`);
    }
    return gateway;
  }

  getAllGateways(): IPaymentGateway[] {
    return Object.values(this.gateways);
  }
}
