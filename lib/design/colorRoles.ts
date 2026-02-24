/**
 * Material You Hexa-Tone Color Roles
 *
 * This system defines semantic color roles for the entire app based on Material You dynamic colors.
 * The hexa-tone system uses 6 primary color surfaces:
 *
 * 1. **Background** - Main app background (from wallpaper)
 * 2. **Surface Containers** - Layered surfaces for cards, sections
 * 3. **Primary Accent** - Main interactive elements (buttons, active states)
 * 4. **Secondary Accent** - Supporting interactive elements
 * 5. **Tertiary Accent** - Additional accent for variety
 * 6. **Text/Icons** - Adaptive text colors based on surface luminance
 */

import { MaterialYouColors } from '../hooks/useMaterialYou';

export interface SemanticColorRoles {
  // ===== BACKGROUND LAYER =====
  // The base layer of the app - dynamically sourced from device wallpaper
  appBackground: string;
  appOnBackground: string;

  // ===== SURFACE LAYERS (5 elevation levels) =====
  // Progressive elevation for layered UI elements
  surfaceLowest: string; // Cards at rest
  surfaceLow: string; // Slightly elevated cards
  surfaceBase: string; // Default surface
  surfaceHigh: string; // Elevated surfaces (modals, dialogs)
  surfaceHighest: string; // Top-most surfaces (tooltips, menus)

  // Text colors for surfaces
  onSurfaceLowest: string;
  onSurfaceLow: string;
  onSurfaceBase: string;
  onSurfaceHigh: string;
  onSurfaceHighest: string;

  // Surface variants for subtle differentiation
  surfaceVariant: string;
  onSurfaceVariant: string;

  // ===== INTERACTIVE ELEMENTS =====
  // Primary buttons, FABs, active states
  buttonPrimary: string;
  buttonOnPrimary: string;
  buttonPrimaryContainer: string;
  buttonOnPrimaryContainer: string;

  // Secondary buttons, toggles
  buttonSecondary: string;
  buttonOnSecondary: string;
  buttonSecondaryContainer: string;
  buttonOnSecondaryContainer: string;

  // Tertiary buttons, chips
  buttonTertiary: string;
  buttonOnTertiary: string;
  buttonTertiaryContainer: string;
  buttonOnTertiaryContainer: string;

  // ===== TEXT & ICONS =====
  // Adaptive text colors with emphasis levels
  textPrimary: string; // High emphasis (87% opacity equivalent)
  textSecondary: string; // Medium emphasis (60% opacity equivalent)
  textTertiary: string; // Disabled/hint text (38% opacity equivalent)

  iconPrimary: string; // Primary icons
  iconSecondary: string; // Secondary icons
  iconTertiary: string; // Tertiary/disabled icons

  // ===== BORDERS & DIVIDERS =====
  outline: string; // Default borders
  outlineVariant: string; // Subtle dividers

  // ===== STATES & FEEDBACK =====
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  success: string; // Custom success color
  onSuccess: string;

  warning: string; // Custom warning color
  onWarning: string;

  // ===== SHADOWS & OVERLAYS =====
  shadow: string;
  scrim: string; // Modal overlay

  // ===== INVERSE COLORS =====
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // ===== DIRECT MATERIAL YOU COLOR ACCESS =====
  // For backward compatibility and direct access to base colors
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
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
  surfaceContainer: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceDim: string;
  surfaceBright: string;
}

/**
 * Generates semantic color roles from Material You dynamic colors
 */
