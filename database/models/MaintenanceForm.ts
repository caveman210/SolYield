/**
 * MaintenanceForm Model
 * 
 * WatermelonDB model for offline maintenance form persistence.
 * Handles all form data including site info, inspections, and evidence.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class MaintenanceForm extends Model {
  static table = 'maintenance_forms';
  
  static associations: Associations = {
    form_photos: { type: 'has_many', foreignKey: 'maintenance_form_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
    users: { type: 'belongs_to', key: 'user_id' },
  };

  // Form Metadata
  @field('form_id') formId!: string;
  @field('site_id') siteId!: string;
  @field('user_id') userId!: string;
  @field('technician_name') technicianName!: string;
  @field('timestamp') timestamp!: number;
  @field('completed') completed!: boolean;
  @field('archived') archived!: boolean;
  @field('synced') synced!: boolean;
  @field('synced_at') syncedAt?: number;

  // Site Information Section
  @field('inverter_serial') inverterSerial!: string;
  @field('current_generation') currentGeneration?: number;

  // Visual Inspection Section
  @field('panel_condition') panelCondition?: string;
  @field('wiring_integrity') wiringIntegrity?: string;
  @field('issues_observed') issuesObserved?: string; // JSON string

  // Evidence Section
  @field('site_photo_uri') sitePhotoUri?: string;
  @field('documents') documents?: string; // JSON string

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @children('form_photos') photos: any;

  /**
   * Parse issues observed from JSON string
   */
  get issuesObservedArray(): string[] {
    if (!this.issuesObserved) return [];
    try {
      return JSON.parse(this.issuesObserved);
    } catch {
      return [];
    }
  }

  /**
   * Parse documents from JSON string
   */
  get documentsArray(): string[] {
    if (!this.documents) return [];
    try {
      return JSON.parse(this.documents);
    } catch {
      return [];
    }
  }

  /**
   * Check if form is complete and ready for sync
   */
  get isReadyForSync(): boolean {
    return (
      this.completed &&
      !this.synced &&
      !!this.inverterSerial &&
      !!this.sitePhotoUri
    );
  }

  /**
   * Mark form as synced
   */
  async markAsSynced() {
    await this.update((form) => {
      form.synced = true;
      form.syncedAt = Date.now();
    });
  }

  /**
   * Mark form as completed
   */
  async markAsCompleted() {
    await this.update((form) => {
      form.completed = true;
    });
  }

  /**
   * Update form data
   */
  async updateFormData(data: Partial<{
    inverterSerial: string;
    currentGeneration: number;
    panelCondition: string;
    wiringIntegrity: string;
    issuesObserved: string[];
    sitePhotoUri: string;
    documents: string[];
  }>) {
    await this.update((form) => {
      if (data.inverterSerial !== undefined) form.inverterSerial = data.inverterSerial;
      if (data.currentGeneration !== undefined) form.currentGeneration = data.currentGeneration;
      if (data.panelCondition !== undefined) form.panelCondition = data.panelCondition;
      if (data.wiringIntegrity !== undefined) form.wiringIntegrity = data.wiringIntegrity;
      if (data.issuesObserved !== undefined) {
        form.issuesObserved = JSON.stringify(data.issuesObserved);
      }
      if (data.sitePhotoUri !== undefined) form.sitePhotoUri = data.sitePhotoUri;
      if (data.documents !== undefined) {
        form.documents = JSON.stringify(data.documents);
      }
    });
  }
}
