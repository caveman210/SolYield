import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMaterialYouColors, useAnimatedMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { useActivitiesByType, useActivityActions } from '../lib/hooks/useActivityManager';
import { useOfflineSync, formatLastSyncTime } from '../lib/hooks/useOfflineSync';
import { useActivityContextMap } from '../lib/hooks/useActivityContext';
import { M3Typography, M3Spacing, M3Shape } from '../lib/design/tokens';
import { Activity, ActivityType } from '../lib/types';
import { getActivityIcon } from '../lib/utils/activityUtils';
import StyledText from './components/StyledText';
import ActivityCard from './components/ActivityCard';
import M3ConfirmDialog from './components/M3ConfirmDialog';

import { useSites } from '../lib/hooks/useSites';
import { useScheduleManagement } from '../lib/hooks/useScheduleManagement';

export default function ActivitiesScreen() {
  const colors = useMaterialYouColors();
  const animatedColors = useAnimatedMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const { activities: filteredActivities, isLoading } = useActivitiesByType(filterType);
  const { createActivity } = useActivityActions();
  const { syncDataManually, isSyncing, unsyncedCount, lastSyncTime, isOnline } = useOfflineSync();

  // ONLY 1 MAP RENDER PER SCREEN - Removes O(N) lag instantly!
  const contextMap = useActivityContextMap(filteredActivities);

  const { unarchiveSite } = useSites(true); 
  const { unarchiveVisit } = useScheduleManagement();

  const [unarchiveConfig, setUnarchiveConfig] = useState<{
    visible: boolean;
    activity: Activity | null;
  }>({ visible: false, activity: null });

  useEffect(() => {
    if (filteredActivities.length === 0 && filterType === 'all') {
      const sampleActivities: Omit<Activity, 'id' | 'timestamp' | 'synced'>[] = [
        { type: 'inspection', title: 'Site A Inspection Complete', siteName: 'Solar Farm A', siteId: '1', icon: getActivityIcon('inspection') },
        { type: 'maintenance', title: 'Maintenance Scheduled - Site B', siteName: 'Solar Farm B', siteId: '2', icon: getActivityIcon('maintenance') },
        { type: 'report', title: 'Report Generated - Site C', siteName: 'Solar Farm C', siteId: '3', icon: getActivityIcon('report') },
        { type: 'check-in', title: 'Checked in at Site A', siteName: 'Solar Farm A', siteId: '1', icon: getActivityIcon('check-in') },
        { type: 'schedule', title: 'Visit Scheduled for Tomorrow', siteName: 'Solar Farm D', siteId: '4', icon: getActivityIcon('schedule') },
      ];
      sampleActivities.forEach((activity, index) => {
        setTimeout(() => createActivity(activity), index * 100);
      });
    }
  }, []);

  const handleActivityPress = (activity: Activity) => {
    if (activity.metadata?.archivedSiteId || activity.metadata?.archivedVisitId) {
       setUnarchiveConfig({ visible: true, activity });
       return;
    }
    if (activity.type === 'inspection' && activity.metadata?.inspectionId) {
      router.push(`/inspection/${activity.metadata.inspectionId}` as any);
    } else if (activity.siteId) {
      router.push(`/site/${activity.siteId}` as any);
    }
  };

  const handleUnarchive = async () => {
    const activity = unarchiveConfig.activity;
    if (!activity || !activity.metadata) return;

    try {
      if (activity.metadata.archivedSiteId) {
         await unarchiveSite(activity.metadata.archivedSiteId);
      } else if (activity.metadata.archivedVisitId) {
         await unarchiveVisit(activity.metadata.archivedVisitId);
      }
      setUnarchiveConfig({ visible: false, activity: null });
    } catch (error) {
       console.error("Failed to unarchive", error);
    }
  };

  const handleSyncPress = async () => {
    if (!isOnline || unsyncedCount === 0 || isSyncing) return;
    await syncDataManually();
  };

  const renderFilterChip = (type: ActivityType | 'all', label: string, icon: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.filterChip,
        { backgroundColor: filterType === type ? colors.secondaryContainer : colors.surfaceContainerHigh },
      ]}
      activeOpacity={0.7}
      onPress={() => setFilterType(type)}
    >
      <MaterialCommunityIcons name={icon as any} size={18} color={filterType === type ? colors.onSecondaryContainer : colors.onSurfaceVariant} />
      <StyledText style={{ ...M3Typography.label.medium, color: filterType === type ? colors.onSecondaryContainer : colors.onSurfaceVariant, marginLeft: M3Spacing.xs }}>
        {label}
      </StyledText>
    </TouchableOpacity>
  );

  return (
    <RNAnimated.View style={[styles.container, { paddingTop: insets.top, backgroundColor: animatedColors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surfaceContainerHigh }]} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <StyledText style={{ ...M3Typography.title.large, color: colors.onBackground, fontWeight: '600' }}>Recent Activities</StyledText>
        <TouchableOpacity style={[styles.syncButton, { backgroundColor: colors.primaryContainer }]} onPress={handleSyncPress} activeOpacity={0.7} disabled={isSyncing}>
          {isSyncing ? <ActivityIndicator size="small" color={colors.onPrimaryContainer} /> : <MaterialCommunityIcons name={isOnline ? 'cloud-sync' : 'cloud-off-outline'} size={24} color={colors.onPrimaryContainer} />}
        </TouchableOpacity>
      </View>

      {(unsyncedCount > 0 || lastSyncTime) && (
        <View style={[styles.syncBanner, { backgroundColor: unsyncedCount > 0 ? colors.errorContainer : colors.surfaceContainerHigh }]}>
          <MaterialCommunityIcons name={unsyncedCount > 0 ? 'cloud-upload' : 'cloud-check'} size={16} color={unsyncedCount > 0 ? colors.onErrorContainer : colors.onSurfaceVariant} />
          <StyledText style={{ ...M3Typography.body.small, color: unsyncedCount > 0 ? colors.onErrorContainer : colors.onSurfaceVariant, marginLeft: M3Spacing.xs }}>
            {unsyncedCount > 0 ? `${unsyncedCount} items pending sync` : `Last synced ${formatLastSyncTime(lastSyncTime)}`}
          </StyledText>
        </View>
      )}

      <View style={styles.filterContainer}>
        {renderFilterChip('all', 'All', 'view-list')}
        {renderFilterChip('inspection', 'Inspections', 'check-circle')}
        {renderFilterChip('check-in', 'Check-ins', 'map-marker-check')}
        {renderFilterChip('report', 'Reports', 'file-document')}
        {renderFilterChip('schedule', 'Schedule', 'calendar-check')}
        {renderFilterChip('maintenance', 'Maintenance', 'wrench')}
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.activityItem}>
            <ActivityCard 
              activity={item} 
              context={contextMap[item.id]} 
              onPress={handleActivityPress} 
            />
          </View>
        )}
        // Aggressive FlatList Performance Optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + M3Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={colors.onSurfaceVariant} />
            <StyledText style={{ ...M3Typography.title.large, color: colors.onSurface, marginTop: M3Spacing.lg }}>No activities yet</StyledText>
          </View>
        }
      />

      <M3ConfirmDialog
        visible={unarchiveConfig.visible}
        title="Unarchive"
        message={`Do you want to restore this ${unarchiveConfig.activity?.metadata?.archivedSiteId ? 'site' : 'visit'}?`}
        icon="archive-arrow-up"
        iconColor={colors.primary}
        onDismiss={() => setUnarchiveConfig({ visible: false, activity: null })}
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setUnarchiveConfig({ visible: false, activity: null }) },
          { text: 'Unarchive', style: 'default', onPress: handleUnarchive }
        ]}
      />
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: M3Spacing.lg, paddingVertical: M3Spacing.md },
  backButton: { width: 48, height: 48, borderRadius: M3Shape.full, justifyContent: 'center', alignItems: 'center' },
  syncButton: { width: 48, height: 48, borderRadius: M3Shape.full, justifyContent: 'center', alignItems: 'center' },
  syncBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: M3Spacing.lg, paddingVertical: M3Spacing.sm, marginHorizontal: M3Spacing.lg, marginBottom: M3Spacing.sm, borderRadius: M3Shape.small },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: M3Spacing.sm, paddingHorizontal: M3Spacing.lg, paddingVertical: M3Spacing.md },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: M3Spacing.md, paddingVertical: M3Spacing.sm, borderRadius: M3Shape.small },
  listContent: { paddingHorizontal: M3Spacing.lg },
  activityItem: { marginBottom: M3Spacing.sm },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: M3Spacing.xxxl * 2 },
});
