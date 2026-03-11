import { Injectable } from '@nestjs/common';
import { getDistance } from 'geolib';

export enum DisplacementType {
  NONE = 'NONE',
  FIXED = 'FIXED',
  BY_DISTANCE_RANGE = 'BY_DISTANCE_RANGE',
  BY_ZONE = 'BY_ZONE',
  INCLUDED = 'INCLUDED',
}

interface DisplacementRule {
  type: DisplacementType;
  fixedAmount?: number;
  distanceRanges?: { minKm: number; maxKm: number; price: number }[];
  zoneRules?: { zone: string; price: number }[];
  showSeparately: boolean;
}

@Injectable()
export class DisplacementService {
  async calculate(params: {
    rule: DisplacementRule | null;
    providerLatitude?: number | null;
    providerLongitude?: number | null;
    clientLatitude: number;
    clientLongitude: number;
  }): Promise<number> {
    const { rule, providerLatitude, providerLongitude, clientLatitude, clientLongitude } = params;

    if (!rule || rule.type === DisplacementType.NONE) {
      return 0;
    }

    if (rule.type === DisplacementType.INCLUDED) {
      return 0; // Included in service price, shown separately in breakdown
    }

    if (rule.type === DisplacementType.FIXED) {
      return rule.fixedAmount || 0;
    }

    if (rule.type === DisplacementType.BY_DISTANCE_RANGE) {
      if (!providerLatitude || !providerLongitude) {
        return rule.fixedAmount || 0; // Fallback if no provider location
      }

      const distanceMeters = getDistance(
        { latitude: providerLatitude, longitude: providerLongitude },
        { latitude: clientLatitude, longitude: clientLongitude },
      );
      const distanceKm = distanceMeters / 1000;

      const applicableRange = rule.distanceRanges?.find(
        (range) => distanceKm >= range.minKm && distanceKm < range.maxKm,
      );

      return applicableRange?.price || 0;
    }

    return 0;
  }

  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const distanceMeters = getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 },
    );
    return distanceMeters / 1000;
  }

  isWithinRadius(
    providerLat: number,
    providerLon: number,
    clientLat: number,
    clientLon: number,
    radiusKm: number,
  ): boolean {
    const distance = this.calculateDistanceKm(providerLat, providerLon, clientLat, clientLon);
    return distance <= radiusKm;
  }
}
