import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Zap, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProviderProfile } from '../../hooks/useProviders';
import { useEstimatePrice } from '../../hooks/useBookings';
import { useBookingStore } from '../../store/booking.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { theme } from '../../theme';
import { getI18nValue, formatCurrency } from '../../utils/format';

type BookingType = 'IMMEDIATE' | 'SCHEDULED';

export default function BookingCreateScreen() {
  const { providerId, serviceId } = useLocalSearchParams<{ providerId: string; serviceId?: string }>();
  const { user } = useAuthStore();
  const { setDraft } = useBookingStore();
  const { data: provider, isLoading } = useProviderProfile(providerId!);
  const estimateMutation = useEstimatePrice();

  const [bookingType, setBookingType] = useState<BookingType>('SCHEDULED');
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId ?? '');
  const [scheduledAt, setScheduledAt] = useState<Date>(new Date(Date.now() + 24 * 3600 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [addInsurance, setAddInsurance] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);

  const selectedService = provider?.services.find((s) => s.service.id === selectedServiceId);

  useEffect(() => {
    if (selectedServiceId) handleEstimate();
  }, [selectedServiceId, bookingType, scheduledAt]);

  const handleEstimate = async () => {
    if (!selectedServiceId || !providerId) return;
    const defaultAddress = user?.addresses?.[0];
    try {
      const result = await estimateMutation.mutateAsync({
        providerId: providerId!,
        serviceId: selectedServiceId,
        bookingType,
        scheduledAt: bookingType === 'SCHEDULED' ? scheduledAt.toISOString() : undefined,
        addressId: defaultAddress?.id,
      });
      setEstimate(result);
    } catch {}
  };

  const handleContinue = () => {
    if (!selectedServiceId) return;
    setDraft({
      providerId: providerId!,
      serviceId: selectedServiceId,
      bookingType,
      scheduledAt: bookingType === 'SCHEDULED' ? scheduledAt.toISOString() : undefined,
      notes: notes.trim() || undefined,
      addInsurance,
    });
    router.push('/booking/checkout');
  };

  if (isLoading || !provider) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo pedido</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Provider mini card */}
          <View style={styles.providerMini}>
            <Avatar uri={provider.user.avatarUrl} name={provider.user.fullName} size={44} />
            <View style={styles.providerMiniInfo}>
              <Text style={styles.providerName}>{provider.user.fullName}</Text>
              <Text style={styles.providerRating}>⭐ {provider.averageRating.toFixed(1)} · {provider.totalCompletedJobs} jobs</Text>
            </View>
          </View>

          {/* Service picker */}
          <Text style={styles.sectionLabel}>Serviço</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
            {provider.services.map((ps) => (
              <TouchableOpacity
                key={ps.service.id}
                style={[styles.serviceChip, selectedServiceId === ps.service.id && styles.serviceChipActive]}
                onPress={() => setSelectedServiceId(ps.service.id)}
              >
                <Text style={[styles.serviceChipText, selectedServiceId === ps.service.id && styles.serviceChipTextActive]}>
                  {getI18nValue(ps.service.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Booking type */}
          <Text style={styles.sectionLabel}>Quando?</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, bookingType === 'IMMEDIATE' && styles.typeBtnActive]}
              onPress={() => setBookingType('IMMEDIATE')}
            >
              <Zap size={16} color={bookingType === 'IMMEDIATE' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.typeBtnText, bookingType === 'IMMEDIATE' && styles.typeBtnTextActive]}>Agora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, bookingType === 'SCHEDULED' && styles.typeBtnActive]}
              onPress={() => setBookingType('SCHEDULED')}
            >
              <Calendar size={16} color={bookingType === 'SCHEDULED' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.typeBtnText, bookingType === 'SCHEDULED' && styles.typeBtnTextActive]}>Agendar</Text>
            </TouchableOpacity>
          </View>

          {/* Date/time picker */}
          {bookingType === 'SCHEDULED' && (
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Clock size={16} color={theme.colors.primary} />
              <Text style={styles.dateBtnText}>
                {scheduledAt.toLocaleDateString('pt-BR')} às {scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={scheduledAt}
              mode="datetime"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, date) => { setShowDatePicker(false); if (date) setScheduledAt(date); }}
            />
          )}

          {/* Notes */}
          <Text style={styles.sectionLabel}>Observações (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ex: Foco no banheiro e cozinha. Tenho pet em casa..."
            placeholderTextColor={theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          {/* Price estimate */}
          {estimate && (
            <View style={styles.estimateSection}>
              <PriceBreakdown breakdown={estimate.breakdown} currency={estimate.currency} />
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Button
            label={`Continuar${estimate ? ` · ${formatCurrency(estimate.totalAmount)}` : ''}`}
            onPress={handleContinue}
            fullWidth
            disabled={!selectedServiceId}
          />
        </SafeAreaView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.white },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing[4], borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing[4], gap: theme.spacing[1], paddingBottom: theme.spacing[8] },
  providerMini: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.xl, padding: theme.spacing[3], marginBottom: theme.spacing[4] },
  providerMiniInfo: { flex: 1 },
  providerName: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  providerRating: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary, marginBottom: theme.spacing[2], marginTop: theme.spacing[4] },
  servicesScroll: { flexGrow: 0, marginBottom: theme.spacing[2] },
  serviceChip: { marginRight: theme.spacing[2], paddingHorizontal: theme.spacing[3], paddingVertical: 8, borderRadius: theme.borderRadius.full, borderWidth: 1.5, borderColor: theme.colors.border },
  serviceChipActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
  serviceChipText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },
  serviceChipTextActive: { color: theme.colors.primary },
  typeRow: { flexDirection: 'row', gap: theme.spacing[3] },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: theme.spacing[3], borderRadius: theme.borderRadius.xl, borderWidth: 1.5, borderColor: theme.colors.border },
  typeBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}08` },
  typeBtnText: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary },
  typeBtnTextActive: { color: theme.colors.primary },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.xl, padding: theme.spacing[3] },
  dateBtnText: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary },
  notesInput: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.xl, padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm, color: theme.colors.textPrimary, backgroundColor: theme.colors.backgroundSecondary, minHeight: 80, textAlignVertical: 'top' },
  estimateSection: { marginTop: theme.spacing[4] },
  footer: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.border },
});
