import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../lib/types';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Spacing } from '../../lib/design/tokens';
import { formatRelativeTime, getActivityColorRole } from '../../lib/utils/activityUtils';
import StyledText from './StyledText';
import { useActivityContextMap } from '../../lib/hooks/useActivityContext';

interface ActivityCardProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
}

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const colors = useMaterialYouColors();
  const colorRole = getActivityColorRole(activity.type);
  const activityColor = colors[colorRole as keyof typeof colors] as string;
  const context = useActivityContextMap([activity])[activity.id];

  const previousInspectionLabel = useMemo(() => {
    if (!context) return null;
    if (context.previousVisitCount === 0) return 'First inspection at this site';
    if (!context.lastVisitTimestamp) {
      return `${context.previousVisitCount} previous inspection${context.previousVisitCount > 1 ? 's' : ''}`;
    }
    return `${context.previousVisitCount} previous inspection${context.previousVisitCount > 1 ? 's' : ''} • Last: ${formatRelativeTime(
      context.lastVisitTimestamp
    )}`;
  }, [context]);

  const inspectionSummary = useMemo(() => {
    if (!activity.metadata || activity.type !== 'inspection') return null;
    const inspector = activity.metadata.technician ?? 'Field Technician';
    const duration = activity.metadata.durationMinutes
      ? `${activity.metadata.durationMinutes} min`
      : undefined;
    const status = activity.metadata.status;
    if (!duration && !status) {
      return `Logged by ${inspector}`;
    }
    if (duration && status) {
      return `${status} • ${duration}`;
    }
    return duration || status;
  }, [activity.metadata, activity.type]);

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
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${activityColor}33`,
          },
        ]}
      >
        <MaterialCommunityIcons name={activity.icon as any} size={24} color={activityColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <StyledText
            style={{
              ...M3Typography.body.large,
              color: colors.onSurface,
              flex: 1,
            }}
            numberOfLines={2}
          >
            {activity.title}
          </StyledText>
          <StyledText
            style={{
              ...M3Typography.label.small,
              color: colors.onSurfaceVariant,
              marginLeft: M3Spacing.sm,
            }}
          >
            {formatRelativeTime(activity.timestamp)}
          </StyledText>
        </View>

        {context?.description && (
          <StyledText
            style={{
              ...M3Typography.body.small,
              color: colors.onSurfaceVariant,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {context.description}
          </StyledText>
        )}

        {inspectionSummary && (
          <StyledText
            style={{
              ...M3Typography.label.small,
              color: colors.tertiary,
              marginTop: 4,
            }}
          >
            {inspectionSummary}
          </StyledText>
        )}

        {context?.site && (
          <View style={styles.siteRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.onSurfaceVariant} />
            <StyledText
              style={{
                ...M3Typography.label.small,
                color: colors.onSurfaceVariant,
                marginLeft: 4,
              }}
              numberOfLines={1}
            >
              {context.site.name} • {context.site.location.lat.toFixed(2)}°, {context.site.location.lng.toFixed(2)}°
            </StyledText>
          </View>
        )}

        {previousInspectionLabel && (
          <View style={styles.footerRow}>
            <MaterialCommunityIcons name="clipboard-text-clock" size={16} color={colors.onSurfaceVariant} />
            <StyledText
              style={{
                ...M3Typography.label.small,
                color: colors.onSurfaceVariant,
                marginLeft: 4,
              }}
            >
              {previousInspectionLabel}
            </StyledText>
          </View>
        )}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: M3Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: M3Spacing.sm,
  },
});
