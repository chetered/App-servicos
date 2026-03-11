import { Test, TestingModule } from '@nestjs/testing';
import { DisplacementService, DisplacementType } from './displacement.service';

describe('DisplacementService', () => {
  let service: DisplacementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisplacementService],
    }).compile();

    service = module.get<DisplacementService>(DisplacementService);
  });

  describe('calculate()', () => {
    const baseCoords = {
      providerLatitude: -23.5616,
      providerLongitude: -46.6563,
      clientLatitude: -23.5700,
      clientLongitude: -46.6600,
    };

    it('should return 0 when type is NONE', async () => {
      const result = await service.calculate({
        rule: { type: DisplacementType.NONE, showSeparately: true },
        ...baseCoords,
      });
      expect(result).toBe(0);
    });

    it('should return 0 when rule is null', async () => {
      const result = await service.calculate({ rule: null, ...baseCoords });
      expect(result).toBe(0);
    });

    it('should return fixed amount when type is FIXED', async () => {
      const result = await service.calculate({
        rule: { type: DisplacementType.FIXED, fixedAmount: 1500, showSeparately: true },
        ...baseCoords,
      });
      expect(result).toBe(1500);
    });

    it('should return 0 when type is INCLUDED', async () => {
      const result = await service.calculate({
        rule: { type: DisplacementType.INCLUDED, showSeparately: false },
        ...baseCoords,
      });
      expect(result).toBe(0);
    });

    it('should calculate by distance range correctly', async () => {
      const result = await service.calculate({
        rule: {
          type: DisplacementType.BY_DISTANCE_RANGE,
          showSeparately: true,
          distanceRanges: [
            { minKm: 0, maxKm: 5, price: 500 },
            { minKm: 5, maxKm: 10, price: 1000 },
            { minKm: 10, maxKm: 20, price: 2000 },
          ],
        },
        // Coords ~1km apart
        providerLatitude: -23.5616,
        providerLongitude: -46.6563,
        clientLatitude: -23.5700,
        clientLongitude: -46.6600,
      });
      expect(result).toBe(500); // Within 0-5km range
    });
  });

  describe('isWithinRadius()', () => {
    it('should return true when within radius', () => {
      // ~1km apart
      const result = service.isWithinRadius(-23.5616, -46.6563, -23.5700, -46.6600, 5);
      expect(result).toBe(true);
    });

    it('should return false when outside radius', () => {
      // ~50km apart (SP to Campinas roughly)
      const result = service.isWithinRadius(-23.5616, -46.6563, -22.9068, -47.0626, 10);
      expect(result).toBe(false);
    });
  });
});
