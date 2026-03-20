import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/lib/api';

export default function OtpScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) return Alert.alert('Digite seu celular');
    setLoading(true);
    try {
      await api.post('/v1/auth/otp/send', { recipient: phone, channel: 'sms' });
      setStep('code');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o código');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code) return Alert.alert('Digite o código');
    setLoading(true);
    try {
      const { data } = await api.post('/v1/auth/otp/verify', { recipient: phone, code });
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Código inválido', 'Verifique o código e tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {step === 'phone' ? 'Digite seu celular' : 'Digite o código'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Enviaremos um código por SMS ou WhatsApp'
            : `Código enviado para ${phone}`}
        </Text>

        {step === 'phone' ? (
          <TextInput
            style={styles.input}
            placeholder="+55 (11) 99999-9999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        ) : (
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={step === 'phone' ? sendOtp : verifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{step === 'phone' ? 'Enviar Código' : 'Verificar'}</Text>
          )}
        </TouchableOpacity>

        {step === 'code' && (
          <TouchableOpacity onPress={() => { setStep('phone'); setCode(''); }}>
            <Text style={styles.resendText}>Reenviar código</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  back: { paddingVertical: 8, marginBottom: 24 },
  backText: { color: '#1B4FFF', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 32 },
  input: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  codeInput: { fontSize: 28, textAlign: 'center', letterSpacing: 8, fontWeight: '700' },
  button: { backgroundColor: '#1B4FFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  resendText: { textAlign: 'center', color: '#1B4FFF', fontSize: 14, marginTop: 16, fontWeight: '600' },
});
