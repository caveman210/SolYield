import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { Animated } from 'react-native';
import { useMaterialYou, MaterialYouColors } from './useMaterialYou';

interface MaterialYouContextType {
  colors: MaterialYouColors;
  animatedColors: Record<keyof MaterialYouColors, Animated.AnimatedInterpolation<string | number>>;
  transitionProgress: Animated.Value;
}

const MaterialYouContext = createContext<MaterialYouContextType | undefined>(undefined);

export function MaterialYouProvider({ children }: { children: ReactNode }) {
  const colors = useMaterialYou();
  const prevColors = useRef<MaterialYouColors>(colors);
  const transitionProgress = useRef(new Animated.Value(1)).current;
  const [animatedColors, setAnimatedColors] = useState(() =>
    createAnimatedColors(transitionProgress, colors, colors)
  );

  // CRITICAL: Store the colors object reference in a ref to ensure stability
  // Only update it when color VALUES actually change
  const stableColorsRef = useRef<MaterialYouColors>(colors);

  useEffect(() => {
    // Check if colors actually changed
    const hasChanged = Object.keys(colors).some(
      (key) =>
        colors[key as keyof MaterialYouColors] !==
        prevColors.current[key as keyof MaterialYouColors]
    );

    if (hasChanged) {
      console.log('🎨 Material You colors changed, updating...');

      // Update the stable ref with new colors
      stableColorsRef.current = colors;

      // Reset animation progress to 0
      transitionProgress.setValue(0);

      // Create new animated color interpolations
      const newAnimatedColors = createAnimatedColors(
        transitionProgress,
        prevColors.current,
        colors
      );
      setAnimatedColors(newAnimatedColors);

      // Animate to new colors over 300ms (M3 medium1 duration)
      Animated.timing(transitionProgress, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false, // Color animations require JS driver
      }).start();

      // Store current colors for next transition
      prevColors.current = colors;
    }
  }, [colors, transitionProgress]);

  // CRITICAL: Memoize the context value to prevent re-renders
  // The colors ref ensures the same object reference unless colors actually change
  const contextValue = useMemo(
    () => ({
      colors: stableColorsRef.current,
      animatedColors,
      transitionProgress,
    }),
    [animatedColors, transitionProgress]
  );

  return <MaterialYouContext.Provider value={contextValue}>{children}</MaterialYouContext.Provider>;
}

/**
 * Creates animated interpolations for all color properties
 */
function createAnimatedColors(
  progress: Animated.Value,
  fromColors: MaterialYouColors,
  toColors: MaterialYouColors
): Record<keyof MaterialYouColors, Animated.AnimatedInterpolation<string | number>> {
  const animated = {} as Record<
    keyof MaterialYouColors,
    Animated.AnimatedInterpolation<string | number>
  >;

  for (const key in toColors) {
    const colorKey = key as keyof MaterialYouColors;
    // Skip isDark as it's a boolean, not a color
    if (colorKey === 'isDark') continue;
    
    animated[colorKey] = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [fromColors[colorKey], toColors[colorKey]],
    });
  }

  return animated;
}

export function useMaterialYouColors(): MaterialYouColors {
  const context = useContext(MaterialYouContext);

  if (!context) {
    throw new Error('useMaterialYouColors must be used within MaterialYouProvider');
  }

  return context.colors;
}

/**
 * Hook to get animated color values for smooth theme transitions
 * Use this when you want smooth color transitions (e.g., background, text colors)
 */
export function useAnimatedMaterialYouColors() {
  const context = useContext(MaterialYouContext);

  if (!context) {
    throw new Error('useAnimatedMaterialYouColors must be used within MaterialYouProvider');
  }

  return context.animatedColors;
}
