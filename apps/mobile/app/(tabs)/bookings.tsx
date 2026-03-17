import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT:    { label: 'Aguardando Pagamento', color: '#F59E0B' },
  PAYMENT_AUTHORIZED: { label: 'Pago', color: '#10B981' },
  CONFIRMED:          { label: 'Confirmado', color: '#3B82F6' },
  PROVIDER_EN_ROUTE:  { label: 'Prestador a Caminho', color: '#8B5CF6' },
  IN_PROGRESS:        { label: 'Em Andamento', color: '#1B4FFF' },
  COMPLETED:          { label: 'Concluído', color: '#10B981' },
  CANCELLED_CLIENT:   { label: 'Cancelado', color: '#EF4444' },
  CANCELLED_PROVIDER: { label: 'Cancelado pelo Prestador', color: '#EF4444' },
  DISPUTED:           { label: 'Em Disputa', color: '#F97316' },
};

export default function BookingsScreen() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/v1/bookings').then((r) => r.data),
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Agendamentos</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1B4FFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }: { item: { id: string; status: string; scheduledAt: string; provider: { user: { profile: { displayName: string } } }; totalCents: number } }) => {
            const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: '#6B7280' };
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.providerName}>{item.provider.user.profile.displayName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                <Text style={styles.date}>
                  {new Date(item.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.price}>
                  R$ {(item.totalCents / 100).toFixed(2).replace('.', ',')}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>Nenhum agendamento ainda</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  providerName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  price: { fontSize: 15, fontWeight: '700', color: '#111827' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6B7280' },
});
