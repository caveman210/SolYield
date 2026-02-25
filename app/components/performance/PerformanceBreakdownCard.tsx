import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PerformanceBreakdownCardProps {
  icon: string;
  value: number;
  label: string;
  containerColor: string;
  iconColor: string;
}

/**
 * Pure Presentation Component: Performance Breakdown Card
 * Displays a single metric in the performance breakdown section
 * Memoized to prevent unnecessary re-renders when colors don't change
 */
const PerformanceBreakdownCard = React.memo<PerformanceBreakdownCardProps>(
  ({ icon, value, label, containerColor, iconColor }) => {
    return (
      <View style={styles.breakdownItem}>
        <View style={[styles.breakdownIconContainer, { backgroundColor: containerColor }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <Text style={styles.breakdownValue}>{value}</Text>
        <Text style={styles.breakdownLabel}>{label}</Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if value changes
    // Colors are stable references from useMemo, so they won't trigger re-renders
    return (
      prevProps.value === nextProps.value &&
      prevProps.containerColor === nextProps.containerColor &&
      prevProps.iconColor === nextProps.iconColor
    );
  }
);

PerformanceBreakdownCard.displayName = 'PerformanceBreakdownCard';

const styles = StyleSheet.create({
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PerformanceBreakdownCard;
