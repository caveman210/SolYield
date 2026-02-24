// Material 3 Expressive Design System Constants
// Material You palette with Expressive motion physics

// ============================================
// M3 EXPRESSIVE MOTION PHYSICS
// ============================================

export const M3Motion = {
  // Duration tokens (in milliseconds)
  duration: {
    instant: 0,
    fastest: 50,
    fast: 100,
    normal: 200,
    medium: 300,
    slow: 400,
    expressive: 500,
    emphasized: 600,
  },

  // Easing curves - Material 3 Expressive
  easing: {
    // Standard easing (for utility/motion)
    standard: [0.2, 0, 0, 1],
    standardAccelerate: [0.3, 0, 1, 1],
    standardDecelerate: [0, 0, 0.2, 1],

    // Emphasized easing (expressive, playful - M3 signature)
    emphasized: [0.3, 0, 0.8, 0.15],
    emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
    emphasizedDecelerate: [0.05, 0.7, 0.1, 1],

    // Legacy Material easing
    linear: [0, 0, 1, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
  },

  // Spring physics for expressive animations (M3 Motion)
  spring: {
    // Quick, snappy spring - minimal overshoot for immediate feedback
    quick: {
      damping: 1,
      stiffness: 450,
      mass: 1,
      overshootClamping: true,
    },
    // Gentle spring - soft, natural feel for subtle interactions
    gentle: {
      damping: 0.9,
      stiffness: 180,
      mass: 1,
      overshootClamping: false,
    },
    // Bouncy, playful spring - expressive, fun feedback
    bouncy: {
      damping: 0.6,
      stiffness: 280,
      mass: 1,
      overshootClamping: false,
    },
    // Smooth, elegant spring - sophisticated motion
    smooth: {
      damping: 0.85,
      stiffness: 160,
      mass: 1,
      overshootClamping: false,
    },
    // Expressive entrance - standard M3 enter motion
    enter: {
      damping: 0.8,
      stiffness: 320,
      mass: 1,
      overshootClamping: false,
    },
    // Expressive exit - quick, clean exit with no bounce
    exit: {
      damping: 1,
      stiffness: 400,
      mass: 1,
      overshootClamping: true,
    },
  },

  // Path morphing for container transforms - Expressive
  path: {
    emphasized: {
      duration: 350,
      easing: [0.3, 0, 0.8, 0.15],
    },
  },

  // Stagger delays for list animations
  stagger: {
    fast: 20,
    normal: 50,
    slow: 80,
    expressive: 100,
  },
} as const;

// ============================================
// M3 TYPOGRAPHY SCALE
// ============================================

export const M3Typography = {
  // Display styles
  display: {
    large: {
      fontSize: 57,
      lineHeight: 64,
      letterSpacing: -0.25,
      fontWeight: '400',
    },
    medium: {
      fontSize: 45,
      lineHeight: 52,
      letterSpacing: 0,
      fontWeight: '400',
    },
    small: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: 0,
      fontWeight: '400',
    },
  },

  // Headline styles
  headline: {
    large: {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: 0,
      fontWeight: '400',
    },
    medium: {
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: 0,
      fontWeight: '400',
    },
    small: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
      fontWeight: '400',
    },
  },

  // Title styles
  title: {
    large: {
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0,
      fontWeight: '400',
    },
    medium: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
      fontWeight: '500',
    },
    small: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontWeight: '500',
    },
  },

  // Body styles
  body: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
      fontWeight: '400',
    },
    medium: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    small: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontWeight: '400',
    },
  },

  // Label styles
  label: {
    large: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontWeight: '500',
    },
    medium: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
      fontWeight: '500',
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
      fontWeight: '500',
    },
  },
} as const;

// ============================================
// M3 SHAPE SYSTEM (Corner Radius)
// ============================================

export const M3Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 20,
  extraExtraLarge: 24,
  extraExtraExtraLarge: 28,
  full: 9999, // For circles/pills
} as const;

// ============================================
// M3 ELEVATION SYSTEM
// ============================================

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
} as const;

// ============================================
// M3 SPACING SYSTEM
// ============================================

export const M3Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

// ============================================
// M3 STATE LAYERS (Ripple/Press opacity)
// ============================================

