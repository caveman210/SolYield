/**
 * Schedule Management Redux Slice
 * 
 * Manages user-created scheduled visits alongside static schedule data.
 * Supports CRUD operations with AsyncStorage persistence.
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ScheduleVisit } from '../../lib/types';

interface ScheduleState {
  userVisits: ScheduleVisit[]; // User-created visits
  isLoading: boolean;
}

const initialState: ScheduleState = {
  userVisits: [],
  isLoading: false,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    /**
     * Add a new scheduled visit
     */
    addVisit: (state, action: PayloadAction<Omit<ScheduleVisit, 'id'>>) => {
      const newVisit: ScheduleVisit = {
        ...action.payload,
        id: `visit_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      state.userVisits.push(newVisit);
      
      // Sort visits by date and time
      state.userVisits.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      });
    },

    /**
     * Update an existing visit
     */
    updateVisit: (state, action: PayloadAction<ScheduleVisit>) => {
      const index = state.userVisits.findIndex((v) => v.id === action.payload.id);
      if (index !== -1) {
        state.userVisits[index] = action.payload;
        
        // Re-sort after update
        state.userVisits.sort((a, b) => {
          const dateComparison = a.date.localeCompare(b.date);
          if (dateComparison !== 0) return dateComparison;
          return a.time.localeCompare(b.time);
        });
      }
    },

    /**
     * Delete a visit
     */
    deleteVisit: (state, action: PayloadAction<string>) => {
      state.userVisits = state.userVisits.filter((v) => v.id !== action.payload);
    },

    /**
     * Load user visits from AsyncStorage
     */
    loadUserVisits: (state, action: PayloadAction<ScheduleVisit[]>) => {
      state.userVisits = action.payload;
      
      // Sort on load
      state.userVisits.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      });
    },

    /**
     * Clear all user visits
     */
    clearUserVisits: (state) => {
      state.userVisits = [];
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  addVisit,
  updateVisit,
  deleteVisit,
  loadUserVisits,
  clearUserVisits,
  setLoading,
} = scheduleSlice.actions;

// Selectors
export const selectUserVisits = (state: { schedule: ScheduleState }) => state.schedule.userVisits;
export const selectIsLoading = (state: { schedule: ScheduleState }) => state.schedule.isLoading;

/**
 * Get a user visit by ID
 */
export const selectUserVisitById = createSelector(
  [selectUserVisits, (_state: { schedule: ScheduleState }, visitId: string) => visitId],
  (visits, visitId) => visits.find((v) => v.id === visitId)
);

/**
 * Get user visits for a specific site
 */
export const selectUserVisitsBySite = createSelector(
  [selectUserVisits, (_state: { schedule: ScheduleState }, siteId: string) => siteId],
  (visits, siteId) => visits.filter((v) => v.siteId === siteId)
);

/**
 * Get upcoming user visits (from today onwards)
 */
export const selectUpcomingUserVisits = createSelector(
  [selectUserVisits],
  (visits) => {
    const today = new Date().toISOString().split('T')[0];
    return visits.filter((v) => v.date >= today);
  }
);

/**
 * Get total count of user visits
 */
export const selectUserVisitCount = createSelector(
  [selectUserVisits],
  (visits) => visits.length
);

export default scheduleSlice.reducer;
