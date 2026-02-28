# SolYield Archiving System Documentation

## Overview

The SolYield Mobile app now implements a **comprehensive archiving system** for site-based data management. This system uses **soft deletes** (marking records as archived) instead of hard deletes, preserving data for analytics and historical reporting.

---

## Key Concepts

### 1. **Hierarchical Data Structure**

Sites are the **root entity** in the data hierarchy:

```
Site (Root)
├── Activities (Inspections, Check-ins, Reports)
├── Schedules (Visits)
├── Maintenance Forms (Inspection Forms)
└── Performance Records (Daily Energy Data)
```

### 2. **Cascading Archive Behavior**

When a site is archived:
- ✅ The site is marked as `archived = true`
- ✅ The `archived_at` timestamp is recorded
- ✅ **All related data** is automatically archived (cascading)
  - Activities linked to that site
  - Schedules (visits) for that site
  - Maintenance forms for that site
  - Performance records for that site

**Important:** Archived data is **NOT deleted**—it's hidden from active views but remains in the database for analytics.

### 3. **Independent Deletion**

Some data can be deleted independently without affecting the site:
- **Schedules/Visits:** Can be deleted individually without impacting the site or other data
- This allows users to remove cancelled or incorrect visits without data loss

---

## Database Schema Changes (v1 → v2)

### Schema Version 2 Additions

All major tables now include an `archived` boolean field:

#### **Sites Table**
```typescript
{ name: 'archived', type: 'boolean', isIndexed: true }
{ name: 'archived_at', type: 'number', isOptional: true }
```

#### **Activities Table**
```typescript
{ name: 'archived', type: 'boolean', isIndexed: true }
```

#### **Schedules Table**
```typescript
{ name: 'archived', type: 'boolean', isIndexed: true }
```

#### **Maintenance Forms Table**
```typescript
{ name: 'archived', type: 'boolean', isIndexed: true }
```

#### **Performance Records Table**
```typescript
{ name: 'archived', type: 'boolean', isIndexed: true }
```

### Migration Handling

WatermelonDB automatically migrates from v1 to v2 using `database/migrations.ts`:
- Adds `archived` column to all tables
- Sets default value `false` for existing records
- Creates indexes for efficient querying

---

## API Reference

### Site Model Methods

#### `site.archive(): Promise<void>`
Archives the site and all related data (cascading soft delete).

```typescript
const site = await getSitesCollection().find('site_01');
await site.archive();
// ✅ Site + all activities, schedules, forms, performance records archived
```

#### `site.unarchive(): Promise<void>`
Restores the site and all related data from archive.

```typescript
await site.unarchive();
// ✅ Site + all related data restored to active state
```

#### `site.isActive: boolean`
Getter that returns `true` if the site is NOT archived.

```typescript
if (site.isActive) {
  console.log('Site is currently active');
}
```

#### `site.isBuiltIn: boolean`
Returns `true` if the site was pre-loaded (not user-created).

---

### Schedule Model Methods

#### `schedule.deleteSchedule(): Promise<void>`
Permanently deletes a schedule entry (hard delete).

```typescript
const schedule = await getSchedulesCollection().find('visit_01');
await schedule.deleteSchedule();
// ✅ Schedule removed, site and other data unaffected
```

#### `schedule.markAsCompleted(): Promise<void>`
Marks a schedule as completed.

#### `schedule.markAsCancelled(): Promise<void>`
Marks a schedule as cancelled.

---

### Custom Hooks

#### `useSites(includeArchived?: boolean): UseSitesResult`
Queries sites from the database.

```typescript
// Get only active sites (default)
const { sites } = useSites();

// Get ALL sites including archived
const { sites } = useSites(true);
```

**Returns:**
```typescript
{
  sites: Site[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  userCreatedCount: number;
  builtInCount: number;
  getSiteName: (siteId: string) => string;
  getSiteById: (siteId: string) => Site | undefined;
}
```

#### `useArchivedSites(): { sites, isLoading, error, count }`
Queries **only archived sites** for analytics.

```typescript
const { sites: archivedSites, count } = useArchivedSites();
console.log(`${count} archived sites available for reporting`);
```

#### `useDBActivities(includeArchived?: boolean): UseActivitiesResult`
Queries activities with optional archived filtering.

```typescript
// Get only active activities (default)
const { activities } = useDBActivities();

// Include archived activities
const { activities } = useDBActivities(true);
```

---

## UI Integration

### Dashboard "New Inspection" Widget

**Fixed Route:** The "New Inspection" quick action button in the dashboard now correctly routes to `/inspection-form`:

```typescript
// app/(tabs)/index.tsx line 350
{ icon: 'plus-circle', label: 'New Inspection', route: '/inspection-form' }
```

**Purpose of Bell Icon (Line 88-97):**
The bell icon in the dashboard header is intended for **notifications**:
- Unsynced data alerts
- Upcoming scheduled visits
- System notifications

