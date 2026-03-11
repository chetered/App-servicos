import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { showMessage } from 'react-native-flash-message';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/common/Button';
import { theme } from '../../theme';

const schema = z.object({
  fullName: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'As senhas não coincidem',
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { register: registerUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await registerUser({ fullName: data.fullName, email: data.email, password: data.password });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      showMessage({
        message: err?.response?.data?.message ?? 'Erro ao criar conta. Tente novamente.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Junte-se a mais de 50 mil usuários SERVIX</Text>
        </View>

        {/* Full Name */}
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Seu nome completo"
                placeholderTextColor={theme.colors.textTertiary}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
              />
              {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}
            </View>
          )}
        />

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="seu@email.com"
                placeholderTextColor={theme.colors.textTertiary}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
            </View>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <View style={[styles.inputRow, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={theme.colors.textTertiary}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPass}
                  autoComplete="new-password"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  {showPass ? <EyeOff size={20} color={theme.colors.textSecondary} /> : <Eye size={20} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
            </View>
          )}
        />

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Confirmar senha</Text>
              <View style={[styles.inputRow, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Repita a senha"
                  placeholderTextColor={theme.colors.textTertiary}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  {showConfirm ? <EyeOff size={20} color={theme.colors.textSecondary} /> : <Eye size={20} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
            </View>
          )}
        />

        <Button
          label="Criar conta"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          fullWidth
          style={styles.submitBtn}
        />

        <Text style={styles.terms}>
          Ao criar uma conta você concorda com os{' '}
          <Text style={styles.link} onPress={() => {}}>Termos de Uso</Text>
          {' '}e a{' '}
          <Text style={styles.link} onPress={() => {}}>Política de Privacidade</Text>
        </Text>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.white },
  scroll: { flexGrow: 1, padding: theme.spacing[6] },
  back: { marginBottom: theme.spacing[4], alignSelf: 'flex-start' },
  header: { marginBottom: theme.spacing[8] },
  title: { fontSize: theme.typography.fontSize['3xl'], fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  field: { marginBottom: theme.spacing[4] },
  label: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: 6 },
  input: { height: 52, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing[4], fontSize: theme.typography.fontSize.base, color: theme.colors.textPrimary, backgroundColor: theme.colors.backgroundSecondary },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing[4], backgroundColor: theme.colors.backgroundSecondary },
  inputFlex: { flex: 1, fontSize: theme.typography.fontSize.base, color: theme.colors.textPrimary },
  inputError: { borderColor: theme.colors.error },
  eyeBtn: { padding: 4 },
  error: { fontSize: theme.typography.fontSize.xs, color: theme.colors.error, marginTop: 4 },
  submitBtn: { marginTop: theme.spacing[4] },
  terms: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing[4], lineHeight: 18 },
  link: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.medium },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing[6] },
  loginText: { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
  loginLink: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.semibold, fontSize: theme.typography.fontSize.sm },
});
