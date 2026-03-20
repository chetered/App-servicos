import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/api';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get(`/v1/bookings/${id}`).then((r) => r.data),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (payload: { status: string; cancelReason?: string }) =>
      api.patch(`/v1/bookings/${id}/status`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', id] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao atualizar';
      Alert.alert('Erro', msg);
    },
  });

  if (isLoading) return <ActivityIndicator size="large" color="#1B4FFF" style={{ marginTop: 80 }} />;
  if (!booking) return null;

  const canCancel = ['PAYMENT_AUTHORIZED', 'CONFIRMED'].includes(booking.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.provider}>{booking.provider?.user?.profile?.displayName}</Text>
        <Text style={styles.status}>Status: {booking.status}</Text>
        <Text style={styles.date}>
          {new Date(booking.scheduledAt).toLocaleString('pt-BR')}
        </Text>
        <Text style={styles.price}>
          Total: R$ {(booking.totalCents / 100).toFixed(2).replace('.', ',')}
        </Text>

        {booking.address && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Endereço</Text>
            <Text style={styles.cardText}>{booking.address.street}, {booking.address.number}</Text>
            <Text style={styles.cardText}>{booking.address.neighborhood} — {booking.address.city}</Text>
          </View>
        )}

        {booking.timeline?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Histórico</Text>
            {booking.timeline.map((t: { id: string; status: string; createdAt: string }) => (
              <Text key={t.id} style={styles.timelineItem}>
                {new Date(t.createdAt).toLocaleTimeString('pt-BR')} — {t.status}
              </Text>
            ))}
          </View>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            disabled={isPending}
            onPress={() =>
              Alert.alert('Cancelar', 'Deseja cancelar este agendamento?', [
                { text: 'Não', style: 'cancel' },
                { text: 'Sim, cancelar', style: 'destructive', onPress: () => updateStatus({ status: 'CANCELLED_CLIENT', cancelReason: 'Cancelado pelo cliente' }) },
              ])
            }
          >
            {isPending ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.cancelText}>Cancelar Agendamento</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, gap: 12 },
  provider: { fontSize: 22, fontWeight: '700', color: '#111827' },
  status: { fontSize: 14, color: '#6B7280' },
  date: { fontSize: 15, color: '#374151' },
  price: { fontSize: 20, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardText: { fontSize: 14, color: '#374151', marginBottom: 2 },
  timelineItem: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  cancelButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
