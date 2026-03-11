import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { formatCurrency } from '../../utils/format';
import type { PriceBreakdown as PriceBreakdownItem } from '../../store/booking.store';

interface Props {
  breakdown: PriceBreakdownItem[];
  currency?: string;
}

const TYPE_COLOR: Record<string, string> = {
  base: theme.colors.textPrimary,
  fee: theme.colors.textSecondary,
  discount: theme.colors.success,
  total: theme.colors.primary,
};

export function PriceBreakdown({ breakdown, currency = 'BRL' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do valor</Text>
      <View style={styles.divider} />

      {breakdown.map((item, i) => {
        const isTotal = item.type === 'total';
        const isDiscount = item.type === 'discount';
        return (
          <View
            key={i}
            style={[styles.row, isTotal && styles.totalRow]}
          >
            <Text style={[styles.label, isTotal && styles.totalLabel]}>{item.label}</Text>
            <Text style={[styles.amount, { color: TYPE_COLOR[item.type] }, isTotal && styles.totalAmount]}>
              {isDiscount ? '-' : ''}{formatCurrency(Math.abs(item.amount), currency)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[3],
  },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: theme.spacing[3] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  totalRow: {
    marginTop: theme.spacing[2],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 0,
  },
  label: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  totalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  amount: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium },
  totalAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
