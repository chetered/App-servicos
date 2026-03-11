import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { Avatar } from '../common/Avatar';
import { theme } from '../../theme';
import {
  formatCurrency, formatScheduledAt, getI18nValue,
  BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR,
} from '../../utils/format';
import type { Booking } from '../../store/booking.store';

interface Props {
  booking: Booking;
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: Props) {
  const statusLabel = BOOKING_STATUS_LABEL[booking.status] ?? booking.status;
  const statusColor = BOOKING_STATUS_COLOR[booking.status] ?? theme.colors.textSecondary;
  const serviceName = getI18nValue(booking.service.name);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Avatar
          uri={booking.provider.user.avatarUrl}
          name={booking.provider.user.fullName}
          size={48}
        />

        <View style={styles.info}>
          <Text style={styles.providerName} numberOfLines={1}>
            {booking.provider.user.fullName}
          </Text>
          <Text style={styles.serviceName} numberOfLines={1}>{serviceName}</Text>

          {booking.scheduledAt && (
            <View style={styles.dateRow}>
              <Calendar size={12} color={theme.colors.textTertiary} />
              <Text style={styles.dateText}>{formatScheduledAt(booking.scheduledAt)}</Text>
            </View>
          )}
        </View>

        <View style={styles.right}>
          <Text style={styles.amount}>{formatCurrency(booking.totalAmount)}</Text>
          <ChevronRight size={16} color={theme.colors.textTertiary} />
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[3],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  info: { flex: 1 },
  providerName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.medium },
});
