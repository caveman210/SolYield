// Material 3 Expressive Animation Hooks
// Uses React Native Reanimated for M3 motion physics

import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { M3Motion } from './tokens';

// ============================================
// SPRING ANIMATION HOOKS
// ============================================

export const useM3Spring = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const animate = useCallback(
    (
      toValue: number,
      type: 'quick' | 'gentle' | 'bouncy' | 'smooth' | 'enter' | 'exit' = 'gentle',
      delay: number = 0
    ) => {
      const config = M3Motion.spring[type];
      value.value = withDelay(delay, withSpring(toValue, config));
    },
    [value]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: value.value }],
  }));

  return { value, animate, animatedStyle };
};

// ============================================
// EMPHASIZED ENTRANCE ANIMATION
// ============================================

export const useM3Entrance = (delay: number = 0) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const animate = useCallback(() => {
    const config = M3Motion.spring.enter;

    translateY.value = withDelay(delay, withSpring(0, config));
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: M3Motion.duration.medium,
        easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
      })
    );
    scale.value = withDelay(delay, withSpring(1, config));
  }, [delay, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animate, animatedStyle };
};

// ============================================
// STAGGERED LIST ANIMATION
// ============================================

export const useM3Stagger = (itemCount: number, baseDelay: number = 50) => {
  const values = Array.from({ length: itemCount }, () => ({
    translateY: useSharedValue(20),
    opacity: useSharedValue(0),
    scale: useSharedValue(0.95),
  }));

  const animate = useCallback(() => {
    values.forEach((item, index) => {
      const delay = index * baseDelay;
      const config = M3Motion.spring.enter;

      item.translateY.value = withDelay(delay, withSpring(0, config));
      item.opacity.value = withDelay(
        delay,
        withTiming(1, {
          duration: M3Motion.duration.medium,
          easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
        })
      );
      item.scale.value = withDelay(delay, withSpring(1, config));
    });
  }, [values, baseDelay]);

  const getAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => ({
      transform: [
        { translateY: values[index].translateY.value },
        { scale: values[index].scale.value },
      ],
      opacity: values[index].opacity.value,
    }));
  };

  return { animate, getAnimatedStyle };
};

// ============================================
// RIPPLE/PRESS EFFECT
// ============================================

export const useM3PressScale = () => {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, M3Motion.spring.quick);
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, M3Motion.spring.gentle);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
};

// ============================================
// CONTAINER TRANSFORM (FAB to Dialog)
// ============================================

export const useM3ContainerTransform = () => {
  const width = useSharedValue(56);
  const height = useSharedValue(56);
  const borderRadius = useSharedValue(16);
  const opacity = useSharedValue(0);

  const expand = useCallback(() => {
    width.value = withTiming(300, {
      duration: M3Motion.duration.emphasized,
      easing: Easing.bezier(...M3Motion.easing.emphasized),
    });
    height.value = withTiming(400, {
      duration: M3Motion.duration.emphasized,
      easing: Easing.bezier(...M3Motion.easing.emphasized),
    });
    borderRadius.value = withTiming(28, {
      duration: M3Motion.duration.emphasized,
      easing: Easing.bezier(...M3Motion.easing.emphasized),
    });
    opacity.value = withTiming(1, {
      duration: M3Motion.duration.normal,
      easing: Easing.bezier(...M3Motion.easing.standard),
    });
  }, [width, height, borderRadius, opacity]);

  const collapse = useCallback(() => {
    width.value = withTiming(56, {
      duration: M3Motion.duration.emphasized,
      easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
    });
    height.value = withTiming(56, {
      duration: M3Motion.duration.emphasized,
      easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
    });
    borderRadius.value = withTiming(16, {
      duration: M3Motion.duration.emphasized,
      easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
    });
    opacity.value = withTiming(0, {
      duration: M3Motion.duration.fast,
      easing: Easing.bezier(...M3Motion.easing.standard),
    });
  }, [width, height, borderRadius, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
    borderRadius: borderRadius.value,
    opacity: opacity.value,
  }));

  return { expand, collapse, animatedStyle };
};

// ============================================
// PAGE TRANSITION ANIMATION
// ============================================

