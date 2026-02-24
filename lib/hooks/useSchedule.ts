/**
 * useSchedule Hook
 * 
 * Provides visit scheduling operations and queries.
 * Separates business logic from UI components.
 */

import { useCallback, useMemo } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { schedule as staticSchedule } from '../data/schedule';
import { Visit } from '../types';
import { useSites } from './useSites';

/**
 * Hook for managing visit schedule
 */
export const useSchedule = () => {
  const { getSiteById } = useSites();

  // Convert static schedule to typed array with site names
  const visits = useMemo(() => {
    return staticSchedule.map((visit) => {
      const site = getSiteById(visit.siteId);
      return {
        ...visit,
        siteName: site?.name || 'Unknown Site',
        location: site?.location,
      } as Visit;
    });
  }, [getSiteById]);

  /**
   * Get a specific visit by ID
   */
  const getVisitById = useCallback(
    (visitId: string): Visit | undefined => {
      return visits.find((visit) => visit.id === visitId);
    },
    [visits]
  );

  /**
   * Get visits by site ID
   */
  const getVisitsBySite = useCallback(
    (siteId: string): Visit[] => {
      return visits.filter((visit) => visit.siteId === siteId);
    },
    [visits]
  );

  /**
   * Get today's visits
   */
  const getTodaysVisits = useCallback((): Visit[] => {
    const today = new Date().toISOString().split('T')[0];
    return visits.filter((visit) => visit.date === today);
  }, [visits]);

  /**
   * Get upcoming visits (future dates)
   */
  const getUpcomingVisits = useCallback((): Visit[] => {
    const today = new Date().toISOString().split('T')[0];
    return visits
      .filter((visit) => visit.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [visits]);

  /**
   * Get past visits
   */
  const getPastVisits = useCallback((): Visit[] => {
    const today = new Date().toISOString().split('T')[0];
    return visits
      .filter((visit) => visit.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [visits]);

  /**
   * Get visits within a date range
   */
  const getVisitsInRange = useCallback(
    (startDate: string, endDate: string): Visit[] => {
      return visits.filter(
        (visit) => visit.date >= startDate && visit.date <= endDate
      );
    },
    [visits]
  );

  /**
   * Group visits by date
   */
  const getVisitsGroupedByDate = useCallback((): Record<string, Visit[]> => {
    return visits.reduce((grouped, visit) => {
      if (!grouped[visit.date]) {
        grouped[visit.date] = [];
      }
      grouped[visit.date].push(visit);
      return grouped;
    }, {} as Record<string, Visit[]>);
  }, [visits]);

  /**
   * Statistics about visits
   */
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysVisits = visits.filter((visit) => visit.date === today);
    const upcomingVisits = visits.filter((visit) => visit.date > today);
    const pastVisits = visits.filter((visit) => visit.date < today);

    return {
      total: visits.length,
      today: todaysVisits.length,
      upcoming: upcomingVisits.length,
      past: pastVisits.length,
    };
  }, [visits]);

  return {
    // Data
    visits,
    stats,

    // Queries
    getVisitById,
    getVisitsBySite,
    getTodaysVisits,
    getUpcomingVisits,
    getPastVisits,
    getVisitsInRange,
    getVisitsGroupedByDate,
  };
};

/**
 * Hook for calendar integration
 */
export const useCalendarSync = () => {
  const { visits } = useSchedule();

  /**
   * Request calendar permissions
   */
  const requestCalendarPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Calendar access is needed to sync your visits.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      Alert.alert('Error', 'Failed to request calendar permissions.');
      return false;
    }
  }, []);

  /**
   * Get or create the app's calendar
   */
  const getAppCalendar = useCallback(async (): Promise<string | null> => {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Look for existing SolYield calendar
      const appCalendar = calendars.find((cal) => cal.title === 'SolYield Visits');
      if (appCalendar) {
        return appCalendar.id;
      }

      // Create new calendar
      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.source.name === 'Default'
      );

      if (!defaultCalendar) {
        throw new Error('No writable calendar found');
      }

      const newCalendarId = await Calendar.createCalendarAsync({
        title: 'SolYield Visits',
        color: '#F97316',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendar.source.id,
        source: defaultCalendar.source,
        name: 'solyield-visits',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      return newCalendarId;
    } catch (error) {
      console.error('Error getting/creating calendar:', error);
      return null;
    }
  }, []);

  /**
   * Sync a single visit to calendar
   */
  const syncVisitToCalendar = useCallback(
    async (visit: Visit): Promise<boolean> => {
      try {
        const hasPermission = await requestCalendarPermissions();
        if (!hasPermission) return false;

        const calendarId = await getAppCalendar();
        if (!calendarId) {
          Alert.alert('Error', 'Could not access calendar.');
          return false;
        }

        // Parse date and time
        const [year, month, day] = visit.date.split('-').map(Number);
        const timeMatch = visit.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        
        if (!timeMatch) {
          Alert.alert('Error', 'Invalid time format.');
          return false;
        }

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const isPM = timeMatch[3].toUpperCase() === 'PM';

        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

        await Calendar.createEventAsync(calendarId, {
          title: `${visit.title} - ${visit.siteName}`,
          startDate,
          endDate,
          location: visit.siteName,
          notes: `Site Visit: ${visit.title}\nSite: ${visit.siteName}\nID: ${visit.id}`,
          timeZone: 'Asia/Kolkata',
        });

        return true;
      } catch (error) {
        console.error('Error syncing visit to calendar:', error);
        Alert.alert('Error', 'Failed to sync visit to calendar.');
        return false;
      }
    },
    [requestCalendarPermissions, getAppCalendar]
  );

  /**
   * Sync all visits to calendar
   */
  const syncAllVisitsToCalendar = useCallback(async (): Promise<number> => {
    try {
      const hasPermission = await requestCalendarPermissions();
      if (!hasPermission) return 0;

      let successCount = 0;
      for (const visit of visits) {
        const success = await syncVisitToCalendar(visit);
        if (success) successCount++;
      }

      Alert.alert(
        'Sync Complete',
        `Successfully synced ${successCount} of ${visits.length} visits to your calendar.`
      );

      return successCount;
    } catch (error) {
      console.error('Error syncing all visits:', error);
      Alert.alert('Error', 'Failed to sync visits to calendar.');
      return 0;
    }
  }, [visits, syncVisitToCalendar, requestCalendarPermissions]);

  return {
    syncVisitToCalendar,
    syncAllVisitsToCalendar,
    requestCalendarPermissions,
  };
};

/**
 * Format date for display
 */
export const formatVisitDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = date.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