export function generateSemanticRoles(colors: MaterialYouColors): SemanticColorRoles {
  return {
    // Background from wallpaper
    appBackground: colors.background,
    appOnBackground: colors.onBackground,

    // Surface elevation hierarchy
    surfaceLowest: colors.surfaceContainerLowest,
    surfaceLow: colors.surfaceContainerLow,
    surfaceBase: colors.surfaceContainer,
    surfaceHigh: colors.surfaceContainerHigh,
    surfaceHighest: colors.surfaceContainerHighest,

    onSurfaceLowest: colors.onSurface,
    onSurfaceLow: colors.onSurface,
    onSurfaceBase: colors.onSurface,
    onSurfaceHigh: colors.onSurface,
    onSurfaceHighest: colors.onSurface,

    surfaceVariant: colors.surfaceVariant,
    onSurfaceVariant: colors.onSurfaceVariant,

    // Interactive buttons
    buttonPrimary: colors.primary,
    buttonOnPrimary: colors.onPrimary,
    buttonPrimaryContainer: colors.primaryContainer,
    buttonOnPrimaryContainer: colors.onPrimaryContainer,

    buttonSecondary: colors.secondary,
    buttonOnSecondary: colors.onSecondary,
    buttonSecondaryContainer: colors.secondaryContainer,
    buttonOnSecondaryContainer: colors.onSecondaryContainer,

    buttonTertiary: colors.tertiary,
    buttonOnTertiary: colors.onTertiary,
    buttonTertiaryContainer: colors.tertiaryContainer,
    buttonOnTertiaryContainer: colors.onTertiaryContainer,

    // Text hierarchy
    textPrimary: colors.onSurface,
    textSecondary: colors.onSurfaceVariant,
    textTertiary: colors.outline,

    // Icons
    iconPrimary: colors.onSurface,
    iconSecondary: colors.onSurfaceVariant,
    iconTertiary: colors.outline,

    // Borders
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,

    // States
    error: colors.error,
    onError: colors.onError,
    errorContainer: colors.errorContainer,
    onErrorContainer: colors.onErrorContainer,

    // Custom success (derived from tertiary)
    success: colors.tertiary,
    onSuccess: colors.onTertiary,

    // Custom warning (derived from secondary)
    warning: colors.secondary,
    onWarning: colors.onSecondary,

    // Shadows
    shadow: colors.shadow,
    scrim: colors.scrim,

    // Inverse
    inverseSurface: colors.inverseSurface,
    inverseOnSurface: colors.inverseOnSurface,
    inversePrimary: colors.inversePrimary,

    // Direct access to Material You colors for backward compatibility
    background: colors.background,
    onBackground: colors.onBackground,
    surface: colors.surface,
    onSurface: colors.onSurface,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.primaryContainer,
    onPrimaryContainer: colors.onPrimaryContainer,
    secondary: colors.secondary,
    onSecondary: colors.onSecondary,
    secondaryContainer: colors.secondaryContainer,
    onSecondaryContainer: colors.onSecondaryContainer,
    tertiary: colors.tertiary,
    onTertiary: colors.onTertiary,
    tertiaryContainer: colors.tertiaryContainer,
    onTertiaryContainer: colors.onTertiaryContainer,
    surfaceContainer: colors.surfaceContainer,
    surfaceContainerLowest: colors.surfaceContainerLowest,
    surfaceContainerLow: colors.surfaceContainerLow,
    surfaceContainerHigh: colors.surfaceContainerHigh,
    surfaceContainerHighest: colors.surfaceContainerHighest,
    surfaceDim: colors.surfaceDim,
    surfaceBright: colors.surfaceBright,
  };
}

/**
 * Hook to get semantic color roles
 */
import { useMaterialYouColors } from '../hooks/MaterialYouProvider';

export function useSemanticColors(): SemanticColorRoles {
  const colors = useMaterialYouColors();
  const semanticColors = generateSemanticRoles(colors);

  // Debug logging
  if (__DEV__) {
    console.log('🎨 Semantic Colors Generated:', {
      appBackground: semanticColors.appBackground,
      primaryContainer: semanticColors.primaryContainer,
      secondaryContainer: semanticColors.secondaryContainer,
      tertiaryContainer: semanticColors.tertiaryContainer,
    });
  }

  return semanticColors;
}
