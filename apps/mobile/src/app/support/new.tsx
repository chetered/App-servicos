import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { api } from '../../lib/api';

const primary = '#7C3AED';

const CATEGORIES = [
  'Problema com pagamento',
  'Profissional não compareceu',
  'Qualidade do serviço',
  'Cancelamento',
  'Reembolso',
  'Segurança',
  'Outro',
];

export default function NewTicketScreen() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/support', { subject, category, description }).then((r) => r.data.data),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
      Alert.alert('Ticket criado!', 'Nossa equipe responderá em breve.', [
        {
          text: 'Ver ticket',
          onPress: () => router.replace({ pathname: '/support/ticket', params: { ticketId: ticket.id } }),
        },
      ]);
    },
    onError: () => Alert.alert('Erro', 'Não foi possível criar o ticket.'),
  });

  const valid = subject.trim().length >= 5 && category && description.trim().length >= 10;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.intro}>Descreva seu problema e nossa equipe entrará em contato o mais rápido possível.</Text>

      {/* Subject */}
      <View style={styles.field}>
        <Text style={styles.label}>Assunto *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Profissional não compareceu"
          placeholderTextColor="#9CA3AF"
          value={subject}
          onChangeText={setSubject}
          maxLength={100}
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={styles.label}>Categoria *</Text>
        <TouchableOpacity style={styles.select} onPress={() => setShowCategories((v) => !v)}>
          <Text style={[styles.selectText, !category && styles.placeholder]}>
            {category || 'Selecione uma categoria'}
          </Text>
          <ChevronDown size={16} color="#6B7280" />
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.dropdown}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                onPress={() => { setCategory(cat); setShowCategories(false); }}
              >
                <Text style={[styles.dropdownText, category === cat && styles.dropdownActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Descrição *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Descreva o problema com o máximo de detalhes possível..."
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={2000}
        />
        <Text style={styles.charCount}>{description.length}/2000</Text>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!valid || mutation.isPending) && styles.submitDisabled]}
        onPress={() => mutation.mutate()}
        disabled={!valid || mutation.isPending}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>{mutation.isPending ? 'Enviando...' : 'Enviar ticket'}</Text>
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
    marginBottom: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  intro: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  select: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontSize: 14, color: '#111827' },
  placeholder: { color: '#9CA3AF' },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  dropdownText: { fontSize: 14, color: '#374151' },
  dropdownActive: { color: primary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
