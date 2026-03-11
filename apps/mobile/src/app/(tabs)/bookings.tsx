import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import { useMyBookings } from '../../hooks/useBookings';
import { BookingCard } from '../../components/booking/BookingCard';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { theme } from '../../theme';

const TABS = [
  { key: 'active', label: 'Ativos' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
];

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PAID', 'ACCEPTED', 'SCHEDULED', 'IN_TRANSIT', 'IN_PROGRESS'];
const COMPLETED_STATUSES = ['COMPLETED', 'REFUNDED'];
const CANCELLED_STATUSES = ['CANCELLED_BY_CLIENT', 'CANCELLED_BY_PROVIDER', 'IN_DISPUTE'];

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState('active');
  const { data, isLoading, refetch, isRefetching } = useMyBookings();

  const allBookings = data?.items ?? [];

  const filtered = allBookings.filter((b) => {
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(b.status);
    if (activeTab === 'completed') return COMPLETED_STATUSES.includes(b.status);
    return CANCELLED_STATUSES.includes(b.status);
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pedidos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const count = allBookings.filter((b) => {
            if (tab.key === 'active') return ACTIVE_STATUSES.includes(b.status);
            if (tab.key === 'completed') return COMPLETED_STATUSES.includes(b.status);
            return CANCELLED_STATUSES.includes(b.status);
          }).length;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, activeTab === tab.key && styles.badgeActive]}>
                  <Text style={[styles.badgeText, activeTab === tab.key && styles.badgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <ClipboardList size={48} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>Nenhum pedido</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'active'
              ? 'Você não tem pedidos ativos agora'
              : activeTab === 'completed'
              ? 'Nenhum pedido concluído ainda'
              : 'Nenhum pedido cancelado'}
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.ctaBtnText}>Encontrar profissional</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing[3] }} />}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/booking/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.white },
  header: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[2], paddingBottom: theme.spacing[3] },
  title: { fontSize: theme.typography.fontSize['2xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  tabRow: { flexDirection: 'row', paddingHorizontal: theme.spacing[4], gap: theme.spacing[2], marginBottom: theme.spacing[4] },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: theme.spacing[2], borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.backgroundSecondary },
  tabActive: { backgroundColor: theme.colors.primary },
  tabLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary },
  tabLabelActive: { color: theme.colors.white },
  badge: { backgroundColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textSecondary },
  badgeTextActive: { color: theme.colors.white },
  list: { paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[8] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing[8] },
  emptyTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary, marginTop: theme.spacing[4], marginBottom: theme.spacing[1] },
  emptyText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing[6] },
  ctaBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing[6], paddingVertical: theme.spacing[3], borderRadius: theme.borderRadius.full },
  ctaBtnText: { color: theme.colors.white, fontFamily: theme.typography.fontFamily.semibold, fontSize: theme.typography.fontSize.sm },
});
