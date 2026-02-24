import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../lib/types';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Spacing } from '../../lib/design/tokens';
import StyledText from './StyledText';

interface ActivityCardProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
}

/**
 * Formats a timestamp into a relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Gets the appropriate color for an activity type
 */
function getActivityColor(type: Activity['type'], colors: any): string {
  switch (type) {
    case 'inspection':
      return colors.tertiary;
    case 'check-in':
      return colors.secondary;
    case 'report':
      return colors.primary;
    case 'schedule':
      return colors.secondary;
    case 'maintenance':
      return colors.error;
    default:
      return colors.primary;
  }
}

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const colors = useMaterialYouColors();
  const activityColor = getActivityColor(activity.type, colors);

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
