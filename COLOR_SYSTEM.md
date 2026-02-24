# Material You Hexa-Tone Color System

## Overview

This app implements a comprehensive Material You dynamic color system that extracts colors from your Android device wallpaper (Android 12+) and applies them consistently throughout the entire application.

## Color Architecture

### 6-Tone System

The hexa-tone system uses 6 primary color surfaces for the entire app:

1. **Background** (from wallpaper)
   - `appBackground` - Main app background dynamically sourced from device wallpaper
   - `appOnBackground` - Text/icons on background

2. **Surface Containers** (5 elevation levels)
   - `surfaceLowest` - Cards at rest
   - `surfaceLow` - Slightly elevated cards
   - `surfaceBase` - Default surface for cards, sections
   - `surfaceHigh` - Elevated surfaces (modals, dialogs)
   - `surfaceHighest` - Top-most surfaces (tooltips, menus)

3. **Primary Accent** (interactive elements)
   - `buttonPrimary` - Primary buttons, FABs, active tab states
   - `buttonPrimaryContainer` - Primary button backgrounds
   - `buttonOnPrimary` - Text on primary buttons
   - `buttonOnPrimaryContainer` - Text on primary containers

4. **Secondary Accent** (supporting elements)
   - `buttonSecondary` - Secondary buttons, toggles
   - `buttonSecondaryContainer` - Secondary backgrounds
   - `buttonOnSecondary` - Text on secondary buttons
   - `buttonOnSecondaryContainer` - Text on secondary containers

5. **Tertiary Accent** (variety and success states)
   - `buttonTertiary` - Tertiary buttons, chips
   - `buttonTertiaryContainer` - Tertiary backgrounds
   - `buttonOnTertiary` - Text on tertiary buttons
   - `buttonOnTertiaryContainer` - Text on tertiary containers

6. **Text/Icons** (adaptive based on surface)
   - `textPrimary` - High emphasis text (87% opacity equivalent)
   - `textSecondary` - Medium emphasis (60% opacity equivalent)
   - `textTertiary` - Disabled/hint text (38% opacity equivalent)
   - `iconPrimary`, `iconSecondary`, `iconTertiary` - Matching icon colors

## Usage

### Import and Use Semantic Colors

```typescript
import { useSemanticColors } from '../../lib/design/colorRoles';

function MyComponent() {
  const colors = useSemanticColors();

  return (
    <View style={{ backgroundColor: colors.appBackground }}>
      <View style={{ backgroundColor: colors.surfaceBase }}>
        <Text style={{ color: colors.textPrimary }}>Hello</Text>
      </View>
    </View>
  );
}
```

### Color Guidelines

#### Backgrounds

- Use `appBackground` for the root screen background
- Use `surfaceBase` for card backgrounds
- Use `surfaceLow` / `surfaceHigh` for layered surfaces

#### Interactive Elements

- Primary actions: `buttonPrimary` / `buttonOnPrimary`
- Secondary actions: `buttonSecondary` / `buttonOnSecondary`
- Tertiary/success: `buttonTertiary` / `buttonOnTertiary`

#### Text

- High emphasis: `textPrimary` or `onSurface`
- Medium emphasis: `textSecondary` or `onSurfaceVariant`
- Low emphasis: `textTertiary` or `outline`

#### Icons

- Use `iconPrimary` for important icons
- Use `iconSecondary` for secondary icons
- Use `iconTertiary` for disabled icons

## Safe Area Implementation

All screens now use proper safe area insets for edge-to-edge display:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useSemanticColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View style={{ paddingTop: insets.top + 16 }}>
        {/* Header content */}
      </View>
      {/* Screen content */}
      <View style={{ paddingBottom: insets.bottom }}>
        {/* Bottom content */}
      </View>
    </View>
  );
}
```

## Edge-to-Edge Configuration

The app is configured for full edge-to-edge display on Android:

- **StatusBar**: Translucent with auto style based on Material You colors
- **NavigationBar**: Background color matches app background
- **SafeAreaProvider**: Wraps entire app in `_layout.tsx`
- **Insets**: All screens use `useSafeAreaInsets()` for proper spacing

## Material You Dynamic Colors

On Android 12+ devices, colors are extracted from the system wallpaper using the `react-native-material-you-colors` package. The system provides 5 tonal palettes:

- `system_accent1` → Primary colors
- `system_accent2` → Secondary colors
- `system_accent3` → Tertiary colors
- `system_neutral1` → Background/surface colors
- `system_neutral2` → Variant colors

Each palette has 13 tones (0-100) that are mapped to M3 color roles based on light/dark mode.

## Fallback Colors

On iOS or older Android versions, the app uses a carefully designed green energy theme as fallback:

**Light Mode**:

- Primary: `#006C4C` (Forest green)
- Background: `#F6FBF4` (Soft mint)

**Dark Mode**:

- Primary: `#4CDEA4` (Bright green)
- Background: `#0F1511` (Deep forest)

## Files

- `lib/hooks/useMaterialYou.ts` - Material You color extraction
- `lib/design/colorRoles.ts` - Semantic color roles system
- `lib/hooks/MaterialYouProvider.tsx` - React Context provider
- `app/_layout.tsx` - Root layout with SafeAreaProvider and StatusBar
- All screen files - Updated to use semantic colors and safe area insets
