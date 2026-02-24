import { configureStore } from '@reduxjs/toolkit';
import maintenanceReducer from './slices/maintenanceSlice';
import activityReducer from './slices/activitySlice';

export const store = configureStore({
  reducer: {
    maintenance: maintenanceReducer,
    activity: activityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
