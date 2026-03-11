import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { DisplacementService } from './displacement.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BookingType } from './dto/create-booking.dto';

describe('PricingService', () => {
  let service: PricingService;
  let displacementService: DisplacementService;

  const mockPrisma = {
    provider: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    commissionRule: {
      findFirst: jest.fn(),
    },
    coupon: {
      findFirst: jest.fn(),
    },
    setting: {
      findFirst: jest.fn(),
    },
  };

  const mockDisplacementService = {
    calculate: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DisplacementService, useValue: mockDisplacementService },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    displacementService = module.get<DisplacementService>(DisplacementService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('estimate()', () => {
    const baseParams = {
      providerId: 'provider-1',
      serviceId: 'service-1',
      bookingType: BookingType.SCHEDULED,
      clientLatitude: -23.56,
      clientLongitude: -46.65,
    };

    it('should calculate base price without extra fees', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'provider-1',
        pricingRules: [{ serviceId: 'service-1', basePrice: 20000 }],
        displacementRule: null,
        currentLatitude: -23.56,
        currentLongitude: -46.65,
      });
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        categoryId: 'cat-1',
        defaultPrice: 20000,
      });
      mockPrisma.commissionRule.findFirst.mockResolvedValue({
        percentage: 20,
        fixedAmount: 0,
      });
      mockPrisma.setting.findFirst.mockResolvedValue(null);

      const result = await service.estimate(baseParams);

      expect(result.servicePrice).toBe(20000);
      expect(result.platformFee).toBe(4000); // 20% of 20000
      expect(result.displacementFee).toBe(0);
      expect(result.urgencyFee).toBe(0);
      expect(result.couponDiscount).toBe(0);
      expect(result.total).toBe(24000); // 20000 + 4000
      expect(result.currency).toBe('BRL');
    });

    it('should apply urgency fee for IMMEDIATE bookings', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'provider-1',
        pricingRules: [{ serviceId: 'service-1', basePrice: 10000 }],
        displacementRule: null,
        currentLatitude: -23.56,
        currentLongitude: -46.65,
      });
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        categoryId: 'cat-1',
        defaultPrice: 10000,
      });
      mockPrisma.commissionRule.findFirst.mockResolvedValue({ percentage: 20, fixedAmount: 0 });
      mockPrisma.setting.findFirst.mockResolvedValue({ key: 'urgency_fee_percentage', value: '10' });

      const result = await service.estimate({
        ...baseParams,
        bookingType: BookingType.IMMEDIATE,
      });

      expect(result.urgencyFee).toBe(1000); // 10% of 10000
      expect(result.total).toBe(13000); // 10000 + 2000(commission) + 1000(urgency)
    });

    it('should apply coupon discount correctly', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'provider-1',
        pricingRules: [{ serviceId: 'service-1', basePrice: 20000 }],
        displacementRule: null,
        currentLatitude: -23.56,
        currentLongitude: -46.65,
      });
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        categoryId: 'cat-1',
        defaultPrice: 20000,
      });
      mockPrisma.commissionRule.findFirst.mockResolvedValue({ percentage: 20, fixedAmount: 0 });
      mockPrisma.setting.findFirst.mockResolvedValue(null);
      mockPrisma.coupon.findFirst.mockResolvedValue({
        discountType: 'PERCENTAGE',
        discountValue: 10,
      });

      const result = await service.estimate({ ...baseParams, couponCode: 'DESCONTO10' });

      expect(result.couponDiscount).toBe(2000); // 10% of 20000
      expect(result.total).toBe(22000); // 20000 + 4000 - 2000
    });

    it('should throw if provider not found', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(null);
      mockPrisma.service.findUnique.mockResolvedValue({ id: 'service-1' });
      mockPrisma.commissionRule.findFirst.mockResolvedValue(null);

      await expect(service.estimate(baseParams)).rejects.toThrow(
        'Prestador ou serviço não encontrado',
      );
    });
  });

  describe('calculateProviderPayout()', () => {
    it('should correctly calculate provider net amount', async () => {
      const result = await service.calculateProviderPayout(24000, 4000, 0);
      expect(result).toBe(20000);
    });
  });
});
