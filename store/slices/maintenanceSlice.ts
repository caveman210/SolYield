import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { InspectionForm } from '../../lib/types';

interface FormData {
  [key: string]: any;
}

interface MaintenanceState {
  forms: InspectionForm[];
  currentDraft: FormData | null;
  isSyncing: boolean;
}

const initialState: MaintenanceState = {
  forms: [],
  currentDraft: null,
  isSyncing: false,
};

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    saveDraft: (state, action: PayloadAction<FormData>) => {
      state.currentDraft = action.payload;
    },
    submitForm: (
      state,
      action: PayloadAction<{
        data: FormData;
        siteId?: string;
        siteName?: string;
        activityId?: string;
      }>
    ) => {
      const { data, siteId, siteName, activityId } = action.payload;

      // Extract images from form data
      const images: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === 'string' && data[key].startsWith('file://')) {
          images[key] = data[key];
        }
      });

      const newForm: InspectionForm = {
        id: `inspection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        synced: false,
        siteId,
        siteName,
        data,
        images,
        activityId,
      };

      state.forms.push(newForm);
      state.currentDraft = null;
    },
    clearDraft: (state) => {
      state.currentDraft = null;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    markSynced: (state, action: PayloadAction<string>) => {
      const form = state.forms.find((f) => f.id === action.payload);
      if (form) {
        form.synced = true;
      }
    },
    deleteForm: (state, action: PayloadAction<string>) => {
      state.forms = state.forms.filter((f) => f.id !== action.payload);
    },
  },
});

export const { saveDraft, submitForm, clearDraft, setSyncing, markSynced, deleteForm } =
  maintenanceSlice.actions;

// Selectors
export const selectAllForms = (state: { maintenance: MaintenanceState }) => state.maintenance.forms;

// Memoized selector to prevent unnecessary re-renders
export const selectUnsyncedForms = createSelector(
  [selectAllForms],
  (forms) => forms.filter((f) => !f.synced)
);

export const selectCurrentDraft = (state: { maintenance: MaintenanceState }) =>
  state.maintenance.currentDraft;
export const selectIsSyncing = (state: { maintenance: MaintenanceState }) =>
  state.maintenance.isSyncing;

export default maintenanceSlice.reducer;
