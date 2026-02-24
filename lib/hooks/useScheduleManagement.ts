/**
 * useScheduleManagement Hook
 * 
 * Provides schedule/visit management operations (CRUD).
 * Integrates with Redux and combines static + user visits.
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addVisit,
  updateVisit,
  deleteVisit,
  selectUserVisits,
  selectUserVisitsBySite,
  selectUpcomingUserVisits,
} from '../../store/slices/scheduleSlice';
import { addActivity } from '../../store/slices/activitySlice';
import { ScheduleVisit } from '../types';
import { SCHEDULE as STATIC_SCHEDULE } from '../data/schedule';

/**
 * Hook for managing schedule/visits (create, update, delete)
 */
export const useScheduleManagement = () => {
  const dispatch = useDispatch();
  const userVisits = useSelector(selectUserVisits);

  /**
   * Get all visits (static + user-created)
   */
  const getAllVisits = useCallback((): ScheduleVisit[] => {
    const allVisits = [...STATIC_SCHEDULE, ...userVisits];
    
    // Sort by date and time
    return allVisits.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });
  }, [userVisits]);

  /**
   * Schedule a new visit
   */
  const scheduleVisit = useCallback(
    (visitData: Omit<ScheduleVisit, 'id'>, siteName?: string) => {
      dispatch(addVisit(visitData));

      // Add activity to feed
      dispatch(
        addActivity({
          type: 'schedule',
          title: 'Visit Scheduled',
          description: `${visitData.title} - ${visitData.date} at ${visitData.time}`,
          siteId: visitData.siteId,
          siteName: siteName,
          icon: 'calendar-plus',
        })
      );

      return true;
    },
    [dispatch]
  );

  /**
   * Update an existing user visit
   */
  const editVisit = useCallback(
    (visitData: ScheduleVisit, siteName?: string) => {
      // Only allow editing user-created visits
      const isUserVisit = userVisits.some((v) => v.id === visitData.id);
      if (!isUserVisit) {
        console.warn('Cannot edit static visits');
        return false;
      }

      dispatch(updateVisit(visitData));

      // Add activity to feed
      dispatch(
        addActivity({
          type: 'schedule',
          title: 'Visit Updated',
          description: `${visitData.title} - ${visitData.date} at ${visitData.time}`,
          siteId: visitData.siteId,
          siteName: siteName,
          icon: 'calendar-check',
        })
      );

      return true;
    },
    [dispatch, userVisits]
  );

  /**
   * Delete a user visit
   */
  const removeVisit = useCallback(
    (visitId: string, visitTitle?: string) => {
      // Only allow deleting user-created visits
      const isUserVisit = userVisits.some((v) => v.id === visitId);
      if (!isUserVisit) {
        console.warn('Cannot delete static visits');
        return false;
      }

      dispatch(deleteVisit(visitId));

      // Add activity to feed
      dispatch(
        addActivity({
          type: 'schedule',
          title: 'Visit Cancelled',
          description: `Cancelled: ${visitTitle || 'Unknown Visit'}`,
          icon: 'calendar-remove',
        })
      );

      return true;
    },
    [dispatch, userVisits]
  );

  /**
   * Check if a visit can be edited/deleted
   */
  const canModifyVisit = useCallback(
    (visitId: string): boolean => {
      return userVisits.some((v) => v.id === visitId);
    },
    [userVisits]
  );

  /**
   * Get visit by ID (checks both static and user visits)
   */
  const getVisitById = useCallback(
    (visitId: string): ScheduleVisit | undefined => {
      const allVisits = getAllVisits();
      return allVisits.find((v) => v.id === visitId);
    },
    [getAllVisits]
  );

  /**
   * Get visits for a specific site
   */
  const getVisitsBySite = useCallback(
    (siteId: string): ScheduleVisit[] => {
      const allVisits = getAllVisits();
      return allVisits.filter((v) => v.siteId === siteId);
    },
    [getAllVisits]
  );

  /**
   * Get upcoming visits (from today onwards)
   */
  const getUpcomingVisits = useCallback((): ScheduleVisit[] => {
    const today = new Date().toISOString().split('T')[0];
    const allVisits = getAllVisits();
    return allVisits.filter((v) => v.date >= today);
  }, [getAllVisits]);

  return {
    // Data
    userVisits,
    allVisits: getAllVisits(),
    upcomingVisits: getUpcomingVisits(),

    // Actions
    scheduleVisit,
    editVisit,
    removeVisit,
    canModifyVisit,
    getVisitById,
    getVisitsBySite,
  };
};
