import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Preencha todos os campos');
    setLoading(true);
    try {
      const { data } = await api.post('/v1/auth/register', {
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        profile: { displayName: form.name },
      });
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao cadastrar';
      Alert.alert('Erro', Array.isArray(message) ? message.join('\n') : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Criar conta</Text>

        {[
          { key: 'name', placeholder: 'Seu nome completo', keyboard: 'default' },
          { key: 'email', placeholder: 'Email', keyboard: 'email-address' },
          { key: 'phone', placeholder: 'Celular (opcional)', keyboard: 'phone-pad' },
          { key: 'password', placeholder: 'Senha (mín. 8 caracteres)', keyboard: 'default', secure: true },
        ].map(({ key, placeholder, keyboard, secure }) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={placeholder}
            value={form[key as keyof typeof form]}
            onChangeText={update(key as keyof typeof form)}
            keyboardType={keyboard as never}
            secureTextEntry={secure}
            autoCapitalize={key === 'name' ? 'words' : 'none'}
          />
        ))}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Criar conta</Text>}
        </TouchableOpacity>

        <Text style={styles.terms}>
          Ao continuar, você concorda com os{' '}
          <Text style={styles.link}>Termos de Uso</Text> e{' '}
          <Text style={styles.link}>Política de Privacidade</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inner: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  back: { paddingVertical: 8, marginBottom: 16 },
  backText: { color: '#1B4FFF', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 24 },
  input: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  button: { backgroundColor: '#1B4FFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  link: { color: '#1B4FFF' },
});
