import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { MaterialYouColors } from './useMaterialYou';

/**
 * Hook to create animated color transitions when theme changes
 * Returns animated color values that smoothly interpolate between themes
 */
export function useAnimatedTheme(colors: MaterialYouColors) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 300, // M3 standard medium1 duration
      useNativeDriver: false, // Color animations can't use native driver
    }).start();
  }, [colors, animValue]);

  return { animValue, colors };
}

/**
 * Interpolates between two colors with animation
 */
export function interpolateColor(
  animValue: Animated.Value,
  fromColor: string,
  toColor: string
): Animated.AnimatedInterpolation<string | number> {
  return animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [fromColor, toColor],
  });
}
