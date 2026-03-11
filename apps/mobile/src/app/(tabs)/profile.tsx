import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User, Star, ClipboardList, CreditCard, MapPin,
  HelpCircle, ChevronRight, LogOut, Shield, Bell,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/common/Avatar';
import { theme } from '../../theme';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  isDestructive?: boolean;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, label, value, onPress, isDestructive, rightElement }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, isDestructive && styles.menuIconDestructive]}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, isDestructive && styles.menuLabelDestructive]}>{label}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {rightElement ?? <ChevronRight size={16} color={theme.colors.textTertiary} />}
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* User Card */}
        <TouchableOpacity style={styles.userCard} activeOpacity={0.8}>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.fullName ?? ''}
            size={64}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName ?? 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? user?.phone}</Text>
            {!user?.isEmailVerified && (
              <View style={styles.verifyBanner}>
                <Text style={styles.verifyText}>⚠ Verifique seu e-mail</Text>
              </View>
            )}
          </View>
          <ChevronRight size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Sections */}
        <MenuSection title="Conta">
          <MenuItem
            icon={<User size={18} color={theme.colors.primary} />}
            label="Dados pessoais"
            onPress={() => {}}
          />
          <MenuItem
            icon={<MapPin size={18} color={theme.colors.primary} />}
            label="Meus endereços"
            onPress={() => {}}
          />
          <MenuItem
            icon={<CreditCard size={18} color={theme.colors.primary} />}
            label="Formas de pagamento"
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection title="Atividade">
          <MenuItem
            icon={<ClipboardList size={18} color={theme.colors.secondary} />}
            label="Histórico de pedidos"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <MenuItem
            icon={<Star size={18} color={theme.colors.secondary} />}
            label="Minhas avaliações"
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection title="Preferências">
          <MenuItem
            icon={<Bell size={18} color={theme.colors.textSecondary} />}
            label="Notificações"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Shield size={18} color={theme.colors.textSecondary} />}
            label="Privacidade e segurança"
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection title="Suporte">
          <MenuItem
            icon={<HelpCircle size={18} color={theme.colors.textSecondary} />}
            label="Central de ajuda"
            onPress={() => {}}
          />
          <MenuItem
            icon={<HelpCircle size={18} color={theme.colors.textSecondary} />}
            label="Termos de uso"
            onPress={() => {}}
          />
        </MenuSection>

        {/* Become provider CTA */}
        {!user?.roles?.includes('PROVIDER') && (
          <TouchableOpacity style={styles.providerCta} activeOpacity={0.85}>
            <Text style={styles.providerCtaTitle}>Trabalhe conosco 💼</Text>
            <Text style={styles.providerCtaText}>Cadastre-se como profissional e comece a receber pedidos</Text>
            <View style={styles.providerCtaBtn}>
              <Text style={styles.providerCtaBtnText}>Quero ser profissional</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <MenuItem
              icon={<LogOut size={18} color={theme.colors.error} />}
              label="Sair da conta"
              onPress={handleLogout}
              isDestructive
              rightElement={<View />}
            />
          </View>
        </View>

        <Text style={styles.version}>SERVIX v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
  header: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[2], paddingBottom: theme.spacing[3] },
  title: { fontSize: theme.typography.fontSize['2xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], backgroundColor: theme.colors.white, marginHorizontal: theme.spacing[4], borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], marginBottom: theme.spacing[4] },
  userInfo: { flex: 1 },
  userName: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  userEmail: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  verifyBanner: { marginTop: 4, backgroundColor: '#FEF3C7', borderRadius: theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  verifyText: { fontSize: 11, color: '#92400E', fontFamily: theme.typography.fontFamily.medium },
  section: { marginBottom: theme.spacing[4] },
  sectionTitle: { fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: theme.spacing[4], marginBottom: theme.spacing[2] },
  sectionCard: { backgroundColor: theme.colors.white, marginHorizontal: theme.spacing[4], borderRadius: theme.borderRadius.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], gap: theme.spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: theme.borderRadius.lg, backgroundColor: `${theme.colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  menuIconDestructive: { backgroundColor: `${theme.colors.error}10` },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary },
  menuLabelDestructive: { color: theme.colors.error },
  menuValue: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginTop: 1 },
  providerCta: { marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[4], backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xl, padding: theme.spacing[5] },
  providerCtaTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.white, marginBottom: 4 },
  providerCtaText: { fontSize: theme.typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: theme.spacing[4], lineHeight: 20 },
  providerCtaBtn: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.full, paddingVertical: 10, paddingHorizontal: theme.spacing[5], alignSelf: 'flex-start' },
  providerCtaBtnText: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.fontSize.sm },
  version: { textAlign: 'center', fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary, paddingVertical: theme.spacing[6] },
});
