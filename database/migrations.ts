/**
 * WatermelonDB Schema Migrations
 * 
 * Handles database schema version upgrades.
 * Each migration transforms the database from version N to N+1.
 */

import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    /**
     * Migration from v1 to v2: Add archiving support
     * 
     * Adds 'archived' boolean field to all major tables to support
     * soft-delete functionality for analytics and data retention.
     */
    {
      toVersion: 2,
      steps: [
        // Add archiving fields to sites table
        addColumns({
          table: 'sites',
          columns: [
            { name: 'archived', type: 'boolean', isIndexed: true },
            { name: 'archived_at', type: 'number', isOptional: true },
          ],
        }),
        
        // Add archived field to activities table
        addColumns({
          table: 'activities',
          columns: [
            { name: 'archived', type: 'boolean', isIndexed: true },
          ],
        }),
        
        // Add archived field to schedules table
        addColumns({
          table: 'schedules',
          columns: [
            { name: 'archived', type: 'boolean', isIndexed: true },
          ],
        }),
        
        // Add archived field to maintenance_forms table
        addColumns({
          table: 'maintenance_forms',
          columns: [
            { name: 'archived', type: 'boolean', isIndexed: true },
          ],
        }),
        
        // Add archived field to performance_records table
        addColumns({
          table: 'performance_records',
          columns: [
            { name: 'archived', type: 'boolean', isIndexed: true },
          ],
        }),
      ],
    },
    
    /**
     * Migration from v2 to v3: Add requiem visits support
     * 
     * Enables non-site visits (requiem visits) by:
     * - Making site_id optional in schedules table
     * - Adding is_requiem flag to mark non-site visits
     * - Adding requiem_reason field for explaining why the visit isn't site-linked
     * - Adding linked_site_id for optional contextual site reference
     */
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'schedules',
          columns: [
            { name: 'is_requiem', type: 'boolean', isIndexed: true },
            { name: 'requiem_reason', type: 'string', isOptional: true },
            { name: 'linked_site_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    
    /**
     * Migration from v3 to v4: Add check-in/check-out tracking
     * 
     * Adds visit tracking fields to schedules table:
     * - checked_in_at: Timestamp when user checked in at site
     * - checked_out_at: Timestamp when user checked out from site
     * - actual_duration_minutes: Calculated duration of visit
     * - activity_id: Link to the Activity record created during check-in
     */
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'schedules',
          columns: [
            { name: 'checked_in_at', type: 'number', isOptional: true, isIndexed: true },
            { name: 'checked_out_at', type: 'number', isOptional: true },
            { name: 'actual_duration_minutes', type: 'number', isOptional: true },
            { name: 'activity_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
  ],
});
