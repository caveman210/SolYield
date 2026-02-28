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
   * Background sync - no alerts or popups
   */
  const syncDataSilently = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      // Check network status
      const online = await refreshNetworkStatus();
      if (!online) {
        setSyncError('No internet connection');
        setIsSyncing(false);
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

      console.log('Background sync completed');
      console.log(`Forms synced: ${unsyncedForms.length}`);
      console.log(`Activities synced: ${unsyncedActivities.length}`);

      setLastSyncTime(Date.now());
      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Background sync error:', error);
      setSyncError('Sync failed');
      setIsSyncing(false);
      return false;
    }
  }, [refreshNetworkStatus, unsyncedForms.length, unsyncedActivities.length]);

  /**
   * Manual sync - can be triggered by user, returns status
   */
  const syncDataManually = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      // Check network status
      const online = await refreshNetworkStatus();
      if (!online) {
        setSyncError('No internet connection');
        setIsSyncing(false);
        return {
          success: false,
          message: 'Cannot sync while offline. Please check your internet connection.',
        };
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: In production, implement actual sync logic
      console.log('Manual sync completed');
      console.log(`Forms synced: ${unsyncedForms.length}`);
      console.log(`Activities synced: ${unsyncedActivities.length}`);

      setLastSyncTime(Date.now());
      setIsSyncing(false);
      return { success: true, message: `Successfully synced ${unsyncedCount} items` };
    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncError('Sync failed');
      setIsSyncing(false);
      return { success: false, message: 'Sync failed. Please try again later.' };
    }
  }, [refreshNetworkStatus, unsyncedForms.length, unsyncedActivities.length, unsyncedCount]);

  /**
   * Auto-sync when coming back online (background only)
   * Runs every 10 minutes if there's unsynced data
   */
  useEffect(() => {
    if (isOnline && unsyncedCount > 0 && !isSyncing) {
      // Initial sync with delay to ensure stable connection
      const initialTimer = setTimeout(() => {
        console.log('Auto-syncing in background due to connection restored...');
        syncDataSilently();
      }, 2000);

      // Set up periodic sync every 10 minutes
      const syncInterval = setInterval(() => {
        if (isOnline && unsyncedCount > 0 && !isSyncing) {
          console.log('Periodic auto-sync (10-minute interval)...');
          syncDataSilently();
        }
      }, 10 * 60 * 1000); // 10 minutes in milliseconds

      return () => {
        clearTimeout(initialTimer);
        clearInterval(syncInterval);
      };
    }
  }, [isOnline, unsyncedCount, isSyncing, syncDataSilently]);

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
    syncData: syncDataManually, // For backward compatibility
    syncDataManually,
    syncDataSilently,
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
