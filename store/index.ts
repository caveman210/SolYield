import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import maintenanceReducer from './slices/maintenanceSlice';
import activityReducer from './slices/activitySlice';
import siteReducer from './slices/siteSlice';
import scheduleReducer from './slices/scheduleSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['maintenance', 'activity', 'site', 'schedule'], // Persist all user data
};

const rootReducer = combineReducers({
  maintenance: maintenanceReducer,
  activity: activityReducer,
  site: siteReducer,
  schedule: scheduleReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
