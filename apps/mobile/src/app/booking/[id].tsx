import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Star,
  AlertCircle, CheckCircle, Clock, XCircle,
} from 'lucide-react-native';
import { useBooking, useCancelBooking } from '../../hooks/useBookings';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { theme } from '../../theme';
import {
  formatCurrency, formatDateTime, BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR, getI18nValue,
} from '../../utils/format';

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle size={20} color={theme.colors.success} />,
  CANCELLED_BY_CLIENT: <XCircle size={20} color={theme.colors.error} />,
  CANCELLED_BY_PROVIDER: <XCircle size={20} color={theme.colors.error} />,
  IN_DISPUTE: <AlertCircle size={20} color="#F97316" />,
};

const CANCELLABLE = ['PAID', 'ACCEPTED', 'SCHEDULED'];
const REVIEWABLE = ['COMPLETED'];

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useBooking(id!);
  const cancelMutation = useCancelBooking();

  if (isLoading) return <LoadingScreen />;
  if (!booking) return <LoadingScreen message="Pedido não encontrado" />;

  const statusColor = BOOKING_STATUS_COLOR[booking.status] ?? theme.colors.textSecondary;
  const statusLabel = BOOKING_STATUS_LABEL[booking.status] ?? booking.status;
  const canCancel = CANCELLABLE.includes(booking.status);
  const canReview = REVIEWABLE.includes(booking.status);

  const handleCancel = () => {
    Alert.alert(
      'Cancelar pedido',
      'Tem certeza? Cancelamentos frequentes podem afetar sua conta.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: () => cancelMutation.mutate({ id: booking.id }),
        },
      ]
    );
  };

  const handleCall = () => {
    Linking.openURL(`tel:${(booking.provider as any).user?.phone ?? ''}`);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do pedido</Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <View style={styles.statusRow}>
            {STATUS_ICON[booking.status] ?? <Clock size={20} color={statusColor} />}
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              <Text style={styles.statusDate}>{formatDateTime(booking.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Provider */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profissional</Text>
          <View style={styles.providerRow}>
            <Avatar
              uri={booking.provider.user.avatarUrl}
              name={booking.provider.user.fullName}
              size={52}
              verified={true}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{booking.provider.user.fullName}</Text>
              <View style={styles.ratingRow}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{booking.provider.averageRating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.contactBtns}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => {}}>
                <MessageCircle size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
                <Phone size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Service info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Serviço</Text>
          <Text style={styles.serviceName}>{getI18nValue(booking.service.name)}</Text>
          {booking.scheduledAt && (
            <View style={styles.infoRow}>
              <Clock size={14} color={theme.colors.textTertiary} />
              <Text style={styles.infoText}>{formatDateTime(booking.scheduledAt)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <MapPin size={14} color={theme.colors.textTertiary} />
            <Text style={styles.infoText}>
              {booking.address.street}, {booking.address.number} – {booking.address.neighborhood}
            </Text>
          </View>
          {booking.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Obs:</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}
        </View>

        {/* Price */}
        {booking.priceBreakdown && (
          <PriceBreakdown breakdown={booking.priceBreakdown} currency={booking.currency} />
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {canReview && (
            <Button
              label="⭐ Avaliar profissional"
              variant="primary"
              onPress={() => router.push({ pathname: '/booking/review', params: { id: booking.id } })}
              fullWidth
              style={styles.actionBtn}
            />
          )}
          {canCancel && (
            <Button
              label="Cancelar pedido"
              variant="outline"
              onPress={handleCancel}
              isLoading={cancelMutation.isPending}
              fullWidth
              style={styles.actionBtn}
            />
          )}
          <Button
            label="Preciso de ajuda"
            variant="ghost"
            onPress={() => router.push('/support/ticket')}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing[4], backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing[4], gap: theme.spacing[3] },
  statusCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], borderLeftWidth: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  statusInfo: {},
  statusLabel: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.bold },
  statusDate: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary, marginTop: 2 },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], gap: theme.spacing[3] },
  cardTitle: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  providerInfo: { flex: 1 },
  providerName: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  contactBtns: { flexDirection: 'row', gap: theme.spacing[2] },
  contactBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[2] },
  infoText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, flex: 1, lineHeight: 18 },
  notesBox: { backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.lg, padding: theme.spacing[3] },
  notesLabel: { fontSize: 11, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textTertiary, marginBottom: 2 },
  notesText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  actionsCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], gap: theme.spacing[2] },
  actionBtn: { marginBottom: 0 },
});
