import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ProviderCard } from '../../components/common/ProviderCard';
import { theme } from '../../theme';

const CATEGORIES = [
  { id: 'all', label: 'Todos', emoji: '🔍' },
  { id: 'limpeza', label: 'Limpeza', emoji: '🧹' },
  { id: 'eletrica', label: 'Elétrica', emoji: '⚡' },
  { id: 'hidraulica', label: 'Hidráulica', emoji: '🔧' },
  { id: 'babysitter', label: 'Babá', emoji: '👶' },
  { id: 'pintura', label: 'Pintura', emoji: '🖌️' },
  { id: 'jardinagem', label: 'Jardim', emoji: '🌿' },
  { id: 'mudanca', label: 'Mudança', emoji: '📦' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedQuery(text), 400);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, selectedCategory],
    queryFn: () => api.marketplace.search({
      q: debouncedQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    }),
    enabled: true,
  });

  const providers = data?.items ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search input */}
      <View style={styles.searchRow}>
        <SearchIcon size={18} color={theme.colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar profissionais ou serviços..."
          placeholderTextColor={theme.colors.textTertiary}
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }}>
            <X size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedCategory === item.id && styles.chipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <Text style={[styles.chipLabel, selectedCategory === item.id && styles.chipLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : providers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Nenhum resultado</Text>
          <Text style={styles.emptyText}>Tente outros termos ou categorias</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={() => router.push(`/provider/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[2], paddingBottom: theme.spacing[3] },
  title: { fontSize: theme.typography.fontSize['2xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  filterBtn: { padding: theme.spacing[2] },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: theme.spacing[4], backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.xl, paddingHorizontal: theme.spacing[3], height: 48, marginBottom: theme.spacing[3] },
  searchIcon: { marginRight: theme.spacing[2] },
  searchInput: { flex: 1, fontSize: theme.typography.fontSize.base, color: theme.colors.textPrimary },
  chips: { paddingHorizontal: theme.spacing[4], gap: theme.spacing[2], marginBottom: theme.spacing[3] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: theme.spacing[3], paddingVertical: 8, borderRadius: theme.borderRadius.full, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.white },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },
  chipLabelActive: { color: theme.colors.primary },
  list: { paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[8] },
  separator: { height: theme.spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing[8] },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing[3] },
  emptyTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary, marginBottom: theme.spacing[1] },
  emptyText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center' },
});
