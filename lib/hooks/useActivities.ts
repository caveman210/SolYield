/**
 * useActivities Hook
 * 
 * Provides activity feed management operations.
 * Separates business logic from UI components.
 */

import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addActivity,
  markActivitySynced,
  clearActivities,
  removeActivity,
  selectAllActivities,
  selectUnsyncedActivities,
} from '../../store/slices/activitySlice';
import { Activity } from '../types';

/**
 * Hook for managing activities (activity feed)
 */
export const useActivities = () => {
  const dispatch = useDispatch();
  const activities = useSelector(selectAllActivities);
  const unsyncedActivities = useSelector(selectUnsyncedActivities);

  /**
   * Add a new activity to the feed
   */
  const addNewActivity = useCallback(
    (activity: Omit<Activity, 'id' | 'timestamp' | 'synced'>) => {
      dispatch(addActivity(activity));
    },
    [dispatch]
  );

  /**
   * Mark an activity as synced
   */
  const markAsSynced = useCallback(
    (activityId: string) => {
      dispatch(markActivitySynced(activityId));
    },
    [dispatch]
  );

  /**
   * Remove an activity from the feed
   */
  const deleteActivity = useCallback(
    (activityId: string) => {
      dispatch(removeActivity(activityId));
    },
    [dispatch]
  );

  /**
   * Clear all activities
   */
  const clearAll = useCallback(() => {
    dispatch(clearActivities());
  }, [dispatch]);

  /**
   * Get activities filtered by site ID
   */
  const getActivitiesBySite = useCallback(
    (siteId: string) => {
      return activities.filter((activity) => activity.siteId === siteId);
    },
    [activities]
  );

  /**
   * Get recent activities (limited)
   */
  const getRecentActivities = useCallback(
    (limit: number = 5) => {
      return activities.slice(0, limit);
    },
    [activities]
  );

  /**
   * Get activities by type
   */
  const getActivitiesByType = useCallback(
    (type: Activity['type']) => {
      return activities.filter((activity) => activity.type === type);
    },
    [activities]
  );

  /**
   * Stats about activities
   */
  const stats = useMemo(() => {
    return {
      total: activities.length,
      unsynced: unsyncedActivities.length,
      synced: activities.length - unsyncedActivities.length,
      byType: {
        inspection: activities.filter((a) => a.type === 'inspection').length,
        checkin: activities.filter((a) => a.type === 'checkin').length,
        report: activities.filter((a) => a.type === 'report').length,
        alert: activities.filter((a) => a.type === 'alert').length,
      },
    };
  }, [activities, unsyncedActivities]);

  return {
    // Data
    activities,
    unsyncedActivities,
    stats,

    // Actions
    addActivity: addNewActivity,
    markAsSynced,
    deleteActivity,
    clearAll,

    // Queries
    getActivitiesBySite,
    getRecentActivities,
    getActivitiesByType,
  };
};

/**
 * Hook for activity filtering and sorting
 */
export const useActivityFilters = () => {
  const activities = useSelector(selectAllActivities);

  /**
   * Filter activities by date range
   */
  const filterByDateRange = useCallback(
    (startDate: number, endDate: number) => {
      return activities.filter(
        (activity) => activity.timestamp >= startDate && activity.timestamp <= endDate
      );
    },
    [activities]
  );

  /**
   * Filter activities by search query (title or description)
   */
  const filterBySearch = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return activities.filter(
        (activity) =>
          activity.title.toLowerCase().includes(lowerQuery) ||
          activity.description?.toLowerCase().includes(lowerQuery)
      );
    },
    [activities]
  );

  /**
   * Sort activities by different criteria
   */
  const sortActivities = useCallback(
    (sortBy: 'timestamp' | 'title' | 'type', order: 'asc' | 'desc' = 'desc') => {
      const sorted = [...activities].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'timestamp':
            comparison = a.timestamp - b.timestamp;
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
        }

        return order === 'asc' ? comparison : -comparison;
      });

      return sorted;
    },
    [activities]
  );

  return {
    filterByDateRange,
    filterBySearch,
    sortActivities,
  };
};
