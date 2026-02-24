import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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
    addActivity: (state, action: PayloadAction<Omit<Activity, 'id' | 'timestamp' | 'synced'>>) => {
      const newActivity: Activity = {
        ...action.payload,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        synced: false,
      };
      state.activities.unshift(newActivity); // Add to beginning for newest first
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
export const selectRecentActivities = (state: { activity: ActivityState }, limit: number = 5) =>
  state.activity.activities.slice(0, limit);
export const selectActivitiesBySite = (state: { activity: ActivityState }, siteId: string) =>
  state.activity.activities.filter((a) => a.siteId === siteId);
export const selectUnsyncedActivities = (state: { activity: ActivityState }) =>
  state.activity.activities.filter((a) => !a.synced);

export default activitySlice.reducer;
