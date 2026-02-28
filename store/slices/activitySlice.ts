import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Activity } from '../../lib/types';

interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
}

const initialState: ActivityState = {
  activities: [],
  isLoading: false,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    addActivity: (state, action: PayloadAction<Activity>) => {
      // Accept a full Activity object with ID already generated
      state.activities.unshift(action.payload); // Add to beginning for newest first
    },

    markActivitySynced: (state, action: PayloadAction<string>) => {
      const activity = state.activities.find((a) => a.id === action.payload);
      if (activity) {
        activity.synced = true;
      }
    },

    clearActivities: (state) => {
      state.activities = [];
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Batch add activities (useful for initial load from storage)
    loadActivities: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload.sort((a, b) => b.timestamp - a.timestamp);
    },

    removeActivity: (state, action: PayloadAction<string>) => {
      state.activities = state.activities.filter((a) => a.id !== action.payload);
    },
  },
});

export const {
  addActivity,
  markActivitySynced,
  clearActivities,
  setLoading,
  loadActivities,
  removeActivity,
} = activitySlice.actions;

// Selectors
export const selectAllActivities = (state: { activity: ActivityState }) =>
  state.activity.activities;

// Memoized selectors to prevent unnecessary re-renders
export const selectRecentActivities = createSelector(
  [selectAllActivities, (_state: { activity: ActivityState }, limit: number = 5) => limit],
  (activities, limit) => activities.slice(0, limit)
);

export const selectActivitiesBySite = createSelector(
  [selectAllActivities, (_state: { activity: ActivityState }, siteId: string) => siteId],
  (activities, siteId) => activities.filter((a) => a.siteId === siteId)
);

export const selectUnsyncedActivities = createSelector(
  [selectAllActivities],
  (activities) => activities.filter((a) => !a.synced)
);

export default activitySlice.reducer;
