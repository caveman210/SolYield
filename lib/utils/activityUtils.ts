import { Activity, ActivityType } from '../types';

/**
 * Formats a timestamp into a relative time string
 * Pure utility function with no dependencies
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Gets the icon name for a specific activity type
 * Maps activity types to Material Community Icons
 */
export function getActivityIcon(type: ActivityType): string {
  const iconMap: Record<ActivityType, string> = {
    inspection: 'check-circle',
    'check-in': 'map-marker-check',
    report: 'file-document',
    schedule: 'calendar-check',
    maintenance: 'wrench',
  };
  return iconMap[type] || 'information';
}

/**
 * Gets the appropriate color role name for an activity type
 * Returns the color role string to be looked up in the theme
 */
export function getActivityColorRole(type: ActivityType): string {
  const colorMap: Record<ActivityType, string> = {
    inspection: 'tertiary',
    'check-in': 'secondary',
    report: 'primary',
    schedule: 'secondary',
    maintenance: 'error',
  };
  return colorMap[type] || 'primary';
}

/**
 * Creates a new activity object with generated ID and timestamp
 * Pure factory function
 */
export function createActivity(data: Omit<Activity, 'id' | 'timestamp' | 'synced'>): Activity {
  return {
    ...data,
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    synced: false,
  };
}

/**
 * Filters activities by type
 */
export function filterActivitiesByType(
  activities: Activity[],
  type: ActivityType | 'all'
): Activity[] {
  if (type === 'all') return activities;
  return activities.filter((activity) => activity.type === type);
}

/**
 * Filters activities by site ID
 */
export function filterActivitiesBySite(activities: Activity[], siteId: string): Activity[] {
  return activities.filter((activity) => activity.siteId === siteId);
}

/**
 * Sorts activities by timestamp (newest first)
 */
export function sortActivitiesByTimestamp(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Gets the most recent N activities
 */
export function getMostRecentActivities(activities: Activity[], limit: number = 5): Activity[] {
  return sortActivitiesByTimestamp(activities).slice(0, limit);
}

/**
 * Gets unsynced activities that need to be sent to backend
 */
export function getUnsyncedActivities(activities: Activity[]): Activity[] {
  return activities.filter((activity) => !activity.synced);
}

/**
 * Groups activities by date for sectioned lists
 */
export function groupActivitiesByDate(activities: Activity[]): {
  title: string;
  data: Activity[];
}[] {
  const groups: { [key: string]: Activity[] } = {};
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  activities.forEach((activity) => {
    const diff = now - activity.timestamp;
    let groupKey: string;

    if (diff < oneDayMs) {
      groupKey = 'Today';
    } else if (diff < 2 * oneDayMs) {
      groupKey = 'Yesterday';
    } else if (diff < 7 * oneDayMs) {
      groupKey = 'This Week';
    } else if (diff < 30 * oneDayMs) {
      groupKey = 'This Month';
    } else {
      groupKey = 'Older';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(activity);
  });

  // Convert to array format for SectionList
  const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
  return order
    .filter((key) => groups[key])
    .map((key) => ({
      title: key,
      data: groups[key],
    }));
}
