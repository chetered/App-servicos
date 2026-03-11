import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && <Text style={styles.msg}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white },
  msg: { marginTop: theme.spacing[3], fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },
});
