/**
 * useSiteManagement Hook
 * 
 * Provides site management operations (CRUD).
 * Integrates with Redux and combines static + user sites.
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addSite,
  updateSite,
  deleteSite,
  selectUserSites,
  selectUserSiteById,
} from '../../store/slices/siteSlice';
import { addActivity } from '../../store/slices/activitySlice';
import { Site } from '../types';
import { SITES as STATIC_SITES } from '../data/sites';

/**
 * Hook for managing sites (create, update, delete)
 */
export const useSiteManagement = () => {
  const dispatch = useDispatch();
  const userSites = useSelector(selectUserSites);

  /**
   * Get all sites (static + user-created)
   */
  const getAllSites = useCallback((): Site[] => {
    return [...STATIC_SITES, ...userSites];
  }, [userSites]);

  /**
   * Create a new site
   */
  const createSite = useCallback(
    (siteData: Omit<Site, 'id'>) => {
      dispatch(addSite(siteData));

      // Add activity to feed
      dispatch(
        addActivity({
          type: 'schedule',
          title: 'New Site Added',
          description: `Created site: ${siteData.name}`,
          siteName: siteData.name,
          icon: 'map-marker-plus',
        })
      );

      return true;
    },
    [dispatch]
  );

  /**
   * Update an existing user site
   */
  const editSite = useCallback(
    (siteData: Site) => {
      // Only allow editing user-created sites
      const isUserSite = userSites.some((s) => s.id === siteData.id);
      if (!isUserSite) {
        console.warn('Cannot edit static sites');
        return false;
      }

      dispatch(updateSite(siteData));

      // Add activity to feed
      dispatch(
        addActivity({
          type: 'schedule',
          title: 'Site Updated',
          description: `Updated site: ${siteData.name}`,
          siteId: siteData.id,
          siteName: siteData.name,
          icon: 'map-marker-check',
        })
      );

      return true;
    },
    [dispatch, userSites]
  );

  /**
   * Delete a user site
   */
  const removeSite = useCallback(
    (siteId: string, siteName?: string) => {
      // Only allow deleting user-created sites
      const isUserSite = userSites.some((s) => s.id === siteId);
      if (!isUserSite) {
        console.warn('Cannot delete static sites');
        return false;
      }

      dispatch(deleteSite(siteId));

      // Add activity to feed
      dispatch(
        addActivity({
          type: 'schedule',
          title: 'Site Deleted',
          description: `Deleted site: ${siteName || 'Unknown Site'}`,
          icon: 'map-marker-remove',
        })
      );

      return true;
    },
    [dispatch, userSites]
  );

  /**
   * Check if a site can be edited/deleted
   */
  const canModifySite = useCallback(
    (siteId: string): boolean => {
      return userSites.some((s) => s.id === siteId);
    },
    [userSites]
  );

  /**
   * Get site by ID (checks both static and user sites)
   */
  const getSiteById = useCallback(
    (siteId: string): Site | undefined => {
      const allSites = getAllSites();
      return allSites.find((s) => s.id === siteId);
    },
    [getAllSites]
  );

  return {
    // Data
    userSites,
    allSites: getAllSites(),

    // Actions
    createSite,
    editSite,
    removeSite,
    canModifySite,
    getSiteById,
  };
};
