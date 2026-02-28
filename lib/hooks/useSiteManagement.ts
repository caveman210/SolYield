/**
 * useSiteManagement Hook
 * 
 * Provides site management operations (CRUD) using WatermelonDB.
 * Combines built-in sites with user-created sites.
 */

import { useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { getSitesCollection, getActivitiesCollection, database as db } from '../../database';
import SiteModel from '../../database/models/Site';
import { useSites } from './useSites';
import { Site as LegacySite } from '../types';

/**
 * Convert WatermelonDB Site model to legacy Site type for UI compatibility.
 */
function convertSiteModel(model: SiteModel): LegacySite {
  return {
    id: model.id,
    name: model.name,
    location: {
      lat: model.latitude,
      lng: model.longitude,
    },
    capacity: model.capacity,
    createdAt: model.createdAt.getTime(),
  };
}

/**
 * Hook for managing sites (create, update, delete, query)
 */
export const useSiteManagement = () => {
  const database = useDatabase();
  const { sites, isLoading, totalCount, userCreatedCount, builtInCount } = useSites();

  /**
   * Get all sites (built-in + user-created) converted to legacy format
   */
  const getAllSites = useCallback((): LegacySite[] => {
    return sites.map(convertSiteModel);
  }, [sites]);

  /**
   * Get user-created sites only (converted to legacy format)
   */
  const getUserSites = useCallback((): LegacySite[] => {
    return sites.filter((s) => s.isUserCreated).map(convertSiteModel);
  }, [sites]);

  /**
   * Create a new user site in WatermelonDB
   */
  const createSite = useCallback(
    async (siteData: Omit<LegacySite, 'id'>) => {
      try {
        await db.write(async () => {
          const sitesCollection = getSitesCollection();
          const activitiesCollection = getActivitiesCollection();

          // Create site
          const newSite = await sitesCollection.create((site) => {
            site.name = siteData.name;
            site.latitude = siteData.location.lat;
            site.longitude = siteData.location.lng;
            site.capacity = siteData.capacity;
            site.isUserCreated = true;
            site.synced = false;
          });

          // Create activity log
          await activitiesCollection.create((activity) => {
            activity.type = 'inspection'; // Using 'inspection' as closest match
            activity.title = 'New Site Added';
            activity.description = `Created site: ${siteData.name}`;
            activity.siteId = newSite.id;
            activity.siteName = siteData.name;
            activity.timestamp = Date.now();
            activity.icon = 'map-marker-plus';
            activity.metadata = JSON.stringify({});
            activity.synced = false;
          });
        });

        console.log(`✅ Site created: ${siteData.name}`);
        return true;
      } catch (error) {
        console.error('Error creating site:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Update an existing site
   */
  const editSite = useCallback(
    async (siteData: LegacySite) => {
      try {
        // Only allow editing user-created sites
        const site = sites.find((s) => s.id === siteData.id);
        if (!site) {
          console.warn('Site not found');
          return false;
        }

        if (!site.isUserCreated) {
          console.warn('Cannot edit built-in sites');
          return false;
        }

        await db.write(async () => {
          const activitiesCollection = getActivitiesCollection();

          // Update site
          await site.updateDetails({
            name: siteData.name,
            latitude: siteData.location.lat,
            longitude: siteData.location.lng,
            capacity: siteData.capacity,
          });

          // Create activity log
          await activitiesCollection.create((activity) => {
            activity.type = 'inspection';
            activity.title = 'Site Updated';
            activity.description = `Updated site: ${siteData.name}`;
            activity.siteId = siteData.id;
            activity.siteName = siteData.name;
            activity.timestamp = Date.now();
            activity.icon = 'map-marker-check';
            activity.metadata = JSON.stringify({});
            activity.synced = false;
          });
        });

        console.log(`✅ Site updated: ${siteData.name}`);
        return true;
      } catch (error) {
        console.error('Error updating site:', error);
        throw error;
      }
    },
    [sites]
  );

  /**
   * Delete a site
   */
  const removeSite = useCallback(
    async (siteId: string, siteName?: string) => {
      try {
        const site = sites.find((s) => s.id === siteId);
        if (!site) {
          console.warn('Site not found');
          return false;
        }

        if (!site.isUserCreated) {
          console.warn('Cannot delete built-in sites');
          return false;
        }

        await db.write(async () => {
          const activitiesCollection = getActivitiesCollection();

          // Create activity log before deletion
          await activitiesCollection.create((activity) => {
            activity.type = 'inspection';
            activity.title = 'Site Deleted';
            activity.description = `Deleted site: ${siteName || site.name}`;
            activity.siteId = '';
            activity.siteName = siteName || site.name;
            activity.timestamp = Date.now();
            activity.icon = 'map-marker-remove';
            activity.metadata = JSON.stringify({});
            activity.synced = false;
          });

          // Delete site
          await site.markAsDeleted();
        });

        console.log(`✅ Site deleted: ${siteName || site.name}`);
        return true;
      } catch (error) {
        console.error('Error deleting site:', error);
        throw error;
      }
    },
    [sites]
  );

  /**
   * Check if a site can be edited/deleted (must be user-created)
   */
  const canModifySite = useCallback(
    (siteId: string): boolean => {
      const site = sites.find((s) => s.id === siteId);
      return site?.isUserCreated ?? false;
    },
    [sites]
  );

  /**
   * Get site by ID (converted to legacy format)
   */
  const getSiteById = useCallback(
    (siteId: string): LegacySite | undefined => {
      const site = sites.find((s) => s.id === siteId);
      return site ? convertSiteModel(site) : undefined;
    },
    [sites]
  );

  return {
    // Data
    userSites: getUserSites(),
    allSites: getAllSites(),
    isLoading,
    totalCount,
    userCreatedCount,
    builtInCount,

    // Actions
    createSite,
    editSite,
    removeSite,
    canModifySite,
    getSiteById,
  };
};