export const useM3PageTransition = (direction: 'horizontal' | 'vertical' = 'horizontal') => {
  const translateX = useSharedValue(direction === 'horizontal' ? 100 : 0);
  const translateY = useSharedValue(direction === 'vertical' ? 50 : 0);
  const opacity = useSharedValue(0);

  const enter = useCallback(() => {
    const config = M3Motion.spring.enter;
    translateX.value = withSpring(0, config);
    translateY.value = withSpring(0, config);
    opacity.value = withTiming(1, {
      duration: M3Motion.duration.medium,
      easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
    });
  }, [translateX, translateY, opacity, direction]);

  const exit = useCallback(
    (callback?: () => void) => {
      const targetX = direction === 'horizontal' ? -100 : 0;
      const targetY = direction === 'vertical' ? -50 : 0;

      translateX.value = withTiming(targetX, {
        duration: M3Motion.duration.normal,
        easing: Easing.bezier(...M3Motion.easing.standardAccelerate),
      });
      translateY.value = withTiming(targetY, {
        duration: M3Motion.duration.normal,
        easing: Easing.bezier(...M3Motion.easing.standardAccelerate),
      });
      opacity.value = withTiming(
        0,
        {
          duration: M3Motion.duration.fast,
          easing: Easing.bezier(...M3Motion.easing.standardAccelerate),
        },
        (finished) => {
          if (finished && callback) {
            runOnJS(callback)();
          }
        }
      );
    },
    [translateX, translateY, opacity, direction]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { enter, exit, animatedStyle };
};

// ============================================
// SHIMMER/SKELETON LOADING
// ============================================

export const useM3Shimmer = () => {
  const shimmer = useSharedValue(-1);

  const start = useCallback(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [shimmer]);

  const stop = useCallback(() => {
    shimmer.value = -1;
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [-1, 0, 1], [0.3, 0.7, 0.3], Extrapolation.CLAMP),
  }));

  return { start, stop, animatedStyle };
};

// ============================================
// SHARED AXIS ANIMATION (M3 Pattern)
// ============================================

export const useM3SharedAxis = () => {
  const translateY = useSharedValue(20);
  const translateZ = useSharedValue(-10);
  const opacity = useSharedValue(0);

  const forward = useCallback(() => {
    translateY.value = withSpring(0, M3Motion.spring.enter);
    translateZ.value = withSpring(0, M3Motion.spring.enter);
    opacity.value = withTiming(1, {
      duration: M3Motion.duration.medium,
      easing: Easing.bezier(...M3Motion.easing.emphasizedDecelerate),
    });
  }, [translateY, translateZ, opacity]);

  const backward = useCallback(() => {
    translateY.value = withTiming(-20, {
      duration: M3Motion.duration.normal,
      easing: Easing.bezier(...M3Motion.easing.standardAccelerate),
    });
    translateZ.value = withTiming(10, {
      duration: M3Motion.duration.normal,
      easing: Easing.bezier(...M3Motion.easing.standardAccelerate),
    });
    opacity.value = withTiming(0, {
      duration: M3Motion.duration.fast,
      easing: Easing.bezier(...M3Motion.easing.standardAccelerate),
    });
  }, [translateY, translateZ, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: interpolate(translateZ.value, [-10, 0], [0.95, 1], Extrapolation.CLAMP) },
    ],
    opacity: opacity.value,
  }));

  return { forward, backward, animatedStyle };
};

// ============================================
// EMPHASIZED ELEVATION CHANGE
// ============================================

export const useM3Elevation = (initialLevel: 0 | 1 | 2 | 3 | 4 | 5 = 0) => {
  const elevation = useSharedValue(initialLevel);

  const setElevation = useCallback(
    (level: 0 | 1 | 2 | 3 | 4 | 5) => {
      elevation.value = withSpring(level, M3Motion.spring.gentle);
    },
    [elevation]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    elevation: elevation.value,
    shadowOpacity: interpolate(
      elevation.value,
      [0, 1, 2, 3, 4, 5],
      [0, 0.15, 0.15, 0.3, 0.3, 0.3],
      Extrapolation.CLAMP
    ),
    shadowRadius: interpolate(
      elevation.value,
      [0, 1, 2, 3, 4, 5],
      [0, 3, 6, 3, 3, 4],
      Extrapolation.CLAMP
    ),
    shadowOffset: {
      width: 0,
      height: interpolate(
        elevation.value,
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 1, 2, 4],
        Extrapolation.CLAMP
      ),
    },
  }));

  return { setElevation, animatedStyle };
};
