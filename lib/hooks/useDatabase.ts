import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, initializeDatabase, resetDatabase } from '../../database';
import { migrateAllData, needsMigration } from '../../database/migration';

const MIGRATION_KEY = '@solyield_migration_complete';
const SCHEMA_VERSION_KEY = '@solyield_schema_version';
const CURRENT_SCHEMA_VERSION = '3'; // Updated to v3 - requiem visits support

export interface DatabaseState {
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  migrationStatus: 'pending' | 'running' | 'complete' | 'error';
}

/**
 * Hook to initialize WatermelonDB and run data migrations on first launch.
 * Returns database state including loading status and any errors.
 */
export function useDatabase(): DatabaseState {
  const [state, setState] = useState<DatabaseState>({
    isReady: false,
    isLoading: true,
    error: null,
    migrationStatus: 'pending',
  });

  useEffect(() => {
    let mounted = true;

    const initDatabase = async () => {
      try {
        // Step 1: Initialize database connection
        await initializeDatabase();
        console.log('✅ Database initialized');

        // Step 2: Check schema version - reset if outdated
        const storedVersion = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
        
        if (storedVersion !== CURRENT_SCHEMA_VERSION) {
          console.log(`🔄 Schema version mismatch (stored: ${storedVersion}, current: ${CURRENT_SCHEMA_VERSION})`);
          console.log('🗑️  Resetting database for schema upgrade...');
          
          // Reset database to apply new schema
          await resetDatabase();
          
          // Clear migration flags
          await AsyncStorage.removeItem(MIGRATION_KEY);
          await AsyncStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
          
          console.log('✅ Database reset complete, proceeding with migration...');
        }

        // Step 3: Check if migration has already been completed
        const migrationComplete = await AsyncStorage.getItem(MIGRATION_KEY);
        
        if (migrationComplete === 'true') {
          console.log('ℹ️ Migration already completed, skipping...');
          if (mounted) {
            setState({
              isReady: true,
              isLoading: false,
              error: null,
              migrationStatus: 'complete',
            });
          }
          return;
        }

        // Step 4: Check if database needs migration
        const needsSync = await needsMigration();
        
        if (!needsSync) {
          console.log('ℹ️ Database already populated, marking as complete');
          await AsyncStorage.setItem(MIGRATION_KEY, 'true');
          if (mounted) {
            setState({
              isReady: true,
              isLoading: false,
              error: null,
              migrationStatus: 'complete',
            });
          }
          return;
        }

        // Step 5: Run migration
        console.log('🔄 Starting data migration...');
        if (mounted) {
          setState((prev) => ({
            ...prev,
            migrationStatus: 'running',
          }));
        }

        await migrateAllData();
        
        // Step 6: Mark migration as complete
        await AsyncStorage.setItem(MIGRATION_KEY, 'true');
        await AsyncStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
        console.log('✅ Data migration complete');

        if (mounted) {
          setState({
            isReady: true,
            isLoading: false,
            error: null,
            migrationStatus: 'complete',
          });
        }
      } catch (error) {
        console.error('❌ Database initialization error:', error);
        if (mounted) {
          setState({
            isReady: false,
            isLoading: false,
            error: error as Error,
            migrationStatus: 'error',
          });
        }
      }
    };

    initDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Force re-run migration (useful for development/testing).
 * WARNING: This will duplicate data if called multiple times.
 */
export async function resetMigration(): Promise<void> {
  await AsyncStorage.removeItem(MIGRATION_KEY);
  console.log('🔄 Migration reset, restart app to re-run');
}
