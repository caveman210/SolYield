import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StyledText from '../StyledText';
import {
  M3Typography,
  M3Shape,
  M3Elevation,
  M3Spacing,
  M3Motion,
} from '../../../lib/design/tokens';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  containerColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  textColor: string;
  onPress: () => void;
  delay: number;
}

/**
 * Pure Presentation Component: StatCard
 * Displays a single stat card with icon, value, and label
 *
 * IMPORTANT: This component uses React.memo with a custom comparison.
 * It will ONLY re-render when the value or label changes.
 * Colors are static module constants, so they NEVER trigger re-renders.
 */
const StatCard = React.memo<StatCardProps>(
  ({
    icon,
    value,
    label,
    containerColor,
    iconBackgroundColor,
    iconColor,
    textColor,
    onPress,
    delay,
  }) => {
    return (
      <AnimatedTouchable
        entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(delay)}
        style={[
          styles.statCard,
          {
            backgroundColor: containerColor,
            ...M3Elevation.level0,
          },
        ]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={[styles.statIconContainer, { backgroundColor: iconBackgroundColor }]}>
          <MaterialCommunityIcons name={icon as any} size={28} color={iconColor} />
        </View>
        <StyledText
          style={{
            ...M3Typography.headline.small,
            color: textColor,
            fontWeight: '700',
            marginTop: M3Spacing.md,
          }}
        >
          {value}
        </StyledText>
        <StyledText
          style={{
            ...M3Typography.body.medium,
            color: textColor,
            opacity: 0.8,
            marginTop: M3Spacing.xs,
          }}
        >
          {label}
        </StyledText>
      </AnimatedTouchable>
    );
  },
  (prevProps, nextProps) => {
    // CRITICAL: Only re-render when value or label changes
    // Colors are STATIC and never change, so we ignore them in comparison
    return prevProps.value === nextProps.value && prevProps.label === nextProps.label;
  }
);

StatCard.displayName = 'StatCard';

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: M3Shape.large,
    padding: M3Spacing.lg,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: M3Shape.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatCard;
