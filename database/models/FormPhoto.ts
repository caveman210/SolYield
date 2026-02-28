/**
 * FormPhoto Model
 * 
 * WatermelonDB model for managing photos associated with maintenance forms.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import MaintenanceForm from './MaintenanceForm';

export default class FormPhoto extends Model {
  static table = 'form_photos';
  
  static associations: Associations = {
    maintenance_forms: { type: 'belongs_to', key: 'maintenance_form_id' },
  };

  @field('maintenance_form_id') maintenanceFormId!: string;
  @field('photo_uri') photoUri!: string;
  @field('photo_type') photoType!: string; // 'site_photo' | 'evidence' | 'issue'
  @field('caption') caption?: string;
  @field('timestamp') timestamp!: number;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('maintenance_forms', 'maintenance_form_id') maintenanceForm: any;

  /**
   * Mark photo as synced
   */
  async markAsSynced() {
    await this.update((photo) => {
      photo.synced = true;
    });
  }
}
