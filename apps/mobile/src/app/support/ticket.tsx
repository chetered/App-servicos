import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send, CheckCircle } from 'lucide-react-native';
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

export default function SupportTicketScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support', 'ticket', ticketId],
    queryFn: () => api.get(`/support/${ticketId}`).then((r) => r.data.data),
    refetchInterval: 10_000,
  });

  const replyMutation = useMutation({
    mutationFn: (msg: string) =>
      api.post(`/support/${ticketId}/messages`, { message: msg }).then((r) => r.data.data),
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['support', 'ticket', ticketId] });
    },
    onError: () => Alert.alert('Erro', 'Não foi possível enviar a mensagem.'),
  });

  useEffect(() => {
    if (ticket?.messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [ticket?.messages?.length]);

  if (isLoading) return <LoadingScreen message="Carregando ticket..." />;
  if (!ticket) return null;

  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  const statusColor = STATUS_COLOR[ticket.status] ?? '#6B7280';

  const renderMessage = ({ item }: { item: any }) => {
    const isSupport = item.authorType === 'SUPPORT';
    return (
      <View style={[styles.msgWrapper, isSupport ? styles.msgWrapperSupport : styles.msgWrapperUser]}>
        <View style={[styles.msgBubble, isSupport ? styles.msgBubbleSupport : styles.msgBubbleUser]}>
          <Text style={[styles.msgAuthor, isSupport && styles.msgAuthorSupport]}>
            {isSupport ? 'Suporte SERVIX' : 'Você'}
          </Text>
          <Text style={styles.msgText}>{item.message}</Text>
          <Text style={styles.msgTime}>
            {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{ticket.subject}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Description card */}
      <View style={styles.descCard}>
        <Text style={styles.descLabel}>Descrição do problema</Text>
        <Text style={styles.descText}>{ticket.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>#{ticket.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.metaText}>
            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
          </Text>
          <Text style={[styles.metaPriority, ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? styles.metaHigh : null]}>
            {ticket.priority}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={ticket.messages ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        ListEmptyComponent={
          <Text style={styles.emptyMsg}>Nenhuma mensagem ainda. Envie sua dúvida abaixo.</Text>
        }
      />

      {/* Resolved banner */}
      {isResolved ? (
        <View style={styles.resolvedBanner}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.resolvedText}>Este ticket foi encerrado.</Text>
        </View>
      ) : (
        /* Input */
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escreva sua mensagem..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!message.trim() || replyMutation.isPending) && styles.sendBtnDisabled]}
            onPress={() => replyMutation.mutate(message)}
            disabled={!message.trim() || replyMutation.isPending}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginHorizontal: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  descCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  descLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  descText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  metaPriority: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  metaHigh: { color: '#EF4444' },
  msgList: { paddingHorizontal: 16, paddingVertical: 8 },
  msgWrapper: { marginBottom: 8 },
  msgWrapperUser: { alignItems: 'flex-start' },
  msgWrapperSupport: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  msgBubbleUser: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  msgBubbleSupport: { backgroundColor: `${primary}15` },
  msgAuthor: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  msgAuthorSupport: { color: primary },
  msgText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  msgTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  emptyMsg: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 32 },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
  },
  resolvedText: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
