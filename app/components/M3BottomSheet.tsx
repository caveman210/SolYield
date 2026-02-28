import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Elevation, M3Shape, M3Motion } from '../../lib/design/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface M3BottomSheetProps {
  snapPoints?: string[]; // e.g., ['10%', '50%', '90%']
  initialSnapIndex?: number; // Index of snapPoints array
  children: React.ReactNode;
  onChange?: (index: number) => void;
  style?: ViewStyle;
  enableDimming?: boolean; // Dim the background when expanded
}

export const M3BottomSheet: React.FC<M3BottomSheetProps> = ({
  snapPoints = ['10%', '50%', '90%'],
  initialSnapIndex = 1,
  children,
  onChange,
  style,
  enableDimming = true,
}) => {
  const colors = useMaterialYouColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const dimmingOpacity = useRef(new Animated.Value(0)).current;
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnapIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // Convert percentage strings to pixel values (from top of screen)
  const snapPointsInPixels = snapPoints.map((point) => {
    const percentage = parseFloat(point);
    return SCREEN_HEIGHT - (SCREEN_HEIGHT * percentage) / 100;
  });

  // PanResponder for drag gestures on handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drags
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Disable scrolling while dragging the handle
        setIsScrollEnabled(false);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = snapPointsInPixels[currentSnapIndex] + gestureState.dy;
        // Constrain between minimum (most expanded) and maximum (least expanded)
        const minY = snapPointsInPixels[snapPointsInPixels.length - 1];
        const maxY = snapPointsInPixels[0];
        
        if (newValue >= minY && newValue <= maxY) {
          translateY.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = snapPointsInPixels[currentSnapIndex] + gestureState.dy;
        const velocity = gestureState.vy;

        // Determine target snap point based on position and velocity
        let targetIndex = currentSnapIndex;

        if (velocity > 0.5) {
          // Fast downward swipe - collapse to next lower snap point
          targetIndex = Math.max(0, currentSnapIndex - 1);
        } else if (velocity < -0.5) {
          // Fast upward swipe - expand to next higher snap point
          targetIndex = Math.min(snapPointsInPixels.length - 1, currentSnapIndex + 1);
        } else {
          // Slow drag - snap to nearest point
          const distances = snapPointsInPixels.map((point) => Math.abs(currentY - point));
          targetIndex = distances.indexOf(Math.min(...distances));
        }

        snapToIndex(targetIndex);
        // Re-enable scrolling after animation
        setTimeout(() => setIsScrollEnabled(true), 300);
      },
    })
  ).current;

  const snapToIndex = useCallback(
    (index: number) => {
      setCurrentSnapIndex(index);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: snapPointsInPixels[index],
          damping: M3Motion.spring.smooth.damping * 40,
          stiffness: M3Motion.spring.smooth.stiffness / 10,
          mass: M3Motion.spring.smooth.mass,
          useNativeDriver: true,
        }),
        // Dim the background when more expanded (higher index = more expanded)
        Animated.timing(dimmingOpacity, {
          toValue: enableDimming ? (index / (snapPointsInPixels.length - 1)) * 0.3 : 0,
          duration: M3Motion.duration.medium,
          useNativeDriver: true,
        }),
      ]).start();
      onChange?.(index);
    },
    [snapPointsInPixels, onChange, translateY, dimmingOpacity, enableDimming]
  );

  // Initialize position on mount
  useEffect(() => {
    translateY.setValue(snapPointsInPixels[initialSnapIndex]);
    const initialDimming = enableDimming 
      ? (initialSnapIndex / (snapPointsInPixels.length - 1)) * 0.3 
      : 0;
    dimmingOpacity.setValue(initialDimming);
    onChange?.(initialSnapIndex);
  }, []);

  return (
    <>
      {/* Dimming overlay - appears when sheet is expanded */}
      {enableDimming && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000',
              opacity: dimmingOpacity,
              pointerEvents: 'none',
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant,
            transform: [{ translateY }],
            height: SCREEN_HEIGHT,
          },
          style,
        ]}
      >
        {/* Top accent bar for visual distinction */}
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        
        {/* Drag Handle */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <View
            style={[
              styles.handle,
              {
                backgroundColor: colors.onSurfaceVariant,
                opacity: 0.6,
              },
            ]}
          />
        </View>

        {/* Content - Scrollable */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isScrollEnabled}
          bounces={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: M3Shape.extraExtraLarge,
    borderTopRightRadius: M3Shape.extraExtraLarge,
    ...M3Elevation.level5,
    overflow: 'hidden',
    // Enhanced shadow for better distinction
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 20,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: M3Shape.full,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
