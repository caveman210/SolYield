import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { useDBActivities } from '../../lib/hooks/useDBActivities';
import { useOfflineSync, formatLastSyncTime } from '../../lib/hooks/useOfflineSync';
import { M3Typography, M3Spacing, M3Shape } from '../../lib/design/tokens';
import { Activity, ActivityType } from '../../lib/types';
import { getActivityIcon } from '../../lib/utils/activityUtils';
import StyledText from '../components/StyledText';
import ActivityCard from '../components/ActivityCard';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * InspectionsScreen Component
 * Shows recent activities with filtering and a FAB to create new inspections
 */
export default function InspectionsScreen() {
  const colors = useMaterialYouColors();
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const { activities: allActivities, isLoading } = useDBActivities();
  const { syncDataManually, isSyncing, unsyncedCount, lastSyncTime, isOnline } = useOfflineSync();

  // Filter activities by type
  const filteredActivities = filterType === 'all' 
    ? allActivities 
    : allActivities.filter(a => a.type === filterType);

  const handleActivityPress = (activity: Activity) => {
    // For inspection activities, navigate to the inspection detail page
    if (activity.type === 'inspection' && activity.metadata?.inspectionId) {
      router.push(`/inspection/${activity.metadata.inspectionId}` as any);
    }
    // For other activities with siteId, navigate to site detail
    else if (activity.siteId) {
      router.push(`/site/${activity.siteId}` as any);
    }
  };

  const handleNewInspection = () => {
    router.push('/inspection-form');
  };

  const handleSyncPress = async () => {
    if (!isOnline || unsyncedCount === 0 || isSyncing) {
      return;
    }
    await syncDataManually();
  };

  const renderFilterChip = (type: ActivityType | 'all', label: string, icon: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.filterChip,
        {
          backgroundColor:
            filterType === type ? colors.secondaryContainer : colors.surfaceContainerHigh,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => setFilterType(type)}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={filterType === type ? colors.onSecondaryContainer : colors.onSurfaceVariant}
      />
      <StyledText
        style={{
          ...M3Typography.label.medium,
          color: filterType === type ? colors.onSecondaryContainer : colors.onSurfaceVariant,
          marginLeft: M3Spacing.xs,
        }}
      >
        {label}
      </StyledText>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="clipboard-text-outline"
        size={64}
        color={colors.onSurfaceVariant}
      />
      <StyledText
        style={{
          ...M3Typography.title.large,
          color: colors.onSurface,
          marginTop: M3Spacing.lg,
        }}
      >
        No activities yet
      </StyledText>
      <StyledText
        style={{
          ...M3Typography.body.medium,
          color: colors.onSurfaceVariant,
          marginTop: M3Spacing.sm,
          textAlign: 'center',
        }}
      >
        Your recent activities will appear here
      </StyledText>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={handleNewInspection}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
        <StyledText
          style={{
            ...M3Typography.label.large,
            color: colors.onPrimary,
            marginLeft: M3Spacing.xs,
          }}
        >
          New Inspection
        </StyledText>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <StyledText
          style={{
            ...M3Typography.title.large,
            color: colors.onBackground,
            fontWeight: '600',
          }}
        >
          Inspections
        </StyledText>
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: colors.primaryContainer }]}
          onPress={handleSyncPress}
          activeOpacity={0.7}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
          ) : (
            <MaterialCommunityIcons
              name={isOnline ? 'cloud-sync' : 'cloud-off-outline'}
              size={24}
              color={colors.onPrimaryContainer}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Sync Status Banner */}
      {(unsyncedCount > 0 || lastSyncTime) && (
        <View
          style={[
            styles.syncBanner,
            {
              backgroundColor:
                unsyncedCount > 0 ? colors.errorContainer : colors.surfaceContainerHigh,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={unsyncedCount > 0 ? 'cloud-upload' : 'cloud-check'}
            size={16}
            color={unsyncedCount > 0 ? colors.onErrorContainer : colors.onSurfaceVariant}
          />
          <StyledText
            style={{
              ...M3Typography.body.small,
              color: unsyncedCount > 0 ? colors.onErrorContainer : colors.onSurfaceVariant,
              marginLeft: M3Spacing.xs,
            }}
          >
            {unsyncedCount > 0
              ? `${unsyncedCount} item${unsyncedCount > 1 ? 's' : ''} pending sync`
              : `Last synced ${formatLastSyncTime(lastSyncTime)}`}
          </StyledText>
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {renderFilterChip('all', 'All', 'view-list')}
        {renderFilterChip('inspection', 'Inspections', 'check-circle')}
        {renderFilterChip('check-in', 'Check-ins', 'map-marker-check')}
        {renderFilterChip('report', 'Reports', 'file-document')}
        {renderFilterChip('schedule', 'Schedule', 'calendar-check')}
        {renderFilterChip('maintenance', 'Maintenance', 'wrench')}
      </View>

      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.activityItem}>
            <ActivityCard activity={item} onPress={handleActivityPress} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />

      {/* Floating Action Button */}
      <AnimatedTouchableOpacity
        entering={FadeInUp.duration(400).delay(200)}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primaryContainer,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={handleNewInspection}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimaryContainer} />
      </AnimatedTouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
  },
  syncButton: {
    width: 48,
    height: 48,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.sm,
    marginHorizontal: M3Spacing.lg,
    marginBottom: M3Spacing.sm,
    borderRadius: M3Shape.small,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: M3Spacing.sm,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.md,
    paddingVertical: M3Spacing.sm,
    borderRadius: M3Shape.small,
  },
  listContent: {
    paddingHorizontal: M3Spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  activityItem: {
    marginBottom: M3Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.xxxl * 2,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.xl,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Shape.full,
    marginTop: M3Spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: M3Spacing.lg,
    bottom: M3Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: M3Shape.large,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
