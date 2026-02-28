/**
 * WatermelonDB Schema Definition
 * 
 * Complete offline-first database structure for SolYield mobile app.
 * Includes: Users, Sites, Activities, Schedules, Maintenance Forms, Photos
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 4,
  tables: [
    /**
     * Users Table (Authentication & Role Management)
     */
    tableSchema({
      name: 'users',
      columns: [
        { name: 'username', type: 'string', isIndexed: true },
        { name: 'password_hash', type: 'string' }, // Hashed password
        { name: 'full_name', type: 'string' },
        { name: 'role', type: 'string', isIndexed: true }, // 'engineer' | 'client'
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'avatar_uri', type: 'string', isOptional: true },
        { name: 'last_login', type: 'number', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    /**
     * Sites Table
     */
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'capacity', type: 'string' },
        { name: 'is_user_created', type: 'boolean' }, // Distinguish user sites from built-in
        { name: 'created_by_user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'archived', type: 'boolean', isIndexed: true }, // Soft delete for analytics
        { name: 'archived_at', type: 'number', isOptional: true }, // When archived
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    /**
     * Activities Table
     */
    tableSchema({
      name: 'activities',
      columns: [
        { name: 'type', type: 'string', isIndexed: true }, // 'inspection' | 'check-in' | 'report' | 'schedule' | 'maintenance'
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'site_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'site_name', type: 'string', isOptional: true },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'icon', type: 'string' },
        { name: 'metadata', type: 'string', isOptional: true }, // JSON string
        { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'archived', type: 'boolean', isIndexed: true }, // Archived when site is archived
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    /**
     * Schedules Table (Visit Planning)
     * 
     * Supports two types of visits:
     * 1. Site visits: Must have valid site_id
     * 2. Requiem visits: site_id is NULL, has is_requiem=true + requiem_reason + optional linked_site_id
     */
    tableSchema({
      name: 'schedules',
      columns: [
        { name: 'site_id', type: 'string', isOptional: true, isIndexed: true }, // NULLABLE for requiem visits
        { name: 'date', type: 'string', isIndexed: true }, // YYYY-MM-DD format
        { name: 'time', type: 'string' }, // HH:MM AM/PM
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'assigned_user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'status', type: 'string' }, // 'scheduled' | 'completed' | 'cancelled'
        { name: 'completed_at', type: 'number', isOptional: true },
        
        // Check-in/Check-out tracking
        { name: 'checked_in_at', type: 'number', isOptional: true, isIndexed: true }, // Timestamp when checked in
        { name: 'checked_out_at', type: 'number', isOptional: true }, // Timestamp when checked out
        { name: 'actual_duration_minutes', type: 'number', isOptional: true }, // Calculated duration
        { name: 'activity_id', type: 'string', isOptional: true, isIndexed: true }, // Link to Activity record (check-in)
        
        // Requiem visit fields
        { name: 'is_requiem', type: 'boolean', isIndexed: true }, // TRUE if not linked to a site
        { name: 'requiem_reason', type: 'string', isOptional: true }, // Required if is_requiem=true
        { name: 'linked_site_id', type: 'string', isOptional: true, isIndexed: true }, // Optional site reference for context
        
        { name: 'archived', type: 'boolean', isIndexed: true }, // Archived when site is archived
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    /**
     * Maintenance Forms Table
     */
    tableSchema({
      name: 'maintenance_forms',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true }, // Form schema ID reference
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true }, // Technician who filled the form
        { name: 'technician_name', type: 'string' },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'completed', type: 'boolean' },
        { name: 'archived', type: 'boolean', isIndexed: true }, // Archived when site is archived
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'synced_at', type: 'number', isOptional: true },
        
        // Site Information Section Fields
        { name: 'inverter_serial', type: 'string' },
        { name: 'current_generation', type: 'number', isOptional: true },
        
        // Visual Inspection Section Fields
        { name: 'panel_condition', type: 'string', isOptional: true },
        { name: 'wiring_integrity', type: 'string', isOptional: true },
        { name: 'issues_observed', type: 'string', isOptional: true }, // JSON array
        
        // Evidence Section Fields
        { name: 'site_photo_uri', type: 'string', isOptional: true },
        { name: 'documents', type: 'string', isOptional: true }, // JSON array
        
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    /**
     * Form Photos Table
     */
    tableSchema({
      name: 'form_photos',
      columns: [
        { name: 'maintenance_form_id', type: 'string', isIndexed: true },
        { name: 'photo_uri', type: 'string' },
        { name: 'photo_type', type: 'string' }, // 'site_photo' | 'evidence' | 'issue'
        { name: 'caption', type: 'string', isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    /**
     * Performance Data Table (Daily Generation Records)
     */
    tableSchema({
      name: 'performance_records',
      columns: [
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'string', isIndexed: true }, // YYYY-MM-DD
        { name: 'energy_generated_kwh', type: 'number' },
        { name: 'peak_power', type: 'number', isOptional: true },
        { name: 'efficiency_percentage', type: 'number', isOptional: true },
        { name: 'status', type: 'string' }, // 'over' | 'normal' | 'under' | 'zero' | 'no_data'
        { name: 'archived', type: 'boolean', isIndexed: true }, // Archived when site is archived (kept for analytics)
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
