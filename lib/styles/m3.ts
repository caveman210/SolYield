// Material 3 Expressive Design System - StyleSheet Constants

export const M3Colors = {
  // Primary
  primary: '#006C4C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#68FBBF',
  onPrimaryContainer: '#002114',

  // Secondary
  secondary: '#4D6357',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CFE9D9',
  onSecondaryContainer: '#092016',

  // Tertiary
  tertiary: '#3D6373',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#C1E9FB',
  onTertiaryContainer: '#001F29',

  // Error
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Surface
  surface: '#F5FBF5',
  onSurface: '#171D1A',
  surfaceVariant: '#DBE5DE',
  onSurfaceVariant: '#404943',
  surfaceDim: '#D5DBD6',
  surfaceBright: '#FAFDF9',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F0F6F1',
  surfaceContainer: '#E9F0EB',
  surfaceContainerHigh: '#E3EAE5',
  surfaceContainerHighest: '#DEE4DF',

  // Outline
  outline: '#707973',
  outlineVariant: '#BFC9C2',

  // Inverse
  inverseSurface: '#2C322E',
  inverseOnSurface: '#EEF1ED',
  inversePrimary: '#46DAA4',

  // Shadow
  shadow: '#000000',
  scrim: '#000000',

  // Expressive
  expressiveYellow: '#F4BF00',
  expressiveOrange: '#FF6B35',
  expressiveBlue: '#004E89',
  expressivePurple: '#6B2D5C',
};

export const M3Elevation = {
  level0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  level5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
};

export const M3Typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};

export const M3Shape = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 9999,
};
