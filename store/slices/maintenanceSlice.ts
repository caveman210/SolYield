import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FormData {
  [key: string]: any;
}

interface MaintenanceState {
  forms: FormData[];
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
    submitForm: (state, action: PayloadAction<FormData>) => {
      state.forms.push({ ...action.payload, timestamp: Date.now(), synced: false });
      state.currentDraft = null;
    },
    clearDraft: (state) => {
      state.currentDraft = null;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    markSynced: (state, action: PayloadAction<number>) => {
      const form = state.forms[action.payload];
      if (form) {
        form.synced = true;
      }
    },
  },
});

export const { saveDraft, submitForm, clearDraft, setSyncing, markSynced } =
  maintenanceSlice.actions;
export default maintenanceSlice.reducer;
