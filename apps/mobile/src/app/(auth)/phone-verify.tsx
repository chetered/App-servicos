import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { showMessage } from 'react-native-flash-message';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { theme } from '../../theme';

const CODE_LENGTH = 6;

export default function PhoneVerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length !== CODE_LENGTH) {
      showMessage({ message: 'Digite o código completo', type: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.verifyOtp({ phone: phone!, otp });
      router.replace('/(tabs)/home');
    } catch {
      showMessage({ message: 'Código inválido ou expirado', type: 'danger' });
      setCode(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.auth.requestOtp({ phone: phone! });
      setResendSeconds(60);
      setCode(Array(CODE_LENGTH).fill(''));
      showMessage({ message: 'Novo código enviado!', type: 'success' });
    } catch {
      showMessage({ message: 'Erro ao reenviar. Tente novamente.', type: 'danger' });
    }
  };

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ChevronLeft size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verificar telefone</Text>
        <Text style={styles.subtitle}>
          Enviamos um código de 6 dígitos para{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.codeRow}>
          {Array(CODE_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { if (ref) inputs.current[i] = ref; }}
              style={[styles.codeInput, code[i] ? styles.codeInputFilled : null]}
              value={code[i]}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          label="Verificar"
          onPress={handleVerify}
          isLoading={isLoading}
          fullWidth
          style={styles.btn}
        />

        {resendSeconds > 0 ? (
          <Text style={styles.resendText}>Reenviar em {resendSeconds}s</Text>
        ) : (
          <Pressable onPress={handleResend}>
            <Text style={styles.resendLink}>Reenviar código</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.white, padding: theme.spacing[6] },
  back: { marginBottom: theme.spacing[8] },
  content: { flex: 1 },
  title: { fontSize: theme.typography.fontSize['2xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
  subtitle: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: theme.spacing[8] },
  phone: { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.semibold },
  codeRow: { flexDirection: 'row', gap: theme.spacing[3], justifyContent: 'center', marginBottom: theme.spacing[8] },
  codeInput: { width: 48, height: 56, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, textAlign: 'center', fontSize: theme.typography.fontSize['2xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary, backgroundColor: theme.colors.backgroundSecondary },
  codeInputFilled: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}08` },
  btn: { marginBottom: theme.spacing[4] },
  resendText: { textAlign: 'center', color: theme.colors.textTertiary, fontSize: theme.typography.fontSize.sm },
  resendLink: { textAlign: 'center', color: theme.colors.primary, fontFamily: theme.typography.fontFamily.semibold, fontSize: theme.typography.fontSize.sm },
});
