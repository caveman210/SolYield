import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Elevation, M3Shape, M3Spacing, M3Typography } from '../../lib/design/tokens';

interface FloatingInfoBoxProps {
  siteName: string;
  capacity: string;
  distance: string | null;
  visible: boolean; // Show only when bottom sheet is collapsed
}

export const FloatingInfoBox: React.FC<FloatingInfoBoxProps> = ({
  siteName,
  capacity,
  distance,
  visible,
}) => {
  const colors = useMaterialYouColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : -10,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerHigh,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Site Name */}
      <View style={styles.row}>
        <Ionicons name="location" size={20} color={colors.primary} />
        <Text
          style={[
            styles.siteName,
            { color: colors.onSurface },
          ]}
          numberOfLines={1}
        >
          {siteName}
        </Text>
      </View>

      {/* Capacity & Distance */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="flash" size={16} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
            {capacity}
          </Text>
        </View>

        {distance && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.detailItem}>
              <Ionicons name="navigate" size={16} color={colors.tertiary} />
              <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                {distance}
              </Text>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: M3Spacing.lg,
    left: M3Spacing.lg,
    right: M3Spacing.lg,
    borderRadius: M3Shape.extraLarge,
    padding: M3Spacing.lg,
    ...M3Elevation.level3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: M3Spacing.sm,
  },
  siteName: {
    ...M3Typography.title.medium,
    marginLeft: M3Spacing.sm,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: M3Spacing.xs,
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: M3Spacing.md,
  },
  detailText: {
    ...M3Typography.body.medium,
  },
});
