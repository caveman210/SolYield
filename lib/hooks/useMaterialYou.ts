import { useEffect, useState } from 'react';
import { Platform, Appearance } from 'react-native';
import MaterialYou from 'react-native-material-you-colors';

export interface MaterialYouColors {
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
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  isDark: boolean;
}

// Default M3 fallback palette (green energy theme) - LIGHT
const DEFAULT_LIGHT_PALETTE: MaterialYouColors = {
  primary: '#006C4C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#68FBBF',
  onPrimaryContainer: '#002115',
  secondary: '#4D6357',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CFE9D9',
  onSecondaryContainer: '#0A1F16',
  tertiary: '#3D6373',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#C1E8FB',
  onTertiaryContainer: '#001F29',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#F6FBF4',
  onBackground: '#171D1A',
  surface: '#F6FBF4',
  onSurface: '#171D1A',
  surfaceVariant: '#DBE5DD',
  onSurfaceVariant: '#404943',
  outline: '#707973',
  outlineVariant: '#BFC9C2',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2C322E',
  inverseOnSurface: '#EDF2EB',
  inversePrimary: '#4CDEA4',
  surfaceDim: '#D7DCD5',
  surfaceBright: '#F6FBF4',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F1F6EE',
  surfaceContainer: '#EBF0E9',
  surfaceContainerHigh: '#E5EBE3',
  surfaceContainerHighest: '#DFE5DD',
  isDark: false,
};

// Dark theme palette
const DEFAULT_DARK_PALETTE: MaterialYouColors = {
  primary: '#4CDEA4',
  onPrimary: '#00382A',
  primaryContainer: '#00513B',
  onPrimaryContainer: '#68FBBF',
  secondary: '#B3CCBD',
  onSecondary: '#1F352A',
  secondaryContainer: '#354B40',
  onSecondaryContainer: '#CFE9D9',
  tertiary: '#A5CCE0',
  onTertiary: '#073543',
  tertiaryContainer: '#254B5A',
  onTertiaryContainer: '#C1E8FB',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#0F1511',
  onBackground: '#DFE5DD',
  surface: '#0F1511',
  onSurface: '#DFE5DD',
  surfaceVariant: '#404943',
  onSurfaceVariant: '#BFC9C2',
  outline: '#89938C',
  outlineVariant: '#404943',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#DFE5DD',
  inverseOnSurface: '#2C322E',
  inversePrimary: '#006C4C',
  surfaceDim: '#0F1511',
  surfaceBright: '#353B37',
  surfaceContainerLowest: '#0A0F0C',
  surfaceContainerLow: '#171D1A',
  surfaceContainer: '#1B211E',
  surfaceContainerHigh: '#262C28',
  surfaceContainerHighest: '#303733',
  isDark: true,
};

/**
 * Material You Dynamic Color Hook
 *
 * Extracts dynamic colors from the user's wallpaper on Android 12+
 * Respects system light/dark mode
 * Falls back to default palette on iOS or older Android versions
 */
