import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, ChevronRight, Plus } from 'lucide-react-native';
import { api } from '../../lib/api';
import { LoadingScreen } from '../../components/common/LoadingScreen';

const primary = '#7C3AED';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  AWAITING_CLIENT: 'Aguardando você',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  AWAITING_CLIENT: '#8B5CF6',
  RESOLVED: '#10B981',
  CLOSED: '#6B7280',
};

export default function SupportListScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['support', 'my-tickets'],
    queryFn: () => api.get('/support/my').then((r) => r.data.data),
  });

  const tickets: any[] = data?.items ?? [];

  if (isLoading) return <LoadingScreen message="Carregando tickets..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Suporte</Text>
          <Text style={styles.headerSub}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/support/new')}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.newBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primary} />}
        renderItem={({ item }) => {
          const statusColor = STATUS_COLOR[item.status] ?? '#6B7280';
          const lastMessage = item.messages?.[item.messages.length - 1];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/support/ticket', params: { ticketId: item.id } })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${statusColor}15` }]}>
                <MessageCircle size={22} color={statusColor} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {lastMessage?.message ?? item.description}
                </Text>
                <View style={styles.cardMeta}>
                  <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                  </View>
                  <Text style={styles.date}>
                    {new Date(item.updatedAt ?? item.createdAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MessageCircle size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhum ticket</Text>
            <Text style={styles.emptySub}>Abra um novo ticket se precisar de ajuda</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/support/new')}>
              <Text style={styles.emptyBtnText}>Abrir ticket</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  subject: { fontSize: 14, fontWeight: '600', color: '#111827' },
  preview: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 260 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
