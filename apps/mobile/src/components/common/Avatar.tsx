import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { initials } from '../../utils/format';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  verified?: boolean;
  available?: boolean;
  style?: ViewStyle;
}

export function Avatar({ uri, name = '', size = 48, verified, available, style }: Props) {
  const fontSize = size * 0.38;
  const dotSize = size * 0.28;

  return (
    <View style={[styles.wrapper, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials(name)}</Text>
        </View>
      )}

      {available !== undefined && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              bottom: 1,
              right: 1,
              backgroundColor: available ? theme.colors.success : theme.colors.textTertiary,
            },
          ]}
        />
      )}

      {verified && (
        <View style={[styles.verifiedBadge, { bottom: -2, right: -2 }]}>
          <Text style={styles.verifiedIcon}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', alignSelf: 'flex-start' },
  image: { backgroundColor: theme.colors.backgroundSecondary },
  placeholder: {
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  dot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  verifiedIcon: { color: theme.colors.white, fontSize: 9, fontFamily: theme.typography.fontFamily.bold },
});
