import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-AR' | 'es-MX';

@Injectable()
export class LocalizationService {
  private countryCache: Map<string, any> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Get a localized string from a JSON translatable field.
   * e.g. translateField({ "pt-BR": "Diarista", "en-US": "Cleaner" }, 'en-US')
   */
  translateField(field: Record<string, string> | null, locale: SupportedLocale): string {
    if (!field) return '';
    return field[locale] ?? field['pt-BR'] ?? Object.values(field)[0] ?? '';
  }

  async getCountryConfig(countryCode: string) {
    if (this.countryCache.has(countryCode)) return this.countryCache.get(countryCode);

    const country = await this.prisma.country.findUnique({
      where: { code: countryCode },
      include: {
        gateways: { where: { isActive: true } },
        taxRules: { where: { isActive: true } },
        featureFlags: { where: { status: 'ENABLED' } },
      },
    });

    if (!country) throw new NotFoundException(`Country '${countryCode}' not configured`);

    this.countryCache.set(countryCode, country);
    setTimeout(() => this.countryCache.delete(countryCode), 10 * 60 * 1000); // 10min cache

    return country;
  }

  async getActiveCountries() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
        currencyCode: true,
        currencySymbol: true,
        defaultLocale: true,
        timezone: true,
        phonePrefix: true,
      },
    });
  }

  formatCurrency(amountCents: number, currencyCode: string, locale: SupportedLocale): string {
    const amount = amountCents / 100;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  }
}
