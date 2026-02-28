/**
 * User Model
 * 
 * Authentication and role-based access control model.
 * Supports 'engineer' and 'client' (boss) roles.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type UserRole = 'engineer' | 'client';

export default class User extends Model {
  static table = 'users';

  @field('username') username!: string;
  @field('password_hash') passwordHash!: string;
  @field('full_name') fullName!: string;
  @field('role') role!: UserRole;
  @field('email') email?: string;
  @field('phone') phone?: string;
  @field('avatar_uri') avatarUri?: string;
  @field('last_login') lastLogin?: number;
  @field('is_active') isActive!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Check if user is an engineer (field technician)
   */
  get isEngineer(): boolean {
    return this.role === 'engineer';
  }

  /**
   * Check if user is a client (boss/manager)
   */
  get isClient(): boolean {
    return this.role === 'client';
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin() {
    await this.update((user) => {
      user.lastLogin = Date.now();
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUri?: string;
  }) {
    await this.update((user) => {
      if (data.fullName) user.fullName = data.fullName;
      if (data.email !== undefined) user.email = data.email;
      if (data.phone !== undefined) user.phone = data.phone;
      if (data.avatarUri !== undefined) user.avatarUri = data.avatarUri;
    });
  }

  /**
   * Deactivate user account
   */
  async deactivate() {
    await this.update((user) => {
      user.isActive = false;
    });
  }

  /**
   * Activate user account
   */
  async activate() {
    await this.update((user) => {
      user.isActive = true;
    });
  }
}
