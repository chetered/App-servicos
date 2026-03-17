import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  { id: '1', name: 'Limpeza', icon: '🧹', color: '#DBEAFE' },
  { id: '2', name: 'Elétrica', icon: '⚡', color: '#FEF9C3' },
  { id: '3', name: 'Reformas', icon: '🔨', color: '#FCE7F3' },
  { id: '4', name: 'Hidráulica', icon: '🔧', color: '#D1FAE5' },
  { id: '5', name: 'Pintura', icon: '🎨', color: '#EDE9FE' },
  { id: '6', name: 'Jardinagem', icon: '🌱', color: '#DCFCE7' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, bem-vindo!</Text>
            <Text style={styles.subtitle}>O que você precisa hoje?</Text>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.searchPlaceholder}>Buscar serviços...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categorias</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: cat.color }]}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { categoryId: cat.id } })}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Bookings Placeholder */}
        <Text style={styles.sectionTitle}>Seus agendamentos</Text>
        <TouchableOpacity
          style={styles.emptyState}
          onPress={() => router.push('/(tabs)/bookings')}
        >
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>Nenhum agendamento recente</Text>
          <Text style={styles.emptyAction}>Agendar um serviço →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  searchBar: { marginHorizontal: 20, marginVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  searchPlaceholder: { color: '#9CA3AF', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  categoryCard: { width: '30%', marginHorizontal: '1.5%', marginBottom: 12, borderRadius: 12, padding: 14, alignItems: 'center' },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  emptyState: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', marginBottom: 4 },
  emptyAction: { fontSize: 14, color: '#1B4FFF', fontWeight: '600' },
});
