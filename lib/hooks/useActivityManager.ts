/**
 * useActivityManager Hook
 * 
 * Provides activity management operations (CRUD) using WatermelonDB.
 * Migrated from Redux to WatermelonDB as single source of truth.
 */

import { useCallback, useMemo } from 'react';
import { Activity, ActivityType } from '../types';
import { useDBActivities, useDBRecentActivities, useDBSiteActivities } from './useDBActivities';
import { getActivitiesCollection, database } from '../../database';
import {
  getMostRecentActivities,
  filterActivitiesByType,
  filterActivitiesBySite,
  getUnsyncedActivities,
} from '../utils/activityUtils';

/**
 * Hook for accessing all activities from WatermelonDB
 * Provides read-only access to activity state
 */
export function useActivities() {
  const { activities, isLoading } = useDBActivities();

  return {
    activities,
    isLoading,
  };
}

/**
 * Hook for accessing recent activities (limited count)
 */
export function useRecentActivities(limit: number = 5) {
  const { activities, isLoading } = useDBRecentActivities(limit);

  return {
    activities,
    isLoading,
  };
}

/**
 * Hook for filtering activities by type
 */
export function useActivitiesByType(type: ActivityType | 'all') {
  const { activities, isLoading } = useDBActivities();
  const filteredActivities = useMemo(
    () => filterActivitiesByType(activities, type),
    [activities, type]
  );

  return {
    activities: filteredActivities,
    isLoading,
  };
}

/**
 * Hook for filtering activities by site
 */
export function useActivitiesBySite(siteId: string) {
  const { activities, isLoading } = useDBSiteActivities(siteId);

  return {
    activities,
    isLoading,
  };
}

/**
 * Hook for managing activity actions (CRUD operations)
 * Separates business logic from UI components
 */
export function useActivityActions() {
  const createActivity = useCallback(
    async (activityData: Omit<Activity, 'id' | 'timestamp' | 'synced'>) => {
      try {
        await database.write(async () => {
          const activitiesCollection = getActivitiesCollection();
          await activitiesCollection.create((activity: any) => {
            activity.type = activityData.type;
            activity.title = activityData.title;
            activity.description = activityData.description || '';
            activity.siteId = activityData.siteId || '';
            activity.siteName = activityData.siteName || '';
            activity.timestamp = Date.now();
            activity.icon = activityData.icon;
            activity.metadata = JSON.stringify(activityData.metadata || {});
            activity.archived = false;
            activity.synced = false;
          });
        });
      } catch (error) {
        console.error('Error creating activity:', error);
        throw error;
      }
    },
    []
  );

  const syncActivity = useCallback(
    async (activityId: string) => {
      try {
        const activitiesCollection = getActivitiesCollection();
        const activity = await activitiesCollection.find(activityId);
        
        if (!activity) {
          console.warn(`Activity ${activityId} not found`);
          return;
        }

        await database.write(async () => {
          await activity.markAsSynced();
        });
      } catch (error) {
        console.error('Error syncing activity:', error);
        throw error;
      }
    },
    []
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      try {
        const activitiesCollection = getActivitiesCollection();
        const activity = await activitiesCollection.find(activityId);
        
        if (!activity) {
          console.warn(`Activity ${activityId} not found`);
          return;
        }

        await database.write(async () => {
          await activity.markAsDeleted(); // Soft delete
        });
      } catch (error) {
        console.error('Error deleting activity:', error);
        throw error;
      }
    },
    []
  );

  const clearAll = useCallback(async () => {
    try {
      const activitiesCollection = getActivitiesCollection();
      const allActivities = await activitiesCollection.query().fetch();

      await database.write(async () => {
        // Batch delete all activities
        await Promise.all(
          allActivities.map(activity => activity.markAsDeleted())
        );
      });
    } catch (error) {
      console.error('Error clearing activities:', error);
      throw error;
    }
  }, []);

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
  const { activities } = useDBActivities();
  const unsyncedActivities = useMemo(
    () => getUnsyncedActivities(activities),
    [activities]
  );

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
