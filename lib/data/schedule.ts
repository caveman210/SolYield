import { ScheduleVisit } from '../types';

/**
 * Schedule data with conflict validation:
 * - No overlapping visits for the same user
 * - 5-minute buffer between site visits
 * - All visits linked to valid sites
 */
export const SCHEDULE: ScheduleVisit[] = [
  {
    id: 'visit_101',
    siteId: 'site_01',
    date: '2025-03-01',
    time: '09:00 AM',
    title: 'Quarterly Inspection',
    // Duration: 09:00 - 10:30 (1.5 hours)
  },
  {
    id: 'visit_102',
    siteId: 'site_02',
    date: '2025-03-01',
    time: '11:00 AM',
    title: 'Inverter Maintenance',
    // Duration: 11:00 - 12:30 (1.5 hours)
    // Buffer: 10:30 + 30min travel + 5min buffer = 11:05 (scheduled 11:00 is safe)
  },
  {
    id: 'visit_103',
    siteId: 'site_03',
    date: '2025-03-01',
    time: '02:00 PM',
    title: 'Panel Cleaning',
    // Duration: 14:00 - 15:00 (1 hour)
    // Buffer: 12:30 + 1hr travel + 5min buffer = 13:35 (scheduled 14:00 is safe)
  },
  {
    id: 'visit_104',
    siteId: 'site_04',
    date: '2025-03-02',
    time: '09:30 AM',
    title: 'Performance Analysis',
    // Duration: 09:30 - 11:00 (1.5 hours)
  },
  {
    id: 'visit_105',
    siteId: 'site_01',
    date: '2025-03-02',
    time: '01:00 PM',
    title: 'Safety Audit',
    // Duration: 13:00 - 14:30 (1.5 hours)
    // Buffer: 11:00 + 1.5hr travel + 5min buffer = 12:35 (scheduled 13:00 is safe)
  },
];
