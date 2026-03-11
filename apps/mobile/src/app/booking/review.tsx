import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Star, ChevronLeft, Send } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { Avatar } from '../../components/common/Avatar';

const primary = '#7C3AED';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Star
            size={36}
            color={n <= value ? '#F59E0B' : '#D1D5DB'}
            fill={n <= value ? '#F59E0B' : 'none'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const RATING_LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

export default function ReviewScreen() {
  const { orderId, providerName, providerAvatar } = useLocalSearchParams<{
    orderId: string;
    providerName: string;
    providerAvatar?: string;
  }>();

  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/reviews`, { orderId, rating, comment }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', orderId] });
      Alert.alert('Avaliação enviada', 'Obrigado pelo seu feedback!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    },
    onError: () => Alert.alert('Erro', 'Não foi possível enviar sua avaliação.'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliar serviço</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Provider */}
      <View style={styles.providerCard}>
        <Avatar
          name={providerName ?? 'Profissional'}
          uri={providerAvatar}
          size={72}
          verified
        />
        <Text style={styles.providerName}>{providerName ?? 'Profissional'}</Text>
        <Text style={styles.providerSub}>Como foi a experiência?</Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingSection}>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
        )}
      </View>

      {/* Comment */}
      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Deixe um comentário (opcional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Conte como foi o atendimento, pontualidade, qualidade..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (rating === 0 || mutation.isPending) && styles.submitBtnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={rating === 0 || mutation.isPending}
        activeOpacity={0.8}
      >
        {mutation.isPending ? (
          <LoadingScreen size="small" />
        ) : (
          <>
            <Send size={18} color="#fff" />
            <Text style={styles.submitText}>Enviar avaliação</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)/bookings')} style={styles.skipBtn}>
        <Text style={styles.skipText}>Pular por agora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  providerCard: { alignItems: 'center', marginBottom: 32 },
  providerName: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 12 },
  providerSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  ratingSection: { alignItems: 'center', marginBottom: 32 },
  stars: { flexDirection: 'row', gap: 8 },
  ratingLabel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  commentSection: { marginBottom: 24 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  commentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, color: '#6B7280' },
});
