import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '../../store';
import { Activity, ActivityType } from '../types';
import {
  addActivity,
  markActivitySynced,
  clearActivities,
  removeActivity,
} from '../../store/slices/activitySlice';
import {
  getMostRecentActivities,
  filterActivitiesByType,
  filterActivitiesBySite,
  getUnsyncedActivities,
} from '../utils/activityUtils';

/**
 * Hook for accessing all activities from Redux store
 * Provides read-only access to activity state
 */
export function useActivities() {
  const activities = useSelector((state: RootState) => state.activity.activities);
  const isLoading = useSelector((state: RootState) => state.activity.isLoading);

  return {
    activities,
    isLoading,
  };
}

/**
 * Hook for accessing recent activities (limited count)
 */
export function useRecentActivities(limit: number = 5) {
  const { activities, isLoading } = useActivities();
  const recentActivities = getMostRecentActivities(activities, limit);

  return {
    activities: recentActivities,
    isLoading,
  };
}

/**
 * Hook for filtering activities by type
 */
export function useActivitiesByType(type: ActivityType | 'all') {
  const { activities, isLoading } = useActivities();
  const filteredActivities = filterActivitiesByType(activities, type);

  return {
    activities: filteredActivities,
    isLoading,
  };
}

/**
 * Hook for filtering activities by site
 */
export function useActivitiesBySite(siteId: string) {
  const { activities, isLoading } = useActivities();
  const siteActivities = filterActivitiesBySite(activities, siteId);

  return {
    activities: siteActivities,
    isLoading,
  };
}

/**
 * Hook for managing activity actions (CRUD operations)
 * Separates business logic from UI components
 */
export function useActivityActions() {
  const dispatch = useDispatch();

  const createActivity = useCallback(
    (activityData: Omit<Activity, 'id' | 'timestamp' | 'synced'>) => {
      dispatch(addActivity(activityData));
    },
    [dispatch]
  );

  const syncActivity = useCallback(
    (activityId: string) => {
      dispatch(markActivitySynced(activityId));
    },
    [dispatch]
  );

  const deleteActivity = useCallback(
    (activityId: string) => {
      dispatch(removeActivity(activityId));
    },
    [dispatch]
  );

  const clearAll = useCallback(() => {
    dispatch(clearActivities());
  }, [dispatch]);

  return {
    createActivity,
    syncActivity,
    deleteActivity,
    clearAll,
  };
}

/**
 * Hook for getting unsynced activities (for offline sync)
 */
export function useUnsyncedActivities() {
  const { activities } = useActivities();
  const unsyncedActivities = getUnsyncedActivities(activities);

  return {
    unsyncedActivities,
    count: unsyncedActivities.length,
    hasUnsynced: unsyncedActivities.length > 0,
  };
}

/**
 * Combined hook providing all activity functionality
 * Use this when you need both read and write operations
 */
export function useActivityManager() {
  const { activities, isLoading } = useActivities();
  const actions = useActivityActions();
  const { unsyncedActivities, count: unsyncedCount } = useUnsyncedActivities();

  return {
    // State
    activities,
    isLoading,
    unsyncedActivities,
    unsyncedCount,

    // Actions
    ...actions,
  };
}
