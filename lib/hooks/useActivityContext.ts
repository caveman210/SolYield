import { useMemo } from 'react';
import { Activity, ActivityType, Site } from '../types';
import { useActivities } from './useActivityManager';
import { useSiteManagement } from './useSiteManagement';

export interface ActivityContextData {
  site?: Site;
  previousVisitCount: number;
  lastVisitTimestamp: number | null;
  description: string;
}

type ActivityContextMap = Record<string, ActivityContextData>;

const FALLBACK_DESCRIPTIONS: Record<ActivityType, (siteName?: string) => string> = {
  inspection: (siteName?: string) =>
    siteName ? `Inspection completed for ${siteName}` : 'Inspection logged for assigned site',
  'check-in': (siteName?: string) =>
    siteName ? `Checked in near ${siteName}` : 'Location check-in recorded',
  report: (siteName?: string) =>
    siteName ? `Performance report generated for ${siteName}` : 'Performance report created',
  schedule: (siteName?: string) =>
    siteName ? `Schedule updated for ${siteName}` : 'Schedule updated',
  maintenance: (siteName?: string) =>
    siteName ? `Maintenance logged for ${siteName}` : 'Maintenance activity recorded',
};

function buildFallbackDescription(activity: Activity, site?: Site): string {
  if (activity.description && activity.description.trim().length > 0) {
    return activity.description;
  }

  const siteName = activity.siteName ?? site?.name;
  const generator = FALLBACK_DESCRIPTIONS[activity.type];
  return generator ? generator(siteName) : 'Activity logged';
}

/**
 * Provides contextual metadata for a list of activities (site info, history, etc.)
 * Ensures the UI layer stays presentation-only.
 */
export function useActivityContextMap(targetActivities: Activity[]): ActivityContextMap {
  const { activities: allActivities } = useActivities();
  const { allSites } = useSiteManagement();

  const siteMap = useMemo(() => {
    const map = new Map<string, Site>();
    allSites.forEach((site) => map.set(site.id, site));
    return map;
  }, [allSites]);

  return useMemo(() => {
    const contextMap: ActivityContextMap = {};

    targetActivities.forEach((activity) => {
      const site = activity.siteId ? siteMap.get(activity.siteId) : undefined;

      const previousVisits = activity.siteId
        ? allActivities
            .filter(
              (record) =>
                record.siteId === activity.siteId &&
                record.timestamp < activity.timestamp &&
                record.id !== activity.id
            )
            .sort((a, b) => b.timestamp - a.timestamp)
        : [];

      const lastVisitTimestamp = previousVisits.length > 0 ? previousVisits[0].timestamp : null;

      contextMap[activity.id] = {
        site,
        previousVisitCount: previousVisits.length,
        lastVisitTimestamp,
        description: buildFallbackDescription(activity, site),
      };
    });

    return contextMap;
  }, [targetActivities, allActivities, siteMap]);
}
