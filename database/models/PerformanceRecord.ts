/**
 * PerformanceRecord Model
 * 
 * Daily energy generation and performance tracking per site.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type PerformanceStatus = 'over' | 'normal' | 'under' | 'zero' | 'no_data';

export default class PerformanceRecord extends Model {
  static table = 'performance_records';

  static associations: Associations = {
    sites: { type: 'belongs_to', key: 'site_id' },
  };

  @field('site_id') siteId!: string;
  @field('date') date!: string; // YYYY-MM-DD
  @field('energy_generated_kwh') energyGeneratedKwh!: number;
  @field('peak_power') peakPower?: number;
  @field('efficiency_percentage') efficiencyPercentage?: number;
  @field('status') status!: PerformanceStatus;
  @field('archived') archived!: boolean;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Check if performance is acceptable
   */
  get isAcceptable(): boolean {
    return this.status === 'over' || this.status === 'normal';
  }

  /**
   * Get performance color indicator
   */
  get performanceColor(): string {
    switch (this.status) {
      case 'over':
        return '#66BB6A'; // Green
      case 'normal':
        return '#42A5F5'; // Blue
      case 'under':
        return '#FFA726'; // Orange
      case 'zero':
        return '#EF5350'; // Red
      case 'no_data':
        return '#9E9E9E'; // Gray
      default:
        return '#9E9E9E';
    }
  }

  /**
   * Mark as synced
   */
  async markAsSynced() {
    await this.update((record) => {
      record.synced = true;
    });
  }

  /**
   * Update performance data
   */
  async updatePerformance(data: {
    energyGeneratedKwh?: number;
    peakPower?: number;
    efficiencyPercentage?: number;
    status?: PerformanceStatus;
  }) {
    await this.update((record) => {
      if (data.energyGeneratedKwh !== undefined) {
        record.energyGeneratedKwh = data.energyGeneratedKwh;
      }
      if (data.peakPower !== undefined) record.peakPower = data.peakPower;
      if (data.efficiencyPercentage !== undefined) {
        record.efficiencyPercentage = data.efficiencyPercentage;
      }
      if (data.status) record.status = data.status;
    });
  }
}
