/**
 * Activity Model
 * 
 * Tracks all user activities: inspections, check-ins, reports, schedules, maintenance.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type ActivityType = 'inspection' | 'check-in' | 'report' | 'schedule' | 'maintenance';

export default class Activity extends Model {
  static table = 'activities';

  static associations: Associations = {
    sites: { type: 'belongs_to', key: 'site_id' },
    users: { type: 'belongs_to', key: 'user_id' },
  };

  @field('type') type!: ActivityType;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('site_id') siteId?: string;
  @field('site_name') siteName?: string;
  @field('timestamp') timestamp!: number;
  @field('icon') icon!: string;
  @field('metadata') metadata?: string; // JSON string
  @field('user_id') userId?: string;
  @field('archived') archived!: boolean;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Parse metadata from JSON
   */
  get metadataObject(): Record<string, any> {
    if (!this.metadata) return {};
    try {
      return JSON.parse(this.metadata);
    } catch {
      return {};
    }
  }

  /**
   * Mark as synced
   */
  async markAsSynced() {
    await this.update((activity) => {
      activity.synced = true;
    });
  }

  /**
   * Update activity details
   */
  async updateActivity(data: {
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    await this.update((activity) => {
      if (data.title) activity.title = data.title;
      if (data.description !== undefined) activity.description = data.description;
      if (data.metadata) activity.metadata = JSON.stringify(data.metadata);
    });
  }
}
