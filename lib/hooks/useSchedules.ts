/**
 * useSchedules Hook
 * 
 * Provides access to schedule/visit data with automatic sorting:
 * - Requiem visits (non-site visits) appear at the TOP
 * - Regular site visits appear below
 * - Sorted by date and time within each category
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { getSchedulesCollection, database } from '../../database';
import Schedule from '../../database/models/Schedule';

export interface UseSchedulesOptions {
  includeArchived?: boolean;
  includeCompleted?: boolean;
  userId?: string; // Filter by assigned user
  date?: string; // Filter by specific date (YYYY-MM-DD)
}

export interface UseSchedulesResult {
  schedules: Schedule[];
  requiemVisits: Schedule[];
  siteVisits: Schedule[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  // CRUD operations
  createSchedule: (data: CreateScheduleData) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<CreateScheduleData>) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<void>;
}

export interface CreateScheduleData {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  siteId?: string | null; // null for requiem visits
  assignedUserId: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  // Requiem visit fields
  isRequiem?: boolean;
  requiemReason?: string; // Required if isRequiem is true
  linkedSiteId?: string | null; // Optional contextual site reference
}

/**
 * Query schedules with automatic requiem sorting
 */
export function useSchedules(options: UseSchedulesOptions = {}): UseSchedulesResult {
  const {
    includeArchived = false,
    includeCompleted = true,
    userId,
    date,
  } = options;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const schedulesCollection = getSchedulesCollection();
    
    // Build query conditions
    const conditions: any[] = [];
    
    if (!includeArchived) {
      conditions.push(Q.where('archived', false));
    }
    
    if (!includeCompleted) {
      conditions.push(Q.where('status', Q.notEq('completed')));
    }
    
    if (userId) {
      conditions.push(Q.where('assigned_user_id', userId));
    }
    
    if (date) {
      conditions.push(Q.where('date', date));
    }

    const subscription = schedulesCollection
      .query(...conditions)
      .observe()
      .subscribe({
        next: (fetchedSchedules) => {
          // Sort: Requiem visits first, then by date/time
          const sorted = fetchedSchedules.sort((a, b) => {
            // Requiem visits always come first
            if (a.isRequiem && !b.isRequiem) return -1;
            if (!a.isRequiem && b.isRequiem) return 1;
            
            // Within same category, sort by date then time
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            return a.time.localeCompare(b.time);
          });
          
          setSchedules(sorted);
          setIsLoading(false);
        },
        error: (err) => {
          console.error('Error fetching schedules:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, [includeArchived, includeCompleted, userId, date, refreshTrigger]);

  // Separate requiem and site visits
  const requiemVisits = schedules.filter(s => s.isRequiem);
  const siteVisits = schedules.filter(s => !s.isRequiem);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  // CRUD Operations
  const createSchedule = useCallback(async (data: CreateScheduleData): Promise<Schedule> => {
    try {
      const schedulesCollection = getSchedulesCollection();
      
      // Validate requiem visit data
      if (data.isRequiem && !data.requiemReason) {
        throw new Error('Requiem reason is required for requiem visits');
      }
      
      // Generate unique ID
      const scheduleId = `schedule_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newSchedule = await database.write(async () => {
        return await schedulesCollection.create((schedule: any) => {
          schedule._raw.id = scheduleId;
          schedule.title = data.title;
          schedule.date = data.date;
          schedule.time = data.time;
          schedule.siteId = data.siteId || null;
          schedule.assignedUserId = data.assignedUserId;
          schedule.status = data.status || 'pending';
          schedule.notes = data.notes || '';
          schedule.isRequiem = data.isRequiem || false;
          schedule.requiemReason = data.requiemReason || null;
          schedule.linkedSiteId = data.linkedSiteId || null;
          schedule.archived = false;
          schedule.archivedAt = null;
          schedule.synced = false; // Mark as unsynced (user-created)
          // createdAt and updatedAt are @readonly and auto-managed by WatermelonDB
        });
      });
      
      refresh();
      return newSchedule;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }, [refresh]);

  const updateSchedule = useCallback(async (
    id: string,
    data: Partial<CreateScheduleData>
  ): Promise<Schedule> => {
    try {
      const schedulesCollection = getSchedulesCollection();
      const schedule = await schedulesCollection.find(id);
      
      if (!schedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      // Validate requiem visit data
      if (data.isRequiem && !data.requiemReason && !schedule.requiemReason) {
        throw new Error('Requiem reason is required for requiem visits');
      }
      
      const updatedSchedule = await database.write(async () => {
        return await schedule.update((s: any) => {
          if (data.title !== undefined) s.title = data.title;
          if (data.date !== undefined) s.date = data.date;
          if (data.time !== undefined) s.time = data.time;
          if (data.siteId !== undefined) s.siteId = data.siteId;
          if (data.assignedUserId !== undefined) s.assignedUserId = data.assignedUserId;
          if (data.status !== undefined) s.status = data.status;
          if (data.notes !== undefined) s.notes = data.notes;
          if (data.isRequiem !== undefined) s.isRequiem = data.isRequiem;
          if (data.requiemReason !== undefined) s.requiemReason = data.requiemReason;
          if (data.linkedSiteId !== undefined) s.linkedSiteId = data.linkedSiteId;
          s.synced = false; // Mark as unsynced after edit
          // updatedAt is @readonly and auto-managed by WatermelonDB
        });
      });
      
      refresh();
      return updatedSchedule;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }, [refresh]);

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    try {
      const schedulesCollection = getSchedulesCollection();
      const schedule = await schedulesCollection.find(id);
      
      if (!schedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      await database.write(async () => {
        await schedule.markAsDeleted(); // Soft delete
        // Or use: await schedule.destroyPermanently(); // Hard delete
      });
      
      refresh();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }, [refresh]);

  return {
    schedules,
    requiemVisits,
    siteVisits,
    totalCount: schedules.length,
    isLoading,
    error,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}

/**
 * Get upcoming schedules (today and future)
 */
export function useUpcomingSchedules(options: UseSchedulesOptions = {}): UseSchedulesResult {
  const result = useSchedules({ ...options, includeCompleted: false });
  
  // Filter to only upcoming schedules
  const today = new Date().toISOString().split('T')[0];
  const upcomingSchedules = result.schedules.filter(schedule => schedule.date >= today);
  const upcomingRequiemVisits = upcomingSchedules.filter(s => s.isRequiem);
  const upcomingSiteVisits = upcomingSchedules.filter(s => !s.isRequiem);
  
  return {
    ...result,
    schedules: upcomingSchedules,
    requiemVisits: upcomingRequiemVisits,
    siteVisits: upcomingSiteVisits,
    totalCount: upcomingSchedules.length,
  };
}

/**
 * Get schedules for today only
 */
export function useTodaySchedules(options: UseSchedulesOptions = {}): UseSchedulesResult {
  const today = new Date().toISOString().split('T')[0];
  return useSchedules({ ...options, date: today });
}
