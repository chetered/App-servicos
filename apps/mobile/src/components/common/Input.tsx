import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  isPassword,
  style,
  ...rest
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.row, error ? styles.rowError : null, rest.editable === false && styles.rowDisabled]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconRight}>
            {showPassword
              ? <EyeOff size={18} color={theme.colors.textSecondary} />
              : <Eye size={18} color={theme.colors.textSecondary} />}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing[4] },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    minHeight: 52,
  },
  rowError: { borderColor: theme.colors.error },
  rowDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputWithLeft: { paddingLeft: 0 },
  iconLeft: { paddingLeft: theme.spacing[3] },
  iconRight: { paddingRight: theme.spacing[3] },
  error: { fontSize: theme.typography.fontSize.xs, color: theme.colors.error, marginTop: 4 },
  hint: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textTertiary, marginTop: 4 },
});
