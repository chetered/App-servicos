import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { ProviderCard } from '../../components/common/ProviderCard';
import { api } from '../../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const CATEGORIES_EMOJIS: Record<string, string> = {
  limpeza: '🧹', babas: '👶', cuidadores: '❤️', passeadores: '🐕',
  eletrica: '⚡', hidraulica: '🔧', pintura: '🎨', montagem: '🪑',
  jardinagem: '🌱', organizacao: '📦', cozinha: '🍳', lavanderia: '👕',
  reparos: '🔨', motorista: '🚗', tecnico: '🔩',
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock location (in production: use expo-location)
  const userLocation = { latitude: -23.5616, longitude: -46.6563 };

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.search.categories('BR'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: providersData, isLoading: providersLoading, refetch } = useQuery({
    queryKey: ['providers', selectedCategory, userLocation],
    queryFn: () =>
      api.search.providers({
        categoryId: selectedCategory,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: 20,
        sortBy: 'relevance',
        limit: 20,
      }),
    enabled: true,
  });

  const categories = (categoriesData as any)?.data?.data || [];
  const providers = (providersData as any)?.data?.data || [];

  const firstName = user?.fullName?.split(' ')[0] || 'você';
  const greeting = getGreeting();

  const handleCategoryPress = useCallback((categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  }, [selectedCategory]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        params: { q: searchQuery, latitude: userLocation.latitude, longitude: userLocation.longitude },
      });
    }
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{firstName}! 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <TouchableOpacity style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>São Paulo, SP</Text>
          <Text style={styles.locationChevron}>›</Text>
        </TouchableOpacity>

        {/* Search */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.9}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Buscar serviço ou profissional...
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={providersLoading} onRefresh={refetch} />}
      >
        {/* Featured Banner */}
        <TouchableOpacity style={styles.banner} activeOpacity={0.9}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerBadge}>🎉 Novo cadastro</Text>
            <Text style={styles.bannerTitle}>10% off no primeiro serviço</Text>
            <Text style={styles.bannerSubtitle}>Use o cupom BEMVINDO10</Text>
          </View>
          <Text style={styles.bannerEmoji}>✨</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>O que você precisa?</Text>
            <TouchableOpacity onPress={() => router.push('/categories')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.slice(0, 10).map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.id && styles.categoryItemSelected,
                ]}
                onPress={() => handleCategoryPress(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>
                  {CATEGORIES_EMOJIS[cat.slug] || '🔧'}
                </Text>
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory === cat.id && styles.categoryNameSelected,
                  ]}
                  numberOfLines={2}
                >
                  {cat.name?.['pt-BR'] || cat.slug}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Providers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? 'Profissionais disponíveis' : 'Bem avaliados perto de você'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {providersLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Buscando profissionais...</Text>
            </View>
          ) : providers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Nenhum profissional encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente outra categoria ou aumente o raio de busca
              </Text>
            </View>
          ) : (
            providers.map((provider: any) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onPress={() =>
                  router.push({
                    pathname: '/provider/[id]',
                    params: { id: provider.id },
                  })
                }
              />
            ))
          )}
        </View>

        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: Spacing[5],
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: Typography.fontSize.base,
    color: Colors.textInverse + 'BB',
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.textInverse,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.textInverse + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: Typography.fontSize.xl,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: Typography.fontSize.sm,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textInverse + 'CC',
    fontWeight: '500',
  },
  locationChevron: {
    fontSize: Typography.fontSize.md,
    color: Colors.textInverse + 'CC',
  },
  searchBar: {
    height: 52,
    backgroundColor: Colors.textInverse,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  searchIcon: {
    fontSize: Typography.fontSize.md,
  },
  searchPlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    flex: 1,
  },
  banner: {
    margin: Spacing[4],
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  bannerContent: {
    gap: Spacing[1],
  },
  bannerBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textInverse + 'CC',
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  bannerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textInverse + 'BB',
  },
  bannerEmoji: {
    fontSize: 48,
  },
  section: {
    marginTop: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  categoryItem: {
    width: 80,
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: Spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: Spacing[8],
    alignItems: 'center',
    gap: Spacing[3],
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
