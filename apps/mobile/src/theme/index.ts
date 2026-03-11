/**
 * SERVIX Design System
 * Tokens, Colors, Typography, Spacing
 */

export const Colors = {
  // Brand
  primary: '#6C47FF',      // Purple - main brand
  primaryDark: '#4F35CC',
  primaryLight: '#9D7FFF',
  primarySurface: '#F0ECFF',

  // Secondary
  secondary: '#FF6B47',    // Orange - CTAs, highlights
  secondaryDark: '#CC4F35',
  secondaryLight: '#FF9D83',

  // Trust indicators
  verified: '#22C55E',     // Green - verified badge
  premium: '#F59E0B',      // Gold - premium
  sponsored: '#3B82F6',    // Blue - sponsored

  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Background
  background: '#FFFFFF',
  backgroundDark: '#F9FAFB',
  card: '#FFFFFF',
  cardDark: '#F3F4F6',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textDisabled: '#D1D5DB',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#6C47FF',

  // Booking status colors
  statusPending: '#F59E0B',
  statusActive: '#6C47FF',
  statusCompleted: '#22C55E',
  statusCancelled: '#EF4444',
  statusInProgress: '#3B82F6',

  // Transparent
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
} as const;

export const Typography = {
  // Font family
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    extraBold: 'Inter-ExtraBold',
  },

  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  card: {
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const ZIndex = {
  base: 0,
  card: 1,
  header: 10,
  modal: 20,
  toast: 30,
  overlay: 40,
  maximum: 99,
} as const;

// Component-level design tokens
export const ComponentTokens = {
  button: {
    height: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    paddingHorizontal: {
      sm: 16,
      md: 24,
      lg: 32,
    },
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  avatar: {
    sm: 32,
    md: 44,
    lg: 60,
    xl: 80,
  },
  bottomTab: {
    height: 64,
    iconSize: 24,
  },
  hitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  minTouchTarget: 44, // WCAG minimum
} as const;

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  zIndex: ZIndex,
  components: ComponentTokens,
};

export type Theme = typeof theme;
