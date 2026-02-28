/**
 * Site Model
 * 
 * Solar farm site with location and capacity information.
 * Supports both built-in and user-created sites.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { Q } from '@nozbe/watermelondb';

export default class Site extends Model {
  static table = 'sites';

  static associations: Associations = {
    activities: { type: 'has_many', foreignKey: 'site_id' },
    schedules: { type: 'has_many', foreignKey: 'site_id' },
    maintenance_forms: { type: 'has_many', foreignKey: 'site_id' },
    performance_records: { type: 'has_many', foreignKey: 'site_id' },
  };

  @field('name') name!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('capacity') capacity!: string;
  @field('is_user_created') isUserCreated!: boolean;
  @field('created_by_user_id') createdByUserId?: string;
  @field('archived') archived!: boolean;
  @field('archived_at') archivedAt?: number;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Get location as object
   */
  get location() {
    return {
      lat: this.latitude,
      lng: this.longitude,
    };
  }

  /**
   * Check if this is a built-in site
   */
  get isBuiltIn(): boolean {
    return !this.isUserCreated;
  }

  /**
   * Check if site is active (not archived)
   */
  get isActive(): boolean {
    return !this.archived;
  }

  /**
   * Mark as synced
   */
  async markAsSynced() {
    await this.update((site) => {
      site.synced = true;
    });
  }

  /**
   * Archive this site and all related data (cascading soft delete)
   * 
   * When a site is archived:
   * - The site is marked as archived
   * - All related activities are archived
   * - All related schedules are archived
   * - All related maintenance forms are archived
   * - Performance records are archived (but kept for analytics)
   * 
   * This is a soft delete - data is not actually deleted, just hidden from active views.
   */
  async archive() {
    await this.collections.get('sites').database.write(async () => {
      // Archive the site
      await this.update((site) => {
        site.archived = true;
        site.archivedAt = Date.now();
        site.synced = false; // Needs to sync the archive status
      });

      // Cascade archive to all related data
      const activities = await this.collections.get('activities')
        .query(Q.where('site_id', this.id))
        .fetch();
      
      const schedules = await this.collections.get('schedules')
        .query(Q.where('site_id', this.id))
        .fetch();
      
      const maintenanceForms = await this.collections.get('maintenance_forms')
        .query(Q.where('site_id', this.id))
        .fetch();
      
      const performanceRecords = await this.collections.get('performance_records')
        .query(Q.where('site_id', this.id))
        .fetch();

      // Archive all related records
      for (const activity of activities) {
        await activity.update((a: any) => {
          a.archived = true;
        });
      }

      for (const schedule of schedules) {
        await schedule.update((s: any) => {
          s.archived = true;
        });
      }

      for (const form of maintenanceForms) {
        await form.update((f: any) => {
          f.archived = true;
        });
      }

      for (const record of performanceRecords) {
        await record.update((r: any) => {
          r.archived = true;
        });
      }
    });

    console.log(`✅ Site "${this.name}" and all related data archived`);
  }

  /**
   * Unarchive this site and all related data
   */
  async unarchive() {
    await this.collections.get('sites').database.write(async () => {
      // Unarchive the site
      await this.update((site) => {
        site.archived = false;
        site.archivedAt = undefined;
        site.synced = false; // Needs to sync the unarchive status
      });

      // Cascade unarchive to all related data
      const activities = await this.collections.get('activities')
        .query(Q.where('site_id', this.id), Q.where('archived', true))
        .fetch();
      
      const schedules = await this.collections.get('schedules')
        .query(Q.where('site_id', this.id), Q.where('archived', true))
        .fetch();
      
      const maintenanceForms = await this.collections.get('maintenance_forms')
        .query(Q.where('site_id', this.id), Q.where('archived', true))
        .fetch();
      
      const performanceRecords = await this.collections.get('performance_records')
        .query(Q.where('site_id', this.id), Q.where('archived', true))
        .fetch();

      // Unarchive all related records
      for (const activity of activities) {
        await activity.update((a: any) => {
          a.archived = false;
        });
      }

      for (const schedule of schedules) {
        await schedule.update((s: any) => {
          s.archived = false;
        });
      }

      for (const form of maintenanceForms) {
        await form.update((f: any) => {
          f.archived = false;
        });
      }

      for (const record of performanceRecords) {
        await record.update((r: any) => {
          r.archived = false;
        });
      }
    });

    console.log(`✅ Site "${this.name}" and all related data unarchived`);
  }

  /**
   * Update site details
   */
  async updateDetails(data: {
    name?: string;
    latitude?: number;
    longitude?: number;
    capacity?: string;
  }) {
    await this.update((site) => {
      if (data.name) site.name = data.name;
      if (data.latitude !== undefined) site.latitude = data.latitude;
      if (data.longitude !== undefined) site.longitude = data.longitude;
      if (data.capacity) site.capacity = data.capacity;
    });
  }
}
