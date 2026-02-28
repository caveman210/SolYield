/**
 * useScheduleManagement Hook
 * 
 * Provides schedule/visit management operations (CRUD).
 * Uses WatermelonDB as single source of truth.
 * Automatically creates activity feed entries.
 */

import { useCallback, useMemo } from 'react';
import { useSchedules, CreateScheduleData } from './useSchedules';
import { getActivitiesCollection, database } from '../../database';
import Schedule from '../../database/models/Schedule';

// Enhanced type for backward compatibility (extends lib/types ScheduleVisit)
export interface ScheduleVisit {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  siteId: string; // For requiem visits, use empty string or fallback site
  assignedUserId?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  description?: string; // Changed from 'notes' to match Schedule model
  isRequiem?: boolean;
  requiemReason?: string;
  linkedSiteId?: string;
}

/**
 * Convert WatermelonDB Schedule model to legacy ScheduleVisit type
 */
function convertToLegacyVisit(schedule: Schedule): ScheduleVisit {
  return {
    id: schedule.id,
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    siteId: schedule.siteId || '', // Use empty string for requiem visits
    assignedUserId: schedule.assignedUserId,
    status: schedule.status as any,
    description: schedule.description,
    isRequiem: schedule.isRequiem,
    requiemReason: schedule.requiemReason || undefined,
    linkedSiteId: schedule.linkedSiteId || undefined,
  };
}

/**
 * Hook for managing schedule/visits (create, update, delete)
 * Maintains backward compatibility while using WatermelonDB
 */
export const useScheduleManagement = () => {
  const { 
    schedules, 
    isLoading, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    refresh
  } = useSchedules();

  // Convert to legacy format for backward compatibility
  const allVisits = useMemo(
    () => schedules.map(convertToLegacyVisit),
    [schedules]
  );

  // Separate user-created visits (those with 'schedule_user_' prefix)
  const userVisits = useMemo(
    () => allVisits.filter(v => v.id.startsWith('schedule_user_')),
    [allVisits]
  );

  /**
   * Schedule a new visit
   */
  const scheduleVisit = useCallback(
    async (visitData: Omit<ScheduleVisit, 'id'>, siteName?: string) => {
      try {
        const newSchedule = await createSchedule({
          title: visitData.title,
          date: visitData.date,
          time: visitData.time,
          siteId: visitData.siteId || undefined, // Convert empty string to undefined
          assignedUserId: visitData.assignedUserId || 'user_arjun',
          status: visitData.status || 'pending',
          notes: visitData.description, // Map description -> notes
          isRequiem: visitData.isRequiem,
          requiemReason: visitData.requiemReason,
          linkedSiteId: visitData.linkedSiteId,
        });

        // Create activity feed entry
        await database.write(async () => {
          const activitiesCollection = getActivitiesCollection();
          await activitiesCollection.create((activity: any) => {
            activity.type = 'schedule';
            activity.title = 'Visit Scheduled';
            activity.description = `${visitData.title} - ${visitData.date} at ${visitData.time}`;
            activity.siteId = visitData.siteId || '';
            activity.siteName = siteName || '';
            activity.timestamp = Date.now();
            activity.icon = 'calendar-plus';
            activity.metadata = JSON.stringify({});
            activity.archived = false;
            activity.synced = false;
          });
        });

        refresh();
        return true;
      } catch (error) {
        console.error('Error scheduling visit:', error);
        return false;
      }
    },
    [createSchedule, refresh]
  );

  /**
   * Update an existing user visit
   */
  const editVisit = useCallback(
    async (visitData: ScheduleVisit, siteName?: string) => {
      try {
        // Only allow editing user-created visits
        const isUserVisit = visitData.id.startsWith('schedule_user_');
        if (!isUserVisit) {
          console.warn('Cannot edit built-in schedules');
          return false;
        }

        await updateSchedule(visitData.id, {
          title: visitData.title,
          date: visitData.date,
          time: visitData.time,
          siteId: visitData.siteId || undefined,
          assignedUserId: visitData.assignedUserId,
          status: visitData.status,
          notes: visitData.description, // Map description -> notes
          isRequiem: visitData.isRequiem,
          requiemReason: visitData.requiemReason,
          linkedSiteId: visitData.linkedSiteId,
        });

        // Create activity feed entry
        await database.write(async () => {
          const activitiesCollection = getActivitiesCollection();
          await activitiesCollection.create((activity: any) => {
            activity.type = 'schedule';
            activity.title = 'Visit Updated';
            activity.description = `${visitData.title} - ${visitData.date} at ${visitData.time}`;
            activity.siteId = visitData.siteId || '';
            activity.siteName = siteName || '';
            activity.timestamp = Date.now();
            activity.icon = 'calendar-check';
            activity.metadata = JSON.stringify({});
            activity.archived = false;
            activity.synced = false;
          });
        });

        refresh();
        return true;
      } catch (error) {
        console.error('Error updating visit:', error);
        return false;
      }
    },
    [updateSchedule, refresh]
  );

  /**
   * Delete a user visit
   */
  const removeVisit = useCallback(
    async (visitId: string, visitTitle?: string) => {
      try {
        // Only allow deleting user-created visits
        const isUserVisit = visitId.startsWith('schedule_user_');
        if (!isUserVisit) {
          console.warn('Cannot delete built-in schedules');
          return false;
        }

        await deleteSchedule(visitId);

        // Create activity feed entry
        await database.write(async () => {
          const activitiesCollection = getActivitiesCollection();
          await activitiesCollection.create((activity: any) => {
            activity.type = 'schedule';
            activity.title = 'Visit Cancelled';
            activity.description = `Cancelled: ${visitTitle || 'Unknown Visit'}`;
            activity.siteId = '';
            activity.siteName = '';
            activity.timestamp = Date.now();
            activity.icon = 'calendar-remove';
            activity.metadata = JSON.stringify({});
            activity.archived = false;
            activity.synced = false;
          });
        });

        refresh();
        return true;
      } catch (error) {
        console.error('Error deleting visit:', error);
        return false;
      }
    },
    [deleteSchedule, refresh]
  );

  /**
   * Check if a visit can be edited/deleted (must be user-created)
   */
  const canModifyVisit = useCallback(
    (visitId: string): boolean => {
      return visitId.startsWith('schedule_user_');
    },
    []
  );

  /**
   * Get visit by ID
   */
  const getVisitById = useCallback(
    (visitId: string): ScheduleVisit | undefined => {
      return allVisits.find((v) => v.id === visitId);
    },
    [allVisits]
  );

  /**
   * Get visits for a specific site
   */
  const getVisitsBySite = useCallback(
    (siteId: string): ScheduleVisit[] => {
      return allVisits.filter((v) => v.siteId === siteId);
    },
    [allVisits]
  );

  /**
   * Get upcoming visits (from today onwards)
   */
  const getUpcomingVisits = useCallback((): ScheduleVisit[] => {
    const today = new Date().toISOString().split('T')[0];
    return allVisits.filter((v) => v.date >= today);
  }, [allVisits]);

  return {
    // Data
    userVisits,
    allVisits,
    upcomingVisits: getUpcomingVisits(),
    isLoading,

    // Actions
    scheduleVisit,
    editVisit,
    removeVisit,
    canModifyVisit,
    getVisitById,
    getVisitsBySite,
  };
};
