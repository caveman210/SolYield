/**
 * Schedule Model
 * 
 * Site visit scheduling and planning.
 * 
 * Supports two types of visits:
 * 1. Site visits: Must have valid site_id
 * 2. Requiem visits: Not linked to a specific site, marked with is_requiem=true
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';

export default class Schedule extends Model {
  static table = 'schedules';

  static associations: Associations = {
    sites: { type: 'belongs_to', key: 'site_id' },
    users: { type: 'belongs_to', key: 'assigned_user_id' },
  };

  @field('site_id') siteId?: string; // Optional for requiem visits
  @field('date') date!: string; // YYYY-MM-DD
  @field('time') time!: string; // HH:MM AM/PM
  @field('title') title!: string;
  @field('description') description?: string;
  @field('assigned_user_id') assignedUserId?: string;
  @field('status') status!: ScheduleStatus;
  @field('completed_at') completedAt?: number;
  
  // Check-in/Check-out tracking
  @field('checked_in_at') checkedInAt?: number;
  @field('checked_out_at') checkedOutAt?: number;
  @field('actual_duration_minutes') actualDurationMinutes?: number;
  @field('activity_id') activityId?: string; // Link to Activity record
  
  // Requiem visit fields
  @field('is_requiem') isRequiem!: boolean;
  @field('requiem_reason') requiemReason?: string;
  @field('linked_site_id') linkedSiteId?: string; // Optional site reference for context
  
  @field('archived') archived!: boolean;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Get full datetime string
   */
  get dateTime(): string {
    return `${this.date} ${this.time}`;
  }

  /**
   * Check if schedule is in the past
   */
  get isPast(): boolean {
    const scheduleDate = new Date(`${this.date} ${this.time}`);
    return scheduleDate < new Date();
  }

  /**
   * Check if schedule is today
   */
  get isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * Check if currently checked in (checked in but not checked out yet)
   */
  get isCheckedIn(): boolean {
    return !!this.checkedInAt && !this.checkedOutAt;
  }

  /**
   * Mark as checked in and link to activity
   */
  async markAsCheckedIn(activityId: string) {
    await this.update((schedule) => {
      schedule.checkedInAt = Date.now();
      schedule.activityId = activityId;
      schedule.synced = false;
    });
  }

  /**
   * Mark as checked out and calculate duration
   */
  async markAsCheckedOut() {
    await this.update((schedule) => {
      schedule.checkedOutAt = Date.now();
      
      // Calculate duration in minutes
      if (schedule.checkedInAt) {
        const durationMs = Date.now() - schedule.checkedInAt;
        schedule.actualDurationMinutes = Math.round(durationMs / 60000);
      }
      
      schedule.synced = false;
    });
  }

  /**
   * Mark as completed
   */
  async markAsCompleted() {
    await this.update((schedule) => {
      schedule.status = 'completed';
      schedule.completedAt = Date.now();
    });
  }

  /**
   * Mark as cancelled
   */
  async markAsCancelled() {
    await this.update((schedule) => {
      schedule.status = 'cancelled';
    });
  }

  /**
   * Mark as synced
   */
  async markAsSynced() {
    await this.update((schedule) => {
      schedule.synced = true;
    });
  }

  /**
   * Update schedule details
   */
  async updateSchedule(data: {
    date?: string;
    time?: string;
    title?: string;
    description?: string;
    assignedUserId?: string;
  }) {
    await this.update((schedule) => {
      if (data.date) schedule.date = data.date;
      if (data.time) schedule.time = data.time;
      if (data.title) schedule.title = data.title;
      if (data.description !== undefined) schedule.description = data.description;
      if (data.assignedUserId !== undefined) schedule.assignedUserId = data.assignedUserId;
    });
  }

  /**
   * Delete this schedule (hard delete)
   * 
   * This permanently removes the schedule from the database.
   * Does NOT affect the site or any other related data.
   */
  async deleteSchedule() {
    await this.collections.get('schedules').database.write(async () => {
      await this.markAsDeleted();
    });
    console.log(`✅ Schedule "${this.title}" deleted`);
  }
}
