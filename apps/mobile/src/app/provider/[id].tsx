import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Share, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Star, MapPin, Clock, CheckCircle, Share2,
  Heart, Briefcase, Calendar, ChevronRight,
} from 'lucide-react-native';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useProviderProfile } from '../../hooks/useProviders';
import { theme } from '../../theme';
import { formatRating, formatDistance, getI18nValue } from '../../utils/format';

const { width } = Dimensions.get('window');

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: provider, isLoading } = useProviderProfile(id!);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'availability'>('services');

  if (isLoading) return <LoadingScreen message="Carregando perfil..." />;
  if (!provider) return <LoadingScreen message="Profissional não encontrado" />;

  const handleShare = () =>
    Share.share({ message: `Conheça ${provider.user.fullName} no SERVIX!`, url: `https://servix.app/p/${id}` });

  const isVerified = provider.verification?.status === 'APPROVED';
  const minPrice = provider.pricingRules.reduce((min, r) => Math.min(min, r.basePrice), Infinity);

  return (
    <View style={styles.root}>
      {/* Header overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Share2 size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Heart
                size={20}
                color={isFavorited ? theme.colors.error : theme.colors.textPrimary}
                fill={isFavorited ? theme.colors.error : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar uri={provider.user.avatarUrl} name={provider.user.fullName} size={80} />

          <View style={styles.nameRow}>
            <Text style={styles.name}>{provider.user.fullName}</Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={14} color={theme.colors.verified} />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            )}
            {provider.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>⭐ Premium</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statValue}>{formatRating(provider.averageRating)}</Text>
              <Text style={styles.statLabel}>({provider.totalReviews})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Briefcase size={14} color={theme.colors.textSecondary} />
              <Text style={styles.statValue}>{provider.totalCompletedJobs}</Text>
              <Text style={styles.statLabel}>jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Clock size={14} color={theme.colors.textSecondary} />
              <Text style={styles.statValue}>{provider.responseTimeMinutes ?? '—'}min</Text>
              <Text style={styles.statLabel}>resposta</Text>
            </View>
          </View>

          {provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}

          {/* Available badge */}
          <View style={[styles.availBadge, { backgroundColor: provider.isAvailableNow ? '#D1FAE5' : '#F3F4F6' }]}>
            <View style={[styles.availDot, { backgroundColor: provider.isAvailableNow ? theme.colors.success : theme.colors.textTertiary }]} />
            <Text style={[styles.availText, { color: provider.isAvailableNow ? '#065F46' : theme.colors.textSecondary }]}>
              {provider.isAvailableNow ? 'Disponível agora' : 'Não disponível agora'}
            </Text>
          </View>
        </View>

        {/* Tabs sticky */}
        <View style={styles.tabs}>
          {(['services', 'reviews', 'availability'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'services' ? 'Serviços' : tab === 'reviews' ? 'Avaliações' : 'Agenda'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'services' && (
          <View style={styles.tabContent}>
            {provider.services.map((ps) => {
              const rule = provider.pricingRules.find((r) => r.serviceId === ps.service.id);
              return (
                <TouchableOpacity
                  key={ps.service.id}
                  style={styles.serviceRow}
                  onPress={() => router.push({ pathname: '/booking/create', params: { providerId: id, serviceId: ps.service.id } })}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{getI18nValue(ps.service.name)}</Text>
                    <Text style={styles.serviceCategory}>{getI18nValue(ps.service.category.name)}</Text>
                  </View>
                  <View style={styles.serviceRight}>
                    {rule && <Text style={styles.servicePrice}>a partir de R$ {(rule.basePrice / 100).toFixed(2)}</Text>}
                    <ChevronRight size={16} color={theme.colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {(provider as any).reviews?.length === 0 ? (
              <View style={styles.noContent}>
                <Text style={styles.noContentText}>Nenhuma avaliação ainda</Text>
              </View>
            ) : (
              (provider as any).reviews?.map((review: any) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Avatar uri={review.author.avatarUrl} name={review.author.fullName} size={36} />
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewAuthor}>{review.author.fullName}</Text>
                      <View style={styles.starsRow}>
                        {Array(5).fill(null).map((_, i) => (
                          <Star key={i} size={12} color={i < review.rating ? '#F59E0B' : theme.colors.border} fill={i < review.rating ? '#F59E0B' : 'none'} />
                        ))}
                      </View>
                    </View>
                  </View>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                  {review.providerReply && (
                    <View style={styles.replyBox}>
                      <Text style={styles.replyLabel}>Resposta do profissional</Text>
                      <Text style={styles.replyText}>{review.providerReply}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'availability' && (
          <View style={styles.tabContent}>
            {provider.availability?.length === 0 ? (
              <View style={styles.noContent}>
                <Text style={styles.noContentText}>Disponibilidade não informada</Text>
              </View>
            ) : (
              provider.availability?.map((slot: any) => (
                <View key={slot.id} style={styles.availSlot}>
                  <Text style={styles.availDay}>{DAY_LABELS[slot.dayOfWeek]}</Text>
                  <Text style={styles.availTime}>{slot.startTime} – {slot.endTime}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA Footer */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.footerInner}>
          {isFinite(minPrice) && (
            <View>
              <Text style={styles.fromLabel}>A partir de</Text>
              <Text style={styles.fromPrice}>R$ {(minPrice / 100).toFixed(2)}</Text>
            </View>
          )}
          <Button
            label="Contratar"
            onPress={() => router.push({ pathname: '/booking/create', params: { providerId: id } })}
            style={styles.hireBtn}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.white },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBtns: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[2] },
  headerRight: { flexDirection: 'row', gap: theme.spacing[2] },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  hero: { paddingTop: 80, paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[4], alignItems: 'center', gap: theme.spacing[3] },
  nameRow: { alignItems: 'center', gap: theme.spacing[2] },
  name: { fontSize: theme.typography.fontSize['2xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary, textAlign: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  verifiedText: { fontSize: 11, color: '#065F46', fontFamily: theme.typography.fontFamily.medium },
  premiumBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  premiumText: { fontSize: 11, color: '#92400E', fontFamily: theme.typography.fontFamily.medium },
  stats: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  statLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary },
  statDivider: { width: 1, height: 14, backgroundColor: theme.colors.border },
  bio: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: theme.spacing[3], paddingVertical: 6, borderRadius: theme.borderRadius.full },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.medium },
  tabs: { flexDirection: 'row', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: theme.spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: theme.colors.primary },
  tabLabel: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },
  tabLabelActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.semibold },
  tabContent: { padding: theme.spacing[4] },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  serviceCategory: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  serviceRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  servicePrice: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary },
  noContent: { paddingVertical: theme.spacing[8], alignItems: 'center' },
  noContentText: { color: theme.colors.textTertiary, fontSize: theme.typography.fontSize.sm },
  reviewCard: { marginBottom: theme.spacing[4], paddingBottom: theme.spacing[4], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  reviewHeader: { flexDirection: 'row', gap: theme.spacing[2], marginBottom: theme.spacing[2] },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewComment: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },
  replyBox: { backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.lg, padding: theme.spacing[3], marginTop: theme.spacing[2] },
  replyLabel: { fontSize: 11, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textTertiary, marginBottom: 4 },
  replyText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  availSlot: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  availDay: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textPrimary },
  availTime: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  footer: { borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.white },
  footerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3] },
  fromLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary },
  fromPrice: { fontSize: theme.typography.fontSize.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  hireBtn: { flex: 1, marginLeft: theme.spacing[4] },
});
