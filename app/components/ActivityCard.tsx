import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../lib/types';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Spacing } from '../../lib/design/tokens';
import { formatRelativeTime, getActivityColorRole } from '../../lib/utils/activityUtils';
import StyledText from './StyledText';

interface ActivityCardProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
}

/**
 * ActivityCard Component (Pure Presentation)
 * Displays a single activity with icon, title, site name, and timestamp
 * All business logic is handled by utility functions and hooks
 */
export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const colors = useMaterialYouColors();
  const colorRole = getActivityColorRole(activity.type);
  const activityColor = colors[colorRole as keyof typeof colors] as string;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainer,
          borderLeftColor: activityColor,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => onPress?.(activity)}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: activityColor + '33', // 20% opacity
          },
        ]}
      >
        <MaterialCommunityIcons name={activity.icon as any} size={24} color={activityColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <StyledText
          style={{
            ...M3Typography.body.large,
            color: colors.onSurface,
          }}
          numberOfLines={2}
        >
          {activity.title}
        </StyledText>
        {activity.siteName && (
          <StyledText
            style={{
              ...M3Typography.body.small,
              color: colors.onSurfaceVariant,
              marginTop: 2,
            }}
          >
            {activity.siteName}
          </StyledText>
        )}
        <StyledText
          style={{
            ...M3Typography.body.small,
            color: colors.onSurfaceVariant,
            marginTop: 4,
          }}
        >
          {formatRelativeTime(activity.timestamp)}
        </StyledText>
      </View>

      {/* Chevron */}
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
    borderLeftWidth: 4,
    gap: M3Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: M3Shape.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
