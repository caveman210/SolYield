import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Site } from '../types';

export const GEOFENCE_RADIUS_METERS = 50; // 50 meters radius

interface GeofencingResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

export const useGeofencing = () => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, []);

  const getDistanceToSite = useCallback(
    (site: Site) => {
      if (!currentLocation) return null;

      const lat1 = currentLocation.coords.latitude;
      const lon1 = currentLocation.coords.longitude;
      const lat2 = site.location.lat;
      const lon2 = site.location.lng;

      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    [currentLocation]
  );

  const checkInAtSite = useCallback(
    async (site: Site): Promise<GeofencingResult> => {
      const distance = getDistanceToSite(site);
      if (distance === null) {
        return { success: false, error: 'Unable to determine location' };
      }

      if (distance > GEOFENCE_RADIUS_METERS) {
        return { success: false, error: `Too far from site (${Math.round(distance)}m away)` };
      }

      // Here you would typically create an activity record
      // For now, return a mock activity ID
      const activityId = `activity_${Date.now()}`;
      return { success: true, activityId };
    },
    [getDistanceToSite]
  );

  return {
    currentLocation,
    getCurrentLocation,
    getDistanceToSite,
    checkInAtSite,
    GEOFENCE_RADIUS_METERS,
  };
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};
