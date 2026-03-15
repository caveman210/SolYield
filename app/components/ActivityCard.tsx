import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../lib/types';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { formatRelativeTime, getActivityColorRole } from '../../lib/utils/activityUtils';
import StyledText from './StyledText';
import { ActivityContextData } from '../../lib/hooks/useActivityContext';

interface ActivityCardProps {
  activity: Activity;
  context?: ActivityContextData; // Passed down from parent to avoid O(N) DB subscriptions
  onPress?: (activity: Activity) => void;
}

export default function ActivityCard({ activity, context, onPress }: ActivityCardProps) {
  const colors = useMaterialYouColors();
  const colorRole = getActivityColorRole(activity.type);
  const activityColor = colors[colorRole as keyof typeof colors] as string;

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

  const isArchivalEvent = !!(
    activity.metadata?.archivedSiteId || activity.metadata?.archivedVisitId
  );

  return (
    <TouchableOpacity
      className="flex-row items-start p-4 rounded-xl border-l-4 gap-3"
      style={{
        backgroundColor: colors.surfaceContainer,
        borderLeftColor: activityColor,
      }}
      activeOpacity={0.7}
      onPress={() => onPress?.(activity)}
    >
      <View
        className="w-10 h-10 rounded-lg justify-center items-center"
        style={{
          backgroundColor: `${activityColor}33`,
        }}
      >
        <MaterialCommunityIcons name={activity.icon as any} size={24} color={activityColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <StyledText
            className="flex-1"
            style={{
              color: colors.onSurface,
            }}
            numberOfLines={2}
          >
            {activity.title}
          </StyledText>
          <StyledText
            className="ml-2"
            style={{
              color: colors.onSurfaceVariant,
            }}
          >
            {formatRelativeTime(activity.timestamp)}
          </StyledText>
        </View>

        {context?.description && (
          <StyledText
            className="mt-0.5"
            style={{
              color: colors.onSurfaceVariant,
            }}
            numberOfLines={2}
          >
            {context.description}
          </StyledText>
        )}

        {inspectionSummary && (
          <StyledText
            className="mt-1"
            style={{
              color: colors.tertiary,
            }}
          >
            {inspectionSummary}
          </StyledText>
        )}

        {context?.site && (
          <View className="flex-row items-center mt-2">
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.onSurfaceVariant} />
            <StyledText
              className="ml-1"
              style={{
                color: colors.onSurfaceVariant,
              }}
              numberOfLines={1}
            >
              {context.site.name} • {context.site.location.lat.toFixed(2)}°,{' '}
              {context.site.location.lng.toFixed(2)}°
            </StyledText>
          </View>
        )}

        {previousInspectionLabel && (
          <View className="flex-row items-center mt-2">
            <MaterialCommunityIcons
              name="clipboard-text-clock"
              size={16}
              color={colors.onSurfaceVariant}
            />
            <StyledText
              className="ml-1"
              style={{
                color: colors.onSurfaceVariant,
              }}
            >
              {previousInspectionLabel}
            </StyledText>
          </View>
        )}
      </View>

      <MaterialCommunityIcons
        name={isArchivalEvent ? 'archive-arrow-up-outline' : 'chevron-right'}
        size={24}
        color={isArchivalEvent ? colors.primary : colors.onSurfaceVariant}
      />
    </TouchableOpacity>
  );
}