export function useMaterialYou(): MaterialYouColors {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(() => {
    const initial = Appearance.getColorScheme();
    return initial === 'dark' ? 'dark' : 'light';
  });
  const [colors, setColors] = useState<MaterialYouColors>(() => {
    const initialScheme = Appearance.getColorScheme();
    return initialScheme === 'dark' ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const extractDynamicColors = async () => {
      try {
        const androidVersion =
          Platform.OS === 'android'
            ? typeof Platform.Version === 'number'
              ? Platform.Version
              : parseInt(String(Platform.Version || '0'), 10)
            : 0;

        // Only available on Android 12+ (API 31+)
        if (Platform.OS !== 'android' || androidVersion < 31) {
          setColors(colorScheme === 'dark' ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE);
          setIsLoading(false);
          return;
        }

        console.log('🎨 Extracting Material You colors from wallpaper...');
        console.log('Platform:', Platform.OS, 'Version:', androidVersion);
        console.log('Color Scheme:', colorScheme);

        // Check if MaterialYou module is available
        if (!MaterialYou || !MaterialYou.getMaterialYouPalette) {
          console.log('⚠️ MaterialYou native module not available, using default');
          setColors(colorScheme === 'dark' ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE);
          setIsLoading(false);
          return;
        }

        // Get Material You colors from Android system wallpaper
        // Using 'auto' to extract colors directly from device wallpaper
        // VIBRANT creates more colorful, energetic palettes
        const palette = await MaterialYou.getMaterialYouPalette('auto', 'VIBRANT');
        console.log('✅ Material You palette received from wallpaper');

        if (palette && palette.system_accent1) {
          // Map Material You palette to M3 color system
          // Material You provides accent1, accent2, accent3, neutral1, neutral2
          // Each is an array with 13 shades (indices 0-12)
          // Indices: 0=tone0, 1=tone10, 2=tone20, 3=tone30, 4=tone40, 5=tone50,
          //          6=tone60, 7=tone70, 8=tone80, 9=tone90, 10=tone95, 11=tone99, 12=tone100
          const isDark = colorScheme === 'dark';

          // Helper function to safely access palette shades
          const getTone = (shades: string[], index: number, fallback: string): string => {
            return shades?.[index] || fallback;
          };

          // CRITICAL FIX: Material You library returns tones INVERTED!
          // What the library calls "tone0" is actually tone100, "tone100" is tone0, etc.
          // We need to REVERSE all index mappings
          const dynamicColors: MaterialYouColors = {
            // Primary colors from system_accent1
            // Standard M3: Dark uses tone80, Light uses tone40
            // Inverted: Dark uses index 4 (12-8), Light uses index 8 (12-4)
            primary: getTone(
              palette.system_accent1,
              isDark ? 4 : 8, // INVERTED: Dark: tone80→idx4, Light: tone40→idx8
              isDark ? DEFAULT_DARK_PALETTE.primary : DEFAULT_LIGHT_PALETTE.primary
            ),
            onPrimary: getTone(
              palette.system_accent1,
              isDark ? 10 : 0, // INVERTED: Dark: tone20→idx10, Light: tone100→idx0
              isDark ? DEFAULT_DARK_PALETTE.onPrimary : DEFAULT_LIGHT_PALETTE.onPrimary
            ),
            primaryContainer: getTone(
              palette.system_accent1,
              isDark ? 9 : 3, // INVERTED: Dark: tone30→idx9, Light: tone90→idx3
              isDark
                ? DEFAULT_DARK_PALETTE.primaryContainer
                : DEFAULT_LIGHT_PALETTE.primaryContainer
            ),
            onPrimaryContainer: getTone(
              palette.system_accent1,
              isDark ? 3 : 11, // INVERTED: Dark: tone90→idx3, Light: tone10→idx11
              isDark
                ? DEFAULT_DARK_PALETTE.onPrimaryContainer
                : DEFAULT_LIGHT_PALETTE.onPrimaryContainer
            ),

            // Secondary colors from system_accent2
            secondary: getTone(
              palette.system_accent2,
              isDark ? 4 : 8, // INVERTED
              isDark ? DEFAULT_DARK_PALETTE.secondary : DEFAULT_LIGHT_PALETTE.secondary
            ),
            onSecondary: getTone(
              palette.system_accent2,
              isDark ? 10 : 0, // INVERTED
              isDark ? DEFAULT_DARK_PALETTE.onSecondary : DEFAULT_LIGHT_PALETTE.onSecondary
            ),
            secondaryContainer: getTone(
              palette.system_accent2,
              isDark ? 9 : 3, // INVERTED
              isDark
                ? DEFAULT_DARK_PALETTE.secondaryContainer
                : DEFAULT_LIGHT_PALETTE.secondaryContainer
            ),
            onSecondaryContainer: getTone(
              palette.system_accent2,
              isDark ? 3 : 11, // INVERTED
              isDark
                ? DEFAULT_DARK_PALETTE.onSecondaryContainer
                : DEFAULT_LIGHT_PALETTE.onSecondaryContainer
            ),

            // Tertiary colors from system_accent3
            tertiary: getTone(
              palette.system_accent3,
              isDark ? 4 : 8, // INVERTED
              isDark ? DEFAULT_DARK_PALETTE.tertiary : DEFAULT_LIGHT_PALETTE.tertiary
            ),
            onTertiary: getTone(
              palette.system_accent3,
              isDark ? 10 : 0, // INVERTED
              isDark ? DEFAULT_DARK_PALETTE.onTertiary : DEFAULT_LIGHT_PALETTE.onTertiary
            ),
            tertiaryContainer: getTone(
              palette.system_accent3,
              isDark ? 9 : 3, // INVERTED
              isDark
                ? DEFAULT_DARK_PALETTE.tertiaryContainer
                : DEFAULT_LIGHT_PALETTE.tertiaryContainer
            ),
            onTertiaryContainer: getTone(
              palette.system_accent3,
              isDark ? 3 : 11, // INVERTED
              isDark
                ? DEFAULT_DARK_PALETTE.onTertiaryContainer
                : DEFAULT_LIGHT_PALETTE.onTertiaryContainer
            ),

            // Error colors (fixed)
            error: isDark ? '#FFB4AB' : '#BA1A1A',
            onError: isDark ? '#690005' : '#FFFFFF',
            errorContainer: isDark ? '#93000A' : '#FFDAD6',
            onErrorContainer: isDark ? '#FFDAD6' : '#410002',

            // CRITICAL FIX: The Material You library returns tones in REVERSE order!
            // tone10 is actually tone99, tone99 is actually tone10
            // Light Mode: Background should be tone99 (light) = index 1
            // Dark Mode: Background should be tone10 (dark) = index 11
            background: getTone(
              palette.system_neutral1,
              isDark ? 11 : 1, // SWAPPED: Dark: tone99, Light: tone10
              isDark ? DEFAULT_DARK_PALETTE.background : DEFAULT_LIGHT_PALETTE.background
            ),
            onBackground: getTone(
              palette.system_neutral1,
              isDark ? 1 : 11, // SWAPPED: Dark: tone10, Light: tone99
              isDark ? DEFAULT_DARK_PALETTE.onBackground : DEFAULT_LIGHT_PALETTE.onBackground
            ),
            surface: getTone(
              palette.system_neutral1,
              isDark ? 11 : 1, // SWAPPED: Dark: tone99, Light: tone10
              isDark ? DEFAULT_DARK_PALETTE.surface : DEFAULT_LIGHT_PALETTE.surface
            ),
            onSurface: getTone(
              palette.system_neutral1,
              isDark ? 1 : 11, // SWAPPED: Dark: tone10, Light: tone99
              isDark ? DEFAULT_DARK_PALETTE.onSurface : DEFAULT_LIGHT_PALETTE.onSurface
            ),
            surfaceVariant: getTone(
              palette.system_neutral2,
              isDark ? 9 : 3, // INVERTED: Dark: tone30→idx9, Light: tone90→idx3
              isDark ? DEFAULT_DARK_PALETTE.surfaceVariant : DEFAULT_LIGHT_PALETTE.surfaceVariant
            ),
            onSurfaceVariant: getTone(
              palette.system_neutral2,
              isDark ? 4 : 9, // INVERTED: Dark: tone80→idx4, Light: tone30→idx9
              isDark
                ? DEFAULT_DARK_PALETTE.onSurfaceVariant
                : DEFAULT_LIGHT_PALETTE.onSurfaceVariant
            ),
            outline: getTone(
              palette.system_neutral2,
              isDark ? 6 : 7, // INVERTED: Dark: tone60→idx6, Light: tone50→idx7
              isDark ? DEFAULT_DARK_PALETTE.outline : DEFAULT_LIGHT_PALETTE.outline
            ),
            outlineVariant: getTone(
              palette.system_neutral2,
              isDark ? 9 : 4, // INVERTED: Dark: tone30→idx9, Light: tone80→idx4
              isDark ? DEFAULT_DARK_PALETTE.outlineVariant : DEFAULT_LIGHT_PALETTE.outlineVariant
            ),

            // Shadow & Scrim
            shadow: '#000000',
            scrim: '#000000',

            // Inverse
            inverseSurface: getTone(
              palette.system_neutral1,
              isDark ? 3 : 10, // INVERTED: Dark: tone90→idx3, Light: tone20→idx10
              isDark ? DEFAULT_DARK_PALETTE.inverseSurface : DEFAULT_LIGHT_PALETTE.inverseSurface
            ),
            inverseOnSurface: getTone(
              palette.system_neutral1,
              isDark ? 10 : 2, // INVERTED: Dark: tone20→idx10, Light: tone95→idx2
              isDark
                ? DEFAULT_DARK_PALETTE.inverseOnSurface
                : DEFAULT_LIGHT_PALETTE.inverseOnSurface
            ),
            inversePrimary: getTone(
              palette.system_accent1,
              isDark ? 8 : 4, // INVERTED: Dark: tone40→idx8, Light: tone80→idx4
              isDark ? DEFAULT_DARK_PALETTE.inversePrimary : DEFAULT_LIGHT_PALETTE.inversePrimary
            ),

            // Surface containers - These need careful mapping
            surfaceDim: getTone(
              palette.system_neutral1,
              isDark ? 11 : 3, // INVERTED: Dark: tone6→idx11, Light: tone87→idx3
              isDark ? DEFAULT_DARK_PALETTE.surfaceDim : DEFAULT_LIGHT_PALETTE.surfaceDim
            ),
            surfaceBright: getTone(
              palette.system_neutral1,
              isDark ? 9 : 1, // INVERTED: Dark: tone24→idx9, Light: tone98→idx1
              isDark ? DEFAULT_DARK_PALETTE.surfaceBright : DEFAULT_LIGHT_PALETTE.surfaceBright
            ),
            surfaceContainerLowest: getTone(
              palette.system_neutral1,
              isDark ? 12 : 0, // INVERTED: Dark: tone4→idx12, Light: tone100→idx0
              isDark
                ? DEFAULT_DARK_PALETTE.surfaceContainerLowest
                : DEFAULT_LIGHT_PALETTE.surfaceContainerLowest
            ),
            surfaceContainerLow: getTone(
              palette.system_neutral1,
              isDark ? 11 : 2, // INVERTED: Dark: tone10→idx11, Light: tone96→idx2
              isDark
                ? DEFAULT_DARK_PALETTE.surfaceContainerLow
                : DEFAULT_LIGHT_PALETTE.surfaceContainerLow
            ),
            surfaceContainer: getTone(
              palette.system_neutral1,
              isDark ? 10 : 3, // INVERTED: Dark: tone12→idx10, Light: tone94→idx3
              isDark
                ? DEFAULT_DARK_PALETTE.surfaceContainer
                : DEFAULT_LIGHT_PALETTE.surfaceContainer
            ),
            surfaceContainerHigh: getTone(
              palette.system_neutral1,
              isDark ? 9 : 3, // INVERTED: Dark: tone17→idx9, Light: tone92→idx3
              isDark
                ? DEFAULT_DARK_PALETTE.surfaceContainerHigh
                : DEFAULT_LIGHT_PALETTE.surfaceContainerHigh
            ),
            surfaceContainerHighest: getTone(
              palette.system_neutral1,
              isDark ? 8 : 3, // INVERTED: Dark: tone22→idx8, Light: tone90→idx3
              isDark
                ? DEFAULT_DARK_PALETTE.surfaceContainerHighest
                : DEFAULT_LIGHT_PALETTE.surfaceContainerHighest
            ),
            isDark: isDark,
          };

          console.log('✨ Material You colors applied:', colorScheme, 'mode');
          setColors(dynamicColors);
          setIsLoading(false);
        } else {
          console.log('⚠️  No Material You palette available, using default');
          setColors(colorScheme === 'dark' ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('❌ Failed to extract Material You colors:', error);
        setColors(colorScheme === 'dark' ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE);
        setIsLoading(false);
      }
    };

    extractDynamicColors();

    // Listen for color scheme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      const resolved = newColorScheme === 'dark' ? 'dark' : 'light';
      console.log('🎨 Color scheme changed to:', resolved);
      setColorScheme(resolved);
    });

    return () => subscription.remove();
  }, [colorScheme]);

  // Return default colors while loading to prevent blank screen
  if (isLoading) {
    return colorScheme === 'dark' ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE;
  }

  return colors;
}
