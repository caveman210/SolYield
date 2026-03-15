/**
 * useScheduleManagement Hook
 * * Provides schedule/visit management operations (CRUD).
 * Uses WatermelonDB as single source of truth.
 * Automatically creates activity feed entries.
 */

import { useCallback, useMemo } from 'react';
import { useSchedules, CreateScheduleData } from './useSchedules';
import { getActivitiesCollection, database } from '../../database';
import Schedule from '../../database/models/Schedule';

export interface ScheduleVisit {
  id: string;
  title: string;
  date: string;
  time: string;
  siteId: string;
  assignedUserId?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  description?: string;
  isRequiem?: boolean;
  requiemReason?: string;
  linkedSiteId?: string;
}

function convertToLegacyVisit(schedule: Schedule): ScheduleVisit {
  return {
    id: schedule.id,
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    siteId: schedule.siteId || '',
    assignedUserId: schedule.assignedUserId,
    status: schedule.status as any,
    description: schedule.notes || schedule.description,
    isRequiem: schedule.isRequiem,
    requiemReason: schedule.requiemReason || undefined,
    linkedSiteId: schedule.linkedSiteId || undefined,
  };
}

export const useScheduleManagement = () => {
  const { 
    schedules, 
    isLoading, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    refresh
  } = useSchedules();

  const allVisits = useMemo(
    () => schedules.map(convertToLegacyVisit),
    [schedules]
  );

  const userVisits = useMemo(
    () => allVisits.filter(v => v.id.startsWith('schedule_user_')),
    [allVisits]
  );

  const scheduleVisit = useCallback(
    async (visitData: Omit<ScheduleVisit, 'id'>, siteName?: string) => {
      try {
        await createSchedule({
          title: visitData.title,
          date: visitData.date,
          time: visitData.time,
          siteId: visitData.siteId || undefined,
          assignedUserId: visitData.assignedUserId || 'user_arjun',
          status: visitData.status || 'pending',
          notes: visitData.description,
          isRequiem: visitData.isRequiem,
          requiemReason: visitData.requiemReason,
          linkedSiteId: visitData.linkedSiteId,
        });

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

  const editVisit = useCallback(
    async (visitData: ScheduleVisit, siteName?: string) => {
      try {
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
          notes: visitData.description,
          isRequiem: visitData.isRequiem,
          requiemReason: visitData.requiemReason,
          linkedSiteId: visitData.linkedSiteId,
        });

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

  const removeVisit = useCallback(
    async (visitId: string, visitTitle?: string) => {
      try {
        const isUserVisit = visitId.startsWith('schedule_user_');
        if (!isUserVisit) {
          console.warn('Cannot delete built-in schedules');
          return false;
        }

        await deleteSchedule(visitId);

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

  const checkInVisit = useCallback(async (visitId: string) => {
    try {
      const schedulesCollection = database.collections.get('schedules');
      const visit = await schedulesCollection.find(visitId);
      
      await database.write(async () => {
        await visit.update((v: any) => {
          v.status = 'in-progress';
          v.checked_in_at = new Date().toISOString(); 
        });
        
        const activitiesCollection = getActivitiesCollection();
        await activitiesCollection.create((activity: any) => {
          activity.type = 'check-in';
          activity.title = 'Visit Started';
          activity.description = `Checked in to work assignment`;
          activity.siteId = (visit as any).siteId || '';
          activity.timestamp = Date.now();
          activity.icon = 'map-marker-check';
          activity.archived = false;
          activity.synced = false;
        });
      });
      refresh();
      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      return false;
    }
  }, [refresh]);

  const completeVisit = useCallback(async (visitId: string) => {
    try {
      const schedulesCollection = database.collections.get('schedules');
      const visit = await schedulesCollection.find(visitId);
      
      await database.write(async () => {
        await visit.update((v: any) => {
          v.status = 'completed';
          v.checked_out_at = new Date().toISOString();
        });
        
        const activitiesCollection = getActivitiesCollection();
        await activitiesCollection.create((activity: any) => {
          activity.type = 'inspection';
          activity.title = 'Visit Completed';
          activity.description = `Marked visit as completed`;
          activity.siteId = (visit as any).siteId || '';
          activity.timestamp = Date.now();
          activity.icon = 'check-circle-outline';
          activity.archived = false;
          activity.synced = false;
        });
      });
      refresh();
      return true;
    } catch (error) {
      console.error('Error completing visit:', error);
      return false;
    }
  }, [refresh]);

  const archiveVisit = useCallback(async (visitId: string, reason: string) => {
    try {
      const schedulesCollection = database.collections.get('schedules');
      const visit = await schedulesCollection.find(visitId);
      
      await database.write(async () => {
        await visit.update((v: any) => {
          v.archived = true;
          v.notes = v.notes ? `${v.notes}\n\nArchive Reason: ${reason}` : `Archive Reason: ${reason}`;
        });
        
        const activitiesCollection = getActivitiesCollection();
        await activitiesCollection.create((activity: any) => {
          activity.type = 'schedule';
          activity.title = 'Visit Archived';
          activity.description = `Reason: ${reason}`;
          activity.siteId = (visit as any).siteId || '';
          activity.timestamp = Date.now();
          activity.icon = 'archive';
          activity.archived = false;
          activity.synced = false;
          // STORE THE VISIT ID TO ENABLE UNARCHIVING
          activity.metadata = JSON.stringify({ archivedVisitId: visitId });
        });
      });
      refresh();
      return true;
    } catch (error) {
      console.error('Error archiving visit:', error);
      return false;
    }
  }, [refresh]);

  const unarchiveVisit = useCallback(async (visitId: string) => {
    try {
      const schedulesCollection = database.collections.get('schedules');
      const visit = await schedulesCollection.find(visitId);
      
      await database.write(async () => {
        await visit.update((v: any) => {
          v.archived = false;
          v.notes = v.notes ? `${v.notes}\n\n[Unarchived]` : `[Unarchived]`;
        });
        
        const activitiesCollection = getActivitiesCollection();
        await activitiesCollection.create((activity: any) => {
          activity.type = 'schedule';
          activity.title = 'Visit Unarchived';
          activity.description = `Restored visit to active schedule`;
          activity.siteId = (visit as any).siteId || '';
          activity.timestamp = Date.now();
          activity.icon = 'calendar-check';
          activity.archived = false;
          activity.synced = false;
        });
      });
      refresh();
      return true;
    } catch (error) {
      console.error('Error unarchiving visit:', error);
      return false;
    }
  }, [refresh]);

  const canModifyVisit = useCallback(
    (visitId: string): boolean => visitId.startsWith('schedule_user_'),
    []
  );

  const getVisitById = useCallback(
    (visitId: string): ScheduleVisit | undefined => allVisits.find((v) => v.id === visitId),
    [allVisits]
  );

  const getVisitsBySite = useCallback(
    (siteId: string): ScheduleVisit[] => allVisits.filter((v) => v.siteId === siteId),
    [allVisits]
  );

  const getUpcomingVisits = useCallback((): ScheduleVisit[] => {
    const today = new Date().toISOString().split('T')[0];
    return allVisits.filter((v) => v.date >= today);
  }, [allVisits]);

  return {
    userVisits,
    allVisits,
    upcomingVisits: getUpcomingVisits(),
    isLoading,
    scheduleVisit,
    editVisit,
    removeVisit,
    checkInVisit,
    completeVisit,
    archiveVisit,
    unarchiveVisit,
    canModifyVisit,
    getVisitById,
    getVisitsBySite,
  };
};
