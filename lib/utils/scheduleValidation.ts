/**
 * Schedule Conflict Validation Utilities
 * 
 * Prevents double-booking of technicians and ensures proper time buffers.
 */

import { getSchedulesCollection } from '../../database';
import { Q } from '@nozbe/watermelondb';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

export interface ScheduleConflict {
  hasConflict: boolean;
  conflictingSchedule?: {
    id: string;
    siteId?: string; // Optional for requiem visits
    title: string;
    startTime: Date;
    endTime: Date;
  };
  reason?: string;
}

const BUFFER_MINUTES = 5; // 5-minute buffer between visits

/**
 * Parse time string (HH:MM AM/PM) and date to a Date object
 */
export function parseDateTime(date: string, time: string): Date {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const dateObj = new Date(date);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
}

/**
 * Format Date object to time string (HH:MM AM/PM)
 */
export function formatTimeString(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate end time assuming a default duration (1.5 hours)
 */
export function calculateEndTime(startTime: Date, durationMinutes: number = 90): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
}

/**
 * Add buffer time to a date
 */
export function addBuffer(time: Date, bufferMinutes: number = BUFFER_MINUTES): Date {
  const bufferedTime = new Date(time);
  bufferedTime.setMinutes(bufferedTime.getMinutes() + bufferMinutes);
  return bufferedTime;
}

/**
 * Check if two time slots overlap
 */
export function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot, includeBuffer: boolean = true): boolean {
  const buffer = includeBuffer ? BUFFER_MINUTES : 0;
  
  const slot1End = addBuffer(slot1.endTime, buffer);
  const slot2End = addBuffer(slot2.endTime, buffer);
  
  return (
    (slot1.startTime >= slot2.startTime && slot1.startTime < slot2End) ||
    (slot2.startTime >= slot1.startTime && slot2.startTime < slot1End)
  );
}

/**
 * Validate schedule for conflicts
 * 
 * Checks:
 * 1. No overlapping visits for the same user on the same day
 * 2. Minimum 5-minute buffer between consecutive visits
 * 
 * @param userId - User ID to check conflicts for
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM AM/PM format
 * @param durationMinutes - Expected duration of the visit
 * @param excludeScheduleId - Schedule ID to exclude (for updates)
 */
export async function validateSchedule(
  userId: string,
  date: string,
  time: string,
  durationMinutes: number = 90,
  excludeScheduleId?: string
): Promise<ScheduleConflict> {
  try {
    const schedulesCollection = getSchedulesCollection();
    
    // Get all schedules for this user on this date
    const query = excludeScheduleId
      ? schedulesCollection.query(
          Q.where('assigned_user_id', userId),
          Q.where('date', date),
          Q.where('archived', false),
          Q.where('id', Q.notEq(excludeScheduleId))
        )
      : schedulesCollection.query(
          Q.where('assigned_user_id', userId),
          Q.where('date', date),
          Q.where('archived', false)
        );
    
    const existingSchedules = await query.fetch();
    
    // Parse new schedule time slot
    const newStartTime = parseDateTime(date, time);
    const newEndTime = calculateEndTime(newStartTime, durationMinutes);
    const newSlot: TimeSlot = { startTime: newStartTime, endTime: newEndTime };
    
    // Check for conflicts
    for (const schedule of existingSchedules) {
      const existingStartTime = parseDateTime(schedule.date, schedule.time);
      const existingEndTime = calculateEndTime(existingStartTime, durationMinutes);
      const existingSlot: TimeSlot = { startTime: existingStartTime, endTime: existingEndTime };
      
      if (timeSlotsOverlap(newSlot, existingSlot, true)) {
        return {
          hasConflict: true,
          conflictingSchedule: {
            id: schedule.id,
            siteId: schedule.siteId,
            title: schedule.title,
            startTime: existingStartTime,
            endTime: existingEndTime,
          },
          reason: `Conflicts with "${schedule.title}" (${schedule.time} - ${formatTimeString(existingEndTime)}). ` +
                  `A ${BUFFER_MINUTES}-minute buffer is required between visits.`,
        };
      }
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.error('Error validating schedule:', error);
    throw error;
  }
}

/**
 * Get all schedules for a user on a specific date
 */
export async function getUserSchedulesForDate(userId: string, date: string) {
  const schedulesCollection = getSchedulesCollection();
  
  const schedules = await schedulesCollection
    .query(
      Q.where('assigned_user_id', userId),
      Q.where('date', date),
      Q.where('archived', false),
      Q.sortBy('time', Q.asc)
    )
    .fetch();
  
  return schedules.map(schedule => ({
    id: schedule.id,
    siteId: schedule.siteId,
    title: schedule.title,
    startTime: parseDateTime(schedule.date, schedule.time),
    endTime: calculateEndTime(parseDateTime(schedule.date, schedule.time)),
  }));
}

/**
 * Suggest next available time slot after a given time
 */
export function suggestNextAvailableSlot(
  lastEndTime: Date,
  durationMinutes: number = 90
): { time: string; endTime: string } {
  // Add buffer + travel time (assume 30 minutes average)
  const nextAvailable = new Date(lastEndTime);
  nextAvailable.setMinutes(nextAvailable.getMinutes() + BUFFER_MINUTES + 30);
  
  const suggestedEndTime = calculateEndTime(nextAvailable, durationMinutes);
  
  return {
    time: formatTimeString(nextAvailable),
    endTime: formatTimeString(suggestedEndTime),
  };
}
