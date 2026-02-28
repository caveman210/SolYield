import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import Site from '../../database/models/Site';
import { getSitesCollection, database as db, getSchedulesCollection, getMaintenanceFormsCollection, getActivitiesCollection, getPerformanceRecordsCollection } from '../../database';

export interface UseSitesResult {
  sites: Site[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  userCreatedCount: number;
  builtInCount: number;
  getSiteName: (siteId: string) => string;
  getSiteById: (siteId: string) => Site | undefined;
  refresh: () => void;
  // CRUD operations
  createSite: (data: CreateSiteData) => Promise<Site>;
  updateSite: (id: string, data: Partial<CreateSiteData>) => Promise<Site>;
  deleteSite: (id: string, cascade?: boolean) => Promise<void>;
  archiveSite: (id: string) => Promise<void>;
  unarchiveSite: (id: string) => Promise<void>;
}

export interface CreateSiteData {
  name: string;
  capacity: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  description?: string;
}

/**
 * Hook to query all sites from WatermelonDB.
 * Returns sites, loading state, and summary counts.
 * By default, only returns active (non-archived) sites.
 */
export function useSites(includeArchived: boolean = false): UseSitesResult {
  const database = useDatabase();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadSites = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const sitesCollection = getSitesCollection();
        
        // Filter out archived sites unless explicitly requested
        const query = includeArchived
          ? sitesCollection.query()
          : sitesCollection.query(Q.where('archived', false));
        
        // Use observe() to make it reactive to database changes
        const subscription = query.observe().subscribe((allSites) => {
          if (mounted) {
            setSites(allSites);
            setIsLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error loading sites:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = loadSites();

    return () => {
      mounted = false;
      unsubscribe?.then((unsub) => unsub?.());
    };
  }, [database, includeArchived, refreshTrigger]);

  // Calculate summary counts
  const userCreatedCount = sites.filter((site) => site.isUserCreated).length;
  const builtInCount = sites.filter((site) => !site.isUserCreated).length;
  const totalCount = sites.length;

  // Helper function to get site name by ID
  const getSiteName = (siteId: string): string => {
    const site = sites.find((s) => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  // Helper function to get site by ID
  const getSiteById = (siteId: string): Site | undefined => {
    return sites.find((s) => s.id === siteId);
  };

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  // CRUD Operations
  const createSite = useCallback(async (data: CreateSiteData): Promise<Site> => {
    try {
      const sitesCollection = getSitesCollection();
      
      // Generate unique ID for user-created site
      const siteId = `site_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newSite = await db.write(async () => {
        return await sitesCollection.create((site: any) => {
          site._raw.id = siteId;
          site.name = data.name;
          site.capacity = data.capacity;
          site.latitude = data.location.lat;
          site.longitude = data.location.lng;
          site.address = data.address || '';
          site.description = data.description || '';
          site.archived = false;
          site.archivedAt = null;
          site.isUserCreated = true; // Mark as user-created
        });
      });
      
      refresh();
      return newSite;
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  }, [refresh]);

  const updateSite = useCallback(async (
    id: string,
    data: Partial<CreateSiteData>
  ): Promise<Site> => {
    try {
      const sitesCollection = getSitesCollection();
      const site = await sitesCollection.find(id);
      
      if (!site) {
        throw new Error(`Site with ID ${id} not found`);
      }
      
      const updatedSite = await db.write(async () => {
        return await site.update((s: any) => {
          if (data.name !== undefined) s.name = data.name;
          if (data.capacity !== undefined) s.capacity = data.capacity;
          if (data.location?.lat !== undefined) s.latitude = data.location.lat;
          if (data.location?.lng !== undefined) s.longitude = data.location.lng;
          if (data.address !== undefined) s.address = data.address;
          if (data.description !== undefined) s.description = data.description;
        });
      });
      
      refresh();
      return updatedSite;
    } catch (error) {
      console.error('Error updating site:', error);
      throw error;
    }
  }, [refresh]);

  const deleteSite = useCallback(async (id: string, cascade: boolean = true): Promise<void> => {
    try {
      const sitesCollection = getSitesCollection();
      const site = await sitesCollection.find(id);
      
      if (!site) {
        throw new Error(`Site with ID ${id} not found`);
      }
      
      await db.write(async () => {
        if (cascade) {
          // Cascading delete: Remove all related data
          console.log(`Performing cascading delete for site ${id}`);
          
          // Delete associated schedules
          const schedulesCollection = getSchedulesCollection();
          const relatedSchedules = await schedulesCollection
            .query(Q.where('site_id', id))
            .fetch();
          
          for (const schedule of relatedSchedules) {
            await schedule.destroyPermanently();
          }
          console.log(`Deleted ${relatedSchedules.length} schedules`);
          
          // Delete associated maintenance forms
          const formsCollection = getMaintenanceFormsCollection();
          const relatedForms = await formsCollection
            .query(Q.where('site_id', id))
            .fetch();
          
          for (const form of relatedForms) {
            await form.destroyPermanently();
          }
          console.log(`Deleted ${relatedForms.length} maintenance forms`);
          
          // Delete associated activities
          const activitiesCollection = getActivitiesCollection();
          const relatedActivities = await activitiesCollection
            .query(Q.where('site_id', id))
            .fetch();
          
          for (const activity of relatedActivities) {
            await activity.destroyPermanently();
          }
          console.log(`Deleted ${relatedActivities.length} activities`);
          
          // Delete associated performance records
          const performanceCollection = getPerformanceRecordsCollection();
          const relatedPerformance = await performanceCollection
            .query(Q.where('site_id', id))
            .fetch();
          
          for (const record of relatedPerformance) {
            await record.destroyPermanently();
          }
          console.log(`Deleted ${relatedPerformance.length} performance records`);
        }
        
        // Finally, delete the site itself
        await site.destroyPermanently();
        console.log(`Site ${id} deleted permanently`);
      });
      
      refresh();
    } catch (error) {
      console.error('Error deleting site:', error);
      throw error;
    }
  }, [refresh]);

  const archiveSite = useCallback(async (id: string): Promise<void> => {
    try {
      const sitesCollection = getSitesCollection();
      const site = await sitesCollection.find(id);
      
      if (!site) {
        throw new Error(`Site with ID ${id} not found`);
      }
      
      await site.archive();
      refresh();
    } catch (error) {
      console.error('Error archiving site:', error);
      throw error;
    }
  }, [refresh]);

  const unarchiveSite = useCallback(async (id: string): Promise<void> => {
    try {
      const sitesCollection = getSitesCollection();
      const site = await sitesCollection.find(id);
      
      if (!site) {
        throw new Error(`Site with ID ${id} not found`);
      }
      
      await site.unarchive();
      refresh();
    } catch (error) {
      console.error('Error unarchiving site:', error);
      throw error;
    }
  }, [refresh]);

  return {
    sites,
    isLoading,
    error,
    totalCount,
    userCreatedCount,
    builtInCount,
    getSiteName,
    getSiteById,
    refresh,
    createSite,
    updateSite,
    deleteSite,
    archiveSite,
    unarchiveSite,
  };
}

/**
 * Hook to query a single site by ID from WatermelonDB.
 */
export function useSite(siteId: string | null) {
  const database = useDatabase();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSite = async () => {
      if (!siteId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const sitesCollection = getSitesCollection();
        const foundSite = await sitesCollection.find(siteId);

        if (mounted) {
          setSite(foundSite);
          setIsLoading(false);
        }
      } catch (err) {
        console.error(`Error loading site ${siteId}:`, err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadSite();

    return () => {
      mounted = false;
    };
  }, [database, siteId]);

  return {
    site,
    isLoading,
    error,
  };
}

/**
 * Hook to query only archived sites for analytics.
 */
export function useArchivedSites() {
  const database = useDatabase();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadArchivedSites = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const sitesCollection = getSitesCollection();
        const archivedSites = await sitesCollection
          .query(Q.where('archived', true))
          .fetch();

        if (mounted) {
          setSites(archivedSites);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading archived sites:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadArchivedSites();

    return () => {
      mounted = false;
    };
  }, [database]);

  return {
    sites,
    isLoading,
    error,
    count: sites.length,
  };
}