*Currently non-functional (no onPress handler)—future implementation needed.*

---

## Why Data is Empty (Initial State)

### Recent Activities & Inspections Empty ✅ **Expected Behavior**

The migration script (`database/migration.ts`) only seeds:
- ✅ Users (Arjun & Rajesh)
- ✅ Sites (from `SITES` array)
- ✅ Schedules (from `SCHEDULE` array)
- ✅ Performance Records (from `CHART_DATA`)

**Activities are NOT seeded** because they represent user actions. Activities are created when:
- A technician performs an inspection
- A check-in is logged at a site
- A report is generated

### Sites & Visits Show Data ✅ **Working as Designed**

Sites and schedules are pre-populated from static data files during migration.

---

## Usage Examples

### Example 1: Archive a Completed Site

```typescript
import { getSitesCollection } from '../database';

async function archiveCompletedSite(siteId: string) {
  const site = await getSitesCollection().find(siteId);
  
  console.log(`Archiving site: ${site.name}`);
  await site.archive();
  
  // All related data (visits, inspections, performance) now archived
  console.log('✅ Site and all related data archived');
}
```

### Example 2: Delete a Cancelled Visit

```typescript
import { getSchedulesCollection } from '../database';

async function deleteCancelledVisit(scheduleId: string) {
  const schedule = await getSchedulesCollection().find(scheduleId);
  
  console.log(`Deleting visit: ${schedule.title}`);
  await schedule.deleteSchedule();
  
  // Only the schedule is deleted, site remains intact
  console.log('✅ Visit deleted, site unaffected');
}
```

### Example 3: View Archived Sites for Analytics

```typescript
import { useArchivedSites } from '../lib/hooks/useSites';

function ArchivedSitesReport() {
  const { sites, isLoading } = useArchivedSites();
  
  if (isLoading) return <Text>Loading...</Text>;
  
  return (
    <View>
      <Text>Archived Sites: {sites.length}</Text>
      {sites.map(site => (
        <Text key={site.id}>
          {site.name} - Archived on {new Date(site.archivedAt!).toLocaleDateString()}
        </Text>
      ))}
    </View>
  );
}
```

---

## Best Practices

### ✅ DO

- **Archive sites** when work is completed for long-term storage
- **Delete schedules** individually when they're cancelled or incorrect
- **Query archived data** for analytics and historical reports
- **Use `includeArchived` parameter** when you need full historical data

### ❌ DON'T

- **Don't hard delete sites**—use `archive()` instead
- **Don't manually set `archived` field**—use model methods
- **Don't forget to handle archived state** in UI filters

---

## Future Enhancements

### Pending Implementation

1. **UI Archive Button:** Add archive functionality to site management screens
2. **Sample Activities:** Seed sample inspection/check-in activities for demo
3. **Notification System:** Implement bell icon functionality
4. **Archive Analytics Screen:** Dashboard for viewing archived site performance
5. **Bulk Archive:** Archive multiple sites at once
6. **Auto-Archive:** Automatically archive sites after N days of inactivity

---

## Testing the System

### Test Archive Flow

```bash
# 1. Start the app
npx expo run:android

# 2. Open Metro logs
# Check for migration success message: "✅ All data migrated successfully!"

# 3. Navigate to Sites screen
# Verify sites are visible (should be 4 built-in sites)

# 4. Archive a site (use React Native Debugger):
# > site = await getSitesCollection().find('site_01')
# > await site.archive()

# 5. Refresh Sites screen
# Site should disappear from list (filtered by archived=false)

# 6. Query archived sites:
# > archivedSites = await getSitesCollection().query(Q.where('archived', true)).fetch()
# > console.log(archivedSites.length) // Should be 1
```

---

## Database Migration Notes

### Upgrading from v1 to v2

WatermelonDB handles schema upgrades automatically:

1. On app startup, checks current schema version
2. If v1 detected, runs migration to v2:
   - Adds `archived` columns to all tables
   - Sets default `false` for existing records
   - Creates indexes for performance
3. Updates schema version in database metadata

**No data loss occurs** during migration—existing records are preserved.

### Reset Database (Development Only)

```typescript
import { resetDatabase } from '../database';

// Wipes ALL data and resets schema to v2
await resetDatabase();
```

⚠️ **Warning:** Only available in `__DEV__` mode. Do not use in production.

---

## Summary

The archiving system provides:

- ✅ **Hierarchical data management** with sites as the root entity
- ✅ **Cascading archive** behavior for complete data isolation
- ✅ **Independent deletion** of schedules without affecting sites
- ✅ **Soft delete** approach preserving data for analytics
- ✅ **Efficient querying** with indexed `archived` fields
- ✅ **Type-safe API** through WatermelonDB models and custom hooks

This design ensures data integrity, supports historical analytics, and provides flexible data lifecycle management for field technicians.