export const M3State = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
  disabled: 0.38,
} as const;

// ============================================
// EXPRESSIVE CONTAINER TRANSFORM (M3 Motion)
// ============================================

export const M3ContainerTransform = {
  // Fade through (FAB -> Dialog) - Expressive
  fadeThrough: {
    duration: 300,
    easing: [0.3, 0, 0.8, 0.15],
  },
  // Fade - Quick, utility
  fade: {
    duration: 150,
    easing: [0.4, 0, 1, 1],
  },
  // Scale - Emphasized entrance
  scale: {
    duration: 300,
    easing: [0.3, 0, 0.8, 0.15],
    scale: {
      from: 0.8,
      to: 1,
    },
  },
  // Shared axis - Expressive navigation
  sharedAxis: {
    duration: 300,
    easing: [0.3, 0, 0.8, 0.15],
  },
} as const;

// ============================================
// MATERIAL YOU DYNAMIC COLOR UTILITIES
// Based on Android's Material You dynamic color system
// ============================================

type HCT = { h: number; c: number; t: number };

function hctToHex(hct: HCT): string {
  const { h, c, t } = hct;
  const rgb = hctToRGB(h, c, t);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hctToRGB(h: number, c: number, t: number): { r: number; g: number; b: number } {
  const cScaled = (c / 100) * (t < 50 ? t : 100 - t) / 100;
  const x = cScaled * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = t / 100 - (cScaled / 2);

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = cScaled; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = cScaled; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = cScaled; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = cScaled; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = cScaled; }
  else { r = cScaled; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHCT(r: number, g: number, b: number): HCT {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) h = 60 * (((gNorm - bNorm) / delta) % 6);
    else if (max === gNorm) h = 60 * ((bNorm - rNorm) / delta + 2);
    else h = 60 * ((rNorm - gNorm) / delta + 4);
  }
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const c = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1)) * 100;
  const t = l + (c / 2) * (1 - Math.abs(2 * l - 1));

  return { h: Math.round(h), c: Math.round(c), t: Math.round(t * 100) };
}

function getTonalPalette(hex: number, tone: number): string {
  const rgb = hexToRGB(hex.toString(16).padStart(6, '0'));
  const hct = rgbToHCT(rgb.r, rgb.g, rgb.b);
  const adjusted = { ...hct, t: tone };
  return hctToHex(adjusted);
}

export interface MaterialYouScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export function generateMaterialYouScheme(sourceColor: string): MaterialYouScheme {
  const hex = parseInt(sourceColor.replace('#', ''), 16);

  return {
    primary: getTonalPalette(hex, 40),
    onPrimary: getTonalPalette(hex, 100),
    primaryContainer: getTonalPalette(hex, 90),
    onPrimaryContainer: getTonalPalette(hex, 10),
    secondary: getTonalPalette(hex, 40),
    onSecondary: getTonalPalette(hex, 100),
    secondaryContainer: getTonalPalette(hex, 90),
    onSecondaryContainer: getTonalPalette(hex, 10),
    tertiary: getTonalPalette(hex, 40),
    onTertiary: getTonalPalette(hex, 100),
    tertiaryContainer: getTonalPalette(hex, 90),
    onTertiaryContainer: getTonalPalette(hex, 10),
    error: getTonalPalette(0xBA1A1A, 40),
    onError: '#FFFFFF',
    errorContainer: getTonalPalette(0xBA1A1A, 90),
    onErrorContainer: getTonalPalette(0xBA1A1A, 10),
    background: getTonalPalette(0xF5FBF5, 98),
    onBackground: getTonalPalette(0xF5FBF5, 10),
    surface: getTonalPalette(0xF5FBF5, 98),
    onSurface: getTonalPalette(0xF5FBF5, 10),
    surfaceVariant: getTonalPalette(0xDBE5DE, 90),
    onSurfaceVariant: getTonalPalette(0xDBE5DE, 30),
    outline: getTonalPalette(0x707973, 50),
    outlineVariant: getTonalPalette(0xBFC9C2, 80),
    inverseSurface: getTonalPalette(0x2C322E, 90),
    inverseOnSurface: getTonalPalette(0x2C322E, 20),
    inversePrimary: getTonalPalette(hex, 80),
  };
}
