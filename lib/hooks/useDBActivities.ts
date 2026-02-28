import { useState, useEffect } from 'react';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import ActivityModel from '../../database/models/Activity';
import { getActivitiesCollection } from '../../database';
import { Activity } from '../types'; // Legacy type for compatibility

export interface UseActivitiesResult {
  activities: Activity[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  inspectionCount: number;
  reportCount: number;
  checkInCount: number;
}

/**
 * Convert WatermelonDB Activity model to legacy Activity type.
 * This maintains compatibility with existing UI components.
 */
function convertActivityModel(model: ActivityModel): Activity {
  return {
    id: model.id,
    type: model.type as 'inspection' | 'report' | 'check-in',
    title: model.title,
    description: model.description,
    siteId: model.siteId,
    siteName: model.siteName,
    timestamp: model.timestamp,
    icon: model.icon,
    metadata: model.metadata ? JSON.parse(model.metadata) : undefined,
    synced: model.synced,
  };
}

/**
 * Hook to query all activities from WatermelonDB.
 * Returns activities sorted by timestamp (newest first).
 * By default, only returns non-archived activities.
 */
export function useDBActivities(includeArchived: boolean = false): UseActivitiesResult {
  const database = useDatabase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const activitiesCollection = getActivitiesCollection();
        
        // Filter out archived activities unless explicitly requested
        const query = includeArchived
          ? activitiesCollection.query(Q.sortBy('timestamp', Q.desc))
          : activitiesCollection.query(
              Q.where('archived', false),
              Q.sortBy('timestamp', Q.desc)
            );
        
        const allActivities = await query.fetch();

        if (mounted) {
          const converted = allActivities.map(convertActivityModel);
          setActivities(converted);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading activities:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      mounted = false;
    };
  }, [database, includeArchived]);

  // Calculate summary counts
  const inspectionCount = activities.filter((a) => a.type === 'inspection').length;
  const reportCount = activities.filter((a) => a.type === 'report').length;
  const checkInCount = activities.filter((a) => a.type === 'check-in').length;
  const totalCount = activities.length;

  return {
    activities,
    isLoading,
    error,
    totalCount,
    inspectionCount,
    reportCount,
    checkInCount,
  };
}

/**
 * Hook to query recent activities (limited count) from WatermelonDB.
 */
export function useDBRecentActivities(limit: number = 5): UseActivitiesResult {
  const database = useDatabase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const activitiesCollection = getActivitiesCollection();
        const recentActivities = await activitiesCollection
          .query(
            Q.where('archived', false),
            Q.sortBy('timestamp', Q.desc),
            Q.take(limit)
          )
          .fetch();

        if (mounted) {
          const converted = recentActivities.map(convertActivityModel);
          setActivities(converted);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading recent activities:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      mounted = false;
    };
  }, [database, limit]);

  // Calculate summary counts
  const inspectionCount = activities.filter((a) => a.type === 'inspection').length;
  const reportCount = activities.filter((a) => a.type === 'report').length;
  const checkInCount = activities.filter((a) => a.type === 'check-in').length;
  const totalCount = activities.length;

  return {
    activities,
    isLoading,
    error,
    totalCount,
    inspectionCount,
    reportCount,
    checkInCount,
  };
}

/**
 * Hook to query activities for a specific site from WatermelonDB.
 */
export function useDBSiteActivities(siteId: string | null): UseActivitiesResult {
  const database = useDatabase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadActivities = async () => {
      if (!siteId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const activitiesCollection = getActivitiesCollection();
        const siteActivities = await activitiesCollection
          .query(Q.where('site_id', siteId), Q.sortBy('timestamp', Q.desc))
          .fetch();

        if (mounted) {
          const converted = siteActivities.map(convertActivityModel);
          setActivities(converted);
          setIsLoading(false);
        }
      } catch (err) {
        console.error(`Error loading activities for site ${siteId}:`, err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      mounted = false;
    };
  }, [database, siteId]);

  // Calculate summary counts
  const inspectionCount = activities.filter((a) => a.type === 'inspection').length;
  const reportCount = activities.filter((a) => a.type === 'report').length;
  const checkInCount = activities.filter((a) => a.type === 'check-in').length;
  const totalCount = activities.length;

  return {
    activities,
    isLoading,
    error,
    totalCount,
    inspectionCount,
    reportCount,
    checkInCount,
  };
}
