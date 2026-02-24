/**
 * useSites Hook
 * 
 * Provides site data operations and queries.
 * Separates business logic from UI components.
 */

import { useCallback, useMemo } from 'react';
import { SITES as staticSites } from '../data/sites';
import { Site } from '../types';

/**
 * Hook for managing site data
 * Currently uses static data, but can be extended to fetch from API or local DB
 */
export const useSites = () => {
  // Convert static sites to typed array
  const sites = useMemo(() => staticSites || [], []);

  /**
   * Get a specific site by ID
   */
  const getSiteById = useCallback(
    (siteId: string): Site | undefined => {
      return sites.find((site) => site.id === siteId);
    },
    [sites]
  );

  /**
   * Get site name by ID (convenience method)
   */
  const getSiteName = useCallback(
    (siteId: string): string => {
      const site = getSiteById(siteId);
      return site?.name || 'Unknown Site';
    },
    [getSiteById]
  );

  /**
   * Search sites by name
   */
  const searchSitesByName = useCallback(
    (query: string): Site[] => {
      const lowerQuery = query.toLowerCase();
      return sites.filter((site) =>
        site.name.toLowerCase().includes(lowerQuery)
      );
    },
    [sites]
  );

  /**
   * Get sites within a certain radius of a location (in meters)
   */
  const getSitesNearby = useCallback(
    (latitude: number, longitude: number, radiusMeters: number = 5000): Site[] => {
      return sites.filter((site) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          site.location.lat,
          site.location.lng
        );
        return distance <= radiusMeters;
      });
    },
    [sites]
  );

  /**
   * Sort sites by distance from a location
   */
  const sortSitesByDistance = useCallback(
    (latitude: number, longitude: number): Array<Site & { distance: number }> => {
      return sites
        .map((site) => ({
          ...site,
          distance: calculateDistance(
            latitude,
            longitude,
            site.location.lat,
            site.location.lng
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
    },
    [sites]
  );

  /**
   * Get statistics about sites
   */
  const stats = useMemo(() => {
    if (!sites || sites.length === 0) {
      return {
        totalSites: 0,
        totalCapacityMW: 0,
        averageCapacityMW: 0,
      };
    }

    const totalCapacityMW = sites.reduce((sum, site) => {
      const capacity = parseFloat(site.capacity.replace(/[^\d.]/g, ''));
      return sum + capacity;
    }, 0);

    return {
      totalSites: sites.length,
      totalCapacityMW,
      averageCapacityMW: totalCapacityMW / sites.length,
    };
  }, [sites]);

  return {
    // Data
    sites,
    stats,

    // Queries
    getSiteById,
    getSiteName,
    searchSitesByName,
    getSitesNearby,
    sortSitesByDistance,
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};
