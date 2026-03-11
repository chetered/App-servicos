import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Tag, Shield, MapPin, Check } from 'lucide-react-native';
import { showMessage } from 'react-native-flash-message';
import { useBookingStore } from '../../store/booking.store';
import { useCreateBooking } from '../../hooks/useBookings';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/common/Button';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { theme } from '../../theme';
import { formatCurrency, formatScheduledAt } from '../../utils/format';

export default function CheckoutScreen() {
  const { draft, priceEstimate, clearDraft } = useBookingStore();
  const { user } = useAuthStore();
  const createMutation = useCreateBooking();
  const [couponCode, setCouponCode] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(
    user?.paymentMethods?.[0]?.id ?? ''
  );

  if (!draft || !priceEstimate) {
    router.back();
    return null;
  }

  const address = user?.addresses?.[0];

  const handleConfirm = async () => {
    if (!selectedPaymentMethodId && !draft.bookingType) {
      showMessage({ message: 'Selecione uma forma de pagamento', type: 'warning' });
      return;
    }

    Alert.alert(
      'Confirmar pedido',
      `Você será cobrado ${formatCurrency(priceEstimate.totalAmount)}. Confirma?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const booking = await createMutation.mutateAsync({
                ...draft,
                paymentMethodId: selectedPaymentMethodId,
                couponCode: couponCode.trim() || undefined,
              });
              clearDraft();
              router.replace(`/booking/${booking.id}`);
            } catch (err: any) {
              showMessage({
                message: err?.response?.data?.message ?? 'Erro ao confirmar pedido',
                type: 'danger',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revisar pedido</Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tipo</Text>
            <Text style={styles.summaryValue}>
              {draft.bookingType === 'IMMEDIATE' ? '⚡ Imediato' : '📅 Agendado'}
            </Text>
          </View>
          {draft.scheduledAt && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Data</Text>
              <Text style={styles.summaryValue}>{formatScheduledAt(draft.scheduledAt)}</Text>
            </View>
          )}
          {draft.notes && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Obs.</Text>
              <Text style={[styles.summaryValue, { flex: 1, textAlign: 'right' }]}>{draft.notes}</Text>
            </View>
          )}
        </View>

        {/* Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={16} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Endereço</Text>
          </View>
          {address ? (
            <Text style={styles.addressText}>
              {address.street}, {address.number} – {address.neighborhood}, {address.city}
            </Text>
          ) : (
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Adicionar endereço</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={16} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Pagamento</Text>
          </View>
          {user?.paymentMethods?.length ? (
            user.paymentMethods.map((pm: any) => (
              <TouchableOpacity
                key={pm.id}
                style={styles.paymentRow}
                onPress={() => setSelectedPaymentMethodId(pm.id)}
              >
                <View style={[styles.radio, selectedPaymentMethodId === pm.id && styles.radioActive]}>
                  {selectedPaymentMethodId === pm.id && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.paymentLabel}>
                  {pm.brand?.toUpperCase()} •••• {pm.last4}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Adicionar cartão</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Coupon */}
        <TouchableOpacity style={styles.couponRow}>
          <Tag size={16} color={theme.colors.textSecondary} />
          <Text style={styles.couponText}>Adicionar cupom de desconto</Text>
        </TouchableOpacity>

        {/* Insurance */}
        <TouchableOpacity
          style={[styles.insuranceRow, draft.addInsurance && styles.insuranceRowActive]}
          onPress={() => {}}
        >
          <View style={styles.insuranceLeft}>
            <Shield size={18} color={theme.colors.primary} />
            <View>
              <Text style={styles.insuranceTitle}>Proteção do serviço</Text>
              <Text style={styles.insuranceText}>Cobertura em caso de danos ou imprevistos</Text>
            </View>
          </View>
          <Text style={styles.insurancePrice}>+ R$ 5,00</Text>
        </TouchableOpacity>

        {/* Price breakdown */}
        <PriceBreakdown breakdown={priceEstimate.breakdown} currency={priceEstimate.currency} />
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(priceEstimate.totalAmount)}</Text>
          </View>
          <Button
            label="Confirmar pedido"
            onPress={handleConfirm}
            isLoading={createMutation.isPending}
            style={styles.confirmBtn}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing[4], backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing[4], gap: theme.spacing[3] },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], gap: theme.spacing[2] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[2] },
  cardTitle: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  summaryValue: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary },
  addressText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },
  addBtn: { paddingVertical: theme.spacing[2] },
  addBtnText: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.fontSize.sm },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[2] },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: theme.colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  paymentLabel: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.medium },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[4] },
  couponText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  insuranceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], borderWidth: 1.5, borderColor: theme.colors.border },
  insuranceRowActive: { borderColor: theme.colors.primary },
  insuranceLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3], flex: 1 },
  insuranceTitle: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  insuranceText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  insurancePrice: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.primary },
  footer: { backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[3] },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] },
  totalLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary },
  totalAmount: { fontSize: theme.typography.fontSize.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  confirmBtn: { flex: 1 },
});
