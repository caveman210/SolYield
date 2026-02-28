/**
 * WatermelonDB Database Instance
 * 
 * Central database configuration for offline-first data persistence.
 * Complete SolYield data model with authentication support.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import migrations from './migrations';
import User from './models/User';
import Site from './models/Site';
import Activity from './models/Activity';
import Schedule from './models/Schedule';
import MaintenanceForm from './models/MaintenanceForm';
import FormPhoto from './models/FormPhoto';
import PerformanceRecord from './models/PerformanceRecord';

/**
 * SQLite Adapter Configuration
 */
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'solyield',
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

/**
 * Database Instance
 */
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Site,
    Activity,
    Schedule,
    MaintenanceForm,
    FormPhoto,
    PerformanceRecord,
  ],
});

/**
 * Initialize database and seed initial data
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Initializing WatermelonDB...');
    
    // Test query to ensure database is working
    const userCount = await database.collections.get<User>('users').query().fetchCount();
    const siteCount = await database.collections.get<Site>('sites').query().fetchCount();
    
    console.log(`WatermelonDB initialized. Users: ${userCount}, Sites: ${siteCount}`);
    return true;
  } catch (error) {
    console.error('Failed to initialize WatermelonDB:', error);
    return false;
  }
};

/**
 * Collection Helpers (Type-safe)
 */
export const getUsersCollection = () => database.collections.get<User>('users');
export const getSitesCollection = () => database.collections.get<Site>('sites');
export const getActivitiesCollection = () => database.collections.get<Activity>('activities');
export const getSchedulesCollection = () => database.collections.get<Schedule>('schedules');
export const getMaintenanceFormsCollection = () => database.collections.get<MaintenanceForm>('maintenance_forms');
export const getFormPhotosCollection = () => database.collections.get<FormPhoto>('form_photos');
export const getPerformanceRecordsCollection = () => database.collections.get<PerformanceRecord>('performance_records');

/**
 * Reset database (Development only)
 */
export const resetDatabase = async () => {
  if (__DEV__) {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    console.log('Database reset complete');
  } else {
    console.warn('Database reset is only available in development mode');
  }
};

export default database;
