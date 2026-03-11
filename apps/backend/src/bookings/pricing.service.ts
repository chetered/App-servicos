import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DisplacementService } from './displacement.service';
import { BookingType } from './dto/create-booking.dto';

export interface PriceBreakdown {
  servicePrice: number;
  displacementFee: number;
  urgencyFee: number;
  platformFee: number;
  couponDiscount: number;
  insuranceFee: number;
  subtotal: number;
  total: number;
  currency: string;
  breakdown: {
    label: string;
    amount: number;
    type: 'credit' | 'debit';
  }[];
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private prisma: PrismaService,
    private displacementService: DisplacementService,
  ) {}

  async estimate(params: {
    providerId: string;
    serviceId: string;
    bookingType: BookingType;
    clientLatitude: number;
    clientLongitude: number;
    couponCode?: string;
    addInsurance?: boolean;
    customFields?: Record<string, any>;
    countryId?: string;
  }): Promise<PriceBreakdown> {
    const [provider, service, commissionRule] = await Promise.all([
      this.prisma.provider.findUnique({
        where: { id: params.providerId },
        include: {
          pricingRules: {
            where: { serviceId: params.serviceId },
          },
          displacementRule: true,
        },
      }),
      this.prisma.service.findUnique({ where: { id: params.serviceId } }),
      this.prisma.commissionRule.findFirst({
        where: {
          OR: [
            { serviceId: params.serviceId },
            { categoryId: service?.categoryId },
            { countryId: params.countryId },
            { isDefault: true },
          ],
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      }),
    ]);

    if (!provider || !service) {
      throw new BadRequestException('Prestador ou serviço não encontrado');
    }

    // 1. Base service price
    const pricingRule = provider.pricingRules.find(
      (r) => r.serviceId === params.serviceId,
    );
    const servicePrice = pricingRule?.basePrice || service.defaultPrice || 0;

    // 2. Displacement fee
    const displacementFee = await this.displacementService.calculate({
      rule: provider.displacementRule,
      providerLatitude: provider.currentLatitude,
      providerLongitude: provider.currentLongitude,
      clientLatitude: params.clientLatitude,
      clientLongitude: params.clientLongitude,
    });

    // 3. Urgency fee (if immediate booking)
    let urgencyFee = 0;
    if (params.bookingType === BookingType.IMMEDIATE) {
      const urgencyConfig = await this.prisma.setting.findFirst({
        where: { key: 'urgency_fee_percentage' },
      });
      const urgencyPercentage = parseFloat(urgencyConfig?.value || '0');
      urgencyFee = Math.round(servicePrice * (urgencyPercentage / 100));
    }

    // 4. Platform commission
    const commissionPercentage = commissionRule?.percentage || 20;
    const commissionFixed = commissionRule?.fixedAmount || 0;
    const platformFee = Math.round(
      servicePrice * (commissionPercentage / 100) + commissionFixed,
    );

    // 5. Coupon discount
    let couponDiscount = 0;
    if (params.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: params.couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { gte: new Date() },
        },
      });

      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = Math.round(servicePrice * (coupon.discountValue / 100));
        } else {
          couponDiscount = coupon.discountValue;
        }
        // Clamp to not exceed service price
        couponDiscount = Math.min(couponDiscount, servicePrice);
      }
    }

    // 6. Insurance fee (optional)
    let insuranceFee = 0;
    if (params.addInsurance) {
      const insuranceConfig = await this.prisma.setting.findFirst({
        where: { key: 'insurance_fee_percentage' },
      });
      const insurancePercentage = parseFloat(insuranceConfig?.value || '2');
      insuranceFee = Math.round(servicePrice * (insurancePercentage / 100));
    }

    // 7. Totals
    const subtotal = servicePrice + displacementFee + urgencyFee;
    const total = subtotal + platformFee + insuranceFee - couponDiscount;

    const breakdown: PriceBreakdown['breakdown'] = [
      { label: 'Serviço', amount: servicePrice, type: 'debit' },
    ];

    if (displacementFee > 0) {
      breakdown.push({ label: 'Deslocamento', amount: displacementFee, type: 'debit' });
    }
    if (urgencyFee > 0) {
      breakdown.push({ label: 'Taxa de urgência', amount: urgencyFee, type: 'debit' });
    }
    breakdown.push({ label: 'Taxa de serviço', amount: platformFee, type: 'debit' });
    if (couponDiscount > 0) {
      breakdown.push({ label: 'Desconto cupom', amount: -couponDiscount, type: 'credit' });
    }
    if (insuranceFee > 0) {
      breakdown.push({ label: 'Proteção do serviço', amount: insuranceFee, type: 'debit' });
    }

    return {
      servicePrice,
      displacementFee,
      urgencyFee,
      platformFee,
      couponDiscount,
      insuranceFee,
      subtotal,
      total,
      currency: 'BRL', // TODO: get from country config
      breakdown,
    };
  }

  async calculateProviderPayout(
    totalAmount: number,
    platformFee: number,
    displacementFee: number,
  ): Promise<number> {
    // Provider receives: total - platform_fee + displacement (displacement goes to provider)
    return totalAmount - platformFee;
  }
}
