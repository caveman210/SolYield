/**
 * Data Migration Utility
 * 
 * Ports existing static data from TypeScript files to WatermelonDB.
 * Run this once during app initialization to populate the database.
 */

import { Q } from '@nozbe/watermelondb';
import { database, getSitesCollection, getSchedulesCollection, getPerformanceRecordsCollection, getUsersCollection } from './index';
import { SITES } from '../lib/data/sites';
import { SCHEDULE } from '../lib/data/schedule';
import { CHART_DATA } from '../lib/data/chartData';
import { PERFORMANCE_DATA } from '../lib/data/performanceData';
import * as Crypto from 'expo-crypto';

/**
 * Hash password using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hash;
}

/**
 * Seed default users (Engineer and Client/Boss)
 */
export async function seedUsers() {
  const usersCollection = getUsersCollection();
  const existingUsers = await usersCollection.query().fetchCount();
  
  if (existingUsers > 0) {
    console.log('Users already seeded, skipping...');
    return;
  }

  console.log('Seeding default users...');

  await database.write(async () => {
    // Create Engineer user (Arjun - Field Technician)
    await usersCollection.create((user) => {
      user.username = 'arjun';
      user.passwordHash = ''; // Will be set after hashing
      user.fullName = 'Arjun Kumar';
      user.role = 'engineer';
      user.email = 'arjun@solyield.com';
      user.phone = '+91 98765 43210';
      user.isActive = true;
    });

    // Create Client user (Boss/Manager)
    await usersCollection.create((user) => {
      user.username = 'manager';
      user.passwordHash = ''; // Will be set after hashing
      user.fullName = 'Rajesh Sharma';
      user.role = 'client';
      user.email = 'rajesh@solyield.com';
      user.phone = '+91 98765 43211';
      user.isActive = true;
    });
  });

  // Hash passwords after creation (in real app, do this before saving)
  const users = await usersCollection.query().fetch();
  for (const user of users) {
    const defaultPassword = user.username === 'arjun' ? 'engineer123' : 'manager123';
    const hashedPassword = await hashPassword(defaultPassword);
    
    await database.write(async () => {
      await user.update((u) => {
        u.passwordHash = hashedPassword;
      });
    });
  }

  console.log('✅ Users seeded successfully');
  console.log('   Engineer: arjun / engineer123');
  console.log('   Manager: manager / manager123');
}

/**
 * Migrate sites data to WatermelonDB
 */
export async function migrateSites() {
  const sitesCollection = getSitesCollection();
  const existingSites = await sitesCollection.query().fetchCount();
  
  if (existingSites > 0) {
    console.log('Sites already migrated, skipping...');
    return;
  }

  console.log('Migrating sites to WatermelonDB...');

  await database.write(async () => {
    for (const siteData of SITES) {
      await sitesCollection.create((site) => {
        site._raw.id = siteData.id; // Preserve original ID
        site.name = siteData.name;
        site.latitude = siteData.location.lat;
        site.longitude = siteData.location.lng;
        site.capacity = siteData.capacity;
        site.isUserCreated = false; // Built-in sites
        site.archived = false; // Not archived
        site.synced = true;
      });
    }
  });

  console.log(`✅ Migrated ${SITES.length} sites to WatermelonDB`);
}

/**
 * Migrate schedule data to WatermelonDB
 */
export async function migrateSchedules() {
  const schedulesCollection = getSchedulesCollection();
  const existingSchedules = await schedulesCollection.query().fetchCount();
  
  if (existingSchedules > 0) {
    console.log('Schedules already migrated, skipping...');
    return;
  }

  console.log('Migrating schedules to WatermelonDB...');

  await database.write(async () => {
    for (const scheduleData of SCHEDULE) {
      await schedulesCollection.create((schedule) => {
        schedule._raw.id = scheduleData.id; // Preserve original ID
        schedule.siteId = scheduleData.siteId;
        schedule.date = scheduleData.date;
        schedule.time = scheduleData.time;
        schedule.title = scheduleData.title;
        schedule.status = 'scheduled';
        schedule.isRequiem = false; // Site visits, not requiem
        schedule.archived = false; // Not archived
        schedule.synced = true;
      });
    }
  });

  console.log(`✅ Migrated ${SCHEDULE.length} schedules to WatermelonDB`);
}

/**
 * Migrate performance/chart data to WatermelonDB
 */
export async function migratePerformanceData() {
  const performanceCollection = getPerformanceRecordsCollection();
  const existingRecords = await performanceCollection.query().fetchCount();
  
  if (existingRecords > 0) {
    console.log('Performance data already migrated, skipping...');
    return;
  }

  console.log('Migrating performance data to WatermelonDB...');

  // Get first site to associate data with (in real app, distribute across sites)
  const sitesCollection = getSitesCollection();
  const firstSite = await sitesCollection.query().fetch().then(sites => sites[0]);
  
  if (!firstSite) {
    console.warn('No sites found, skipping performance data migration');
    return;
  }

  let recordCount = 0;

  await database.write(async () => {
    // Migrate all monthly data
    for (const monthData of CHART_DATA) {
      for (const day of monthData.days) {
        // Determine status based on energy generated
        let status: 'over' | 'normal' | 'under' | 'zero' | 'no_data';
        const energy = day.energyGeneratedkWh;
        
        if (energy === 0) status = 'zero';
        else if (energy > 50) status = 'over';
        else if (energy >= 40) status = 'normal';
        else status = 'under';

        await performanceCollection.create((record) => {
          record.siteId = firstSite.id;
          record.date = day.date.split('T')[0]; // Extract YYYY-MM-DD
          record.energyGeneratedKwh = energy;
          record.status = status;
          record.archived = false; // Not archived
          record.synced = true;
        });
        
        recordCount++;
      }
    }
  });

  console.log(`✅ Migrated ${recordCount} performance records to WatermelonDB`);
}

/**
 * Run all migrations
 */
export async function migrateAllData() {
  console.log('🚀 Starting data migration to WatermelonDB...');
  
  try {
    await seedUsers();
    await migrateSites();
    await migrateSchedules();
    await migratePerformanceData();
    
    console.log('✅ All data migrated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  const sitesCollection = getSitesCollection();
  const siteCount = await sitesCollection.query().fetchCount();
  return siteCount === 0;
}
