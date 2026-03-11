import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface Provider {
  id: string;
  user: { fullName: string; avatarUrl?: string };
  averageRating: number;
  totalReviews: number;
  totalCompletedJobs: number;
  isVerified: boolean;
  isPremium: boolean;
  isSponsored: boolean;
  isAvailableNow: boolean;
  distanceKm: number | null;
  startingPrice: number | null;
  services: string[];
}

interface ProviderCardProps {
  provider: Provider;
  onPress: () => void;
  currency?: string;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onPress,
  currency = 'R$',
}) => {
  const formatPrice = (price: number) => {
    return `${currency} ${(price / 100).toFixed(0)}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Sponsored badge */}
      {provider.isSponsored && (
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredText}>Destaque</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {provider.user.avatarUrl ? (
            <Image source={{ uri: provider.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {provider.user.fullName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {provider.isAvailableNow && <View style={styles.availableDot} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {provider.user.fullName}
            </Text>
            <View style={styles.badges}>
              {provider.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verificado</Text>
                </View>
              )}
              {provider.isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>★ Pro</Text>
                </View>
              )}
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.rating}>{provider.averageRating?.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({provider.totalReviews} avaliações)</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.jobs}>{provider.totalCompletedJobs} serviços</Text>
          </View>

          {/* Distance & Price */}
          <View style={styles.metaRow}>
            {provider.distanceKm !== null && (
              <Text style={styles.distance}>
                📍 {provider.distanceKm < 1
                  ? `${Math.round(provider.distanceKm * 1000)}m`
                  : `${provider.distanceKm}km`}
              </Text>
            )}
            {provider.startingPrice && (
              <Text style={styles.price}>
                A partir de{' '}
                <Text style={styles.priceValue}>{formatPrice(provider.startingPrice)}</Text>
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius['2xl'],
    marginHorizontal: Spacing[4],
    marginVertical: Spacing[2],
    padding: Spacing[4],
    ...Shadows.card,
    overflow: 'visible',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: Colors.sponsored,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  sponsoredText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySurface,
  },
  avatarInitial: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  info: {
    flex: 1,
    gap: Spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.verified,
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: Colors.premium + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  premiumText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.premium,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    color: Colors.premium,
    fontSize: Typography.fontSize.sm,
  },
  rating: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  dot: {
    color: Colors.textTertiary,
    fontSize: Typography.fontSize.sm,
  },
  jobs: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  distance: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
