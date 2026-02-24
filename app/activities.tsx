import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addActivity } from '../store/slices/activitySlice';
import {
  useMaterialYouColors,
  useAnimatedMaterialYouColors,
} from '../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Spacing, M3Shape } from '../lib/design/tokens';
import { Activity, ActivityType } from '../lib/types';
import StyledText from './components/StyledText';
import ActivityCard from './components/ActivityCard';

export default function ActivitiesScreen() {
  const colors = useMaterialYouColors();
  const animatedColors = useAnimatedMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();

  const activities = useSelector((state: RootState) => state.activity.activities);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');

  // Sample data for demo - in production, this would be loaded from the backend
  useEffect(() => {
    // Only add sample data if there are no activities yet
    if (activities.length === 0) {
      const sampleActivities: Omit<Activity, 'id' | 'timestamp' | 'synced'>[] = [
        {
          type: 'inspection',
          title: 'Site A Inspection Complete',
          siteName: 'Solar Farm A',
          siteId: '1',
          icon: 'check-circle',
        },
        {
          type: 'maintenance',
          title: 'Maintenance Scheduled - Site B',
          siteName: 'Solar Farm B',
          siteId: '2',
          icon: 'wrench',
        },
        {
          type: 'report',
          title: 'Report Generated - Site C',
          siteName: 'Solar Farm C',
          siteId: '3',
          icon: 'file-document',
        },
        {
          type: 'check-in',
          title: 'Checked in at Site A',
          siteName: 'Solar Farm A',
          siteId: '1',
          icon: 'map-marker-check',
        },
        {
          type: 'schedule',
          title: 'Visit Scheduled for Tomorrow',
          siteName: 'Solar Farm D',
          siteId: '4',
          icon: 'calendar-check',
        },
      ];

      // Add activities with delays to simulate realistic timestamps
      sampleActivities.forEach((activity, index) => {
        setTimeout(() => {
          dispatch(addActivity(activity));
        }, index * 100);
      });
    }
  }, []);

  const filteredActivities =
    filterType === 'all'
      ? activities
      : activities.filter((activity) => activity.type === filterType);

  const handleActivityPress = (activity: Activity) => {
    // Navigate to relevant screen based on activity type
    if (activity.siteId) {
      router.push(`/site/${activity.siteId}` as any);
    }
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
    <View style={styles.emptyContainer}>
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
    </View>
  );

  return (
    <RNAnimated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: animatedColors.background,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <StyledText
          style={{
            ...M3Typography.title.large,
            color: colors.onBackground,
            fontWeight: '600',
          }}
        >
          Recent Activities
        </StyledText>
        <View style={{ width: 48 }} />
      </View>

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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + M3Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </RNAnimated.View>
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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  activityItem: {
    marginBottom: M3Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.xxxl * 2,
  },
});
