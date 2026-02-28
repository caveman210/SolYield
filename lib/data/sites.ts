import { Site } from '../types';

export const SITES: Site[] = [
  {
    id: 'site_01',
    name: 'Bhadla Solar Park',
    location: { lat: 27.5362, lng: 71.9167 },
    capacity: '2245 MW',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
  },
  {
    id: 'site_02',
    name: 'Pavagada Solar Park',
    location: { lat: 14.1666, lng: 77.4333 },
    capacity: '2050 MW',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
  },
  {
    id: 'site_03',
    name: 'Kurnool Ultra Mega Solar Park',
    location: { lat: 15.6815, lng: 78.1516 },
    capacity: '1000 MW',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
  },
  {
    id: 'site_04',
    name: 'Rewa Ultra Mega Solar Park',
    location: { lat: 24.5204, lng: 81.2979 },
    capacity: '750 MW',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  },
];
