import { useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

interface Provider {
  id: string;
  user: { profile: { displayName: string; avatarUrl?: string } };
  avgRating: number;
  totalReviews: number;
  matchScore?: number;
  distanceKm?: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['providers', categoryId, search],
    queryFn: () =>
      api.get('/v1/matching/search', {
        params: { categoryId, q: search || undefined, latitude: -23.5654, longitude: -46.6833, scheduledAt: new Date().toISOString() },
      }).then((r) => r.data),
    enabled: !!categoryId,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Prestadores</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1B4FFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item: Provider) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Provider }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user.profile.displayName[0]}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.user.profile.displayName}</Text>
                <Text style={styles.rating}>⭐ {item.avgRating.toFixed(1)} ({item.totalReviews} avaliações)</Text>
                {item.distanceKm && <Text style={styles.distance}>📍 {item.distanceKm.toFixed(1)} km</Text>}
              </View>
              {item.matchScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{Math.round(item.matchScore * 100)}%</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>{categoryId ? 'Nenhum prestador encontrado' : 'Selecione uma categoria na tela inicial'}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  searchInput: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1B4FFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rating: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  distance: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  scoreBadge: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  scoreText: { color: '#1B4FFF', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
