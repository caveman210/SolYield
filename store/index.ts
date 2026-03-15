import { configureStore } from '@reduxjs/toolkit';

// Only put ephemeral UI state here (e.g., auth, settings)
// All persistent data has been migrated to WatermelonDB

export const store = configureStore({
  reducer: {
    // No reducers needed as everything uses WatermelonDB
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
