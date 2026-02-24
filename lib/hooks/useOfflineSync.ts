/**
 * useOfflineSync Hook
 * 
 * Provides offline/online detection and data synchronization logic.
 * Separates business logic from UI components.
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSelector } from 'react-redux';
import { selectUnsyncedForms } from '../../store/slices/maintenanceSlice';
import { selectUnsyncedActivities } from '../../store/slices/activitySlice';
import { Alert } from 'react-native';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  unsyncedCount: number;
  error: string | null;
}

/**
 * Hook for network status and offline/online detection
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Manually refresh network status
   */
  const refreshNetworkStatus = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? false);
    setConnectionType(state.type);
    setIsInternetReachable(state.isInternetReachable);
    return state.isConnected ?? false;
  }, []);

  return {
    isOnline,
    connectionType,
    isInternetReachable,
    refreshNetworkStatus,
  };
};

/**
 * Hook for data synchronization
 */
export const useOfflineSync = () => {
  const { isOnline, refreshNetworkStatus } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Get unsynced data from Redux
  const unsyncedForms = useSelector(selectUnsyncedForms);
  const unsyncedActivities = useSelector(selectUnsyncedActivities);

  const unsyncedCount = unsyncedForms.length + unsyncedActivities.length;

  /**
   * Simulate syncing data to backend
   * In production, this would make actual API calls
   */
  const syncData = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      // Check network status
      const online = await refreshNetworkStatus();
      if (!online) {
        setSyncError('No internet connection');
        setIsSyncing(false);
        Alert.alert('Offline', 'Cannot sync while offline. Data will sync automatically when online.');
        return false;
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: In production, implement actual sync logic:
      // 1. Upload unsynced forms to backend
      // 2. Upload unsynced activities to backend
      // 3. Download any updates from backend
      // 4. Mark items as synced in Redux
      // 5. Handle conflicts and errors

      console.log('Syncing data...');
      console.log(`Forms to sync: ${unsyncedForms.length}`);
      console.log(`Activities to sync: ${unsyncedActivities.length}`);

      // For now, just log success
      setLastSyncTime(Date.now());
      setIsSyncing(false);

      Alert.alert(
        'Sync Complete',
        `Successfully synced ${unsyncedCount} items.`
      );

      return true;
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError('Sync failed. Please try again.');
      setIsSyncing(false);
      Alert.alert('Sync Error', 'Failed to sync data. Please try again later.');
      return false;
    }
  }, [refreshNetworkStatus, unsyncedForms.length, unsyncedActivities.length, unsyncedCount]);

  /**
   * Auto-sync when coming back online
   */
  useEffect(() => {
    if (isOnline && unsyncedCount > 0 && !isSyncing) {
      // Auto-sync with a small delay to ensure stable connection
      const timer = setTimeout(() => {
        console.log('Auto-syncing due to connection restored...');
        syncData();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, unsyncedCount, isSyncing, syncData]);

  /**
   * Get sync status
   */
  const syncStatus: SyncStatus = {
    isOnline,
    isSyncing,
    lastSyncTime,
    unsyncedCount,
    error: syncError,
  };

  return {
    // Status
    syncStatus,
    isOnline,
    isSyncing,
    lastSyncTime,
    unsyncedCount,
    syncError,

    // Actions
    syncData,
    refreshNetworkStatus,
  };
};

/**
 * Format last sync time for display
 */
export const formatLastSyncTime = (timestamp: number | null): string => {
  if (!timestamp) return 'Never synced';

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/**
 * Get sync status message
 */
export const getSyncStatusMessage = (syncStatus: SyncStatus): string => {
  if (syncStatus.isSyncing) {
    return 'Syncing data...';
  }

  if (!syncStatus.isOnline) {
    return `Offline - ${syncStatus.unsyncedCount} items pending`;
  }

  if (syncStatus.unsyncedCount > 0) {
    return `${syncStatus.unsyncedCount} items waiting to sync`;
  }

  if (syncStatus.lastSyncTime) {
    return `Last synced ${formatLastSyncTime(syncStatus.lastSyncTime)}`;
  }

  return 'All data synced';
};

/**
 * Get sync status color
 */
export const getSyncStatusColor = (syncStatus: SyncStatus): string => {
  if (syncStatus.error) return '#EF4444'; // Red
  if (syncStatus.isSyncing) return '#F59E0B'; // Amber
  if (!syncStatus.isOnline) return '#6B7280'; // Gray
  if (syncStatus.unsyncedCount > 0) return '#F59E0B'; // Amber
  return '#10B981'; // Green
};
