/**
 * useGeofencing Hook
 *
 * Provides geofencing and location-based check-in functionality.
 * Separates business logic from UI components.
 */

import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Site } from '../types';
import { useActivities } from './useActivities';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface CheckInResult {
  success: boolean;
  distance: number;
  message: string;
  activityId?: string; // ID of the created activity for linking to schedule
}

const GEOFENCE_RADIUS_METERS = 500; // 500 meters as per requirement

/**
 * Hook for geofencing and location operations
 */
export const useGeofencing = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { addActivity } = useActivities();

  /**
   * Request location permissions
   */
  const requestLocationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        setLocationError('Location permission denied');
        Alert.alert('Permission Required', 'Location access is needed to check in at sites.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setLocationError('Failed to request location permissions');
      return false;
    }
  }, []);

  /**
   * Get current device location
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationState | null> => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setIsLoadingLocation(false);
        return null;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setLocationError('Location services are disabled');
        setIsLoadingLocation(false);
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [{ text: 'OK', style: 'cancel' }]
        );
        return null;
      }

      // Try multiple times with different accuracy levels for better compatibility
      let location = null;
      const accuracyLevels = [
        Location.Accuracy.BestForNavigation,
        Location.Accuracy.High,
        Location.Accuracy.Balanced,
        Location.Accuracy.Low,
      ];

      for (const accuracy of accuracyLevels) {
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy,
          });
          break; // Success, exit loop
        } catch (err: any) {
          console.log(`Failed with accuracy ${accuracy}:`, err.message);
          // Continue to next accuracy level
        }
      }

      if (!location) {
        // Last resort - try to get last known position
        location = await Location.getLastKnownPositionAsync({
          maxAge: 300000, // 5 minutes
          requiredAccuracy: 1000, // 1km
        });
      }

      if (!location) {
        throw new Error('Unable to get location with any accuracy level');
      }

      const locationState: LocationState = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      setCurrentLocation(locationState);
      setIsLoadingLocation(false);
      return locationState;
    } catch (error: any) {
      console.error('Error getting current location:', error);

      // Handle specific error types
      let errorMessage = 'Failed to get location';
      if (error?.message?.includes('settings') || error?.message?.includes('disabled')) {
        errorMessage = 'Location services are disabled. Please enable them in device settings.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (error?.message?.includes('permission')) {
        errorMessage = 'Location permission is required.';
      } else {
        errorMessage = 'Unable to get your location. Please check your device settings.';
      }

      setLocationError(errorMessage);
      setIsLoadingLocation(false);
      return null;
    }
  }, [requestLocationPermissions]);

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
    []
  );

  /**
   * Check if current location is within geofence of a site
   */
  const isWithinGeofence = useCallback(
    (
      site: Site,
      location?: LocationState,
      radiusMeters: number = GEOFENCE_RADIUS_METERS
    ): boolean => {
      const loc = location || currentLocation;
      if (!loc) return false;

      const distance = calculateDistance(
        loc.latitude,
        loc.longitude,
        site.location.lat,
        site.location.lng
      );

      return distance <= radiusMeters;
    },
    [currentLocation, calculateDistance]
  );

  /**
   * Get distance to a site from current location
   */
  const getDistanceToSite = useCallback(
    (site: Site, location?: LocationState): number | null => {
      const loc = location || currentLocation;
      if (!loc) return null;

      return calculateDistance(loc.latitude, loc.longitude, site.location.lat, site.location.lng);
    },
    [currentLocation, calculateDistance]
  );

  /**
   * Perform check-in at a site
   */
  const checkInAtSite = useCallback(
    async (site: Site): Promise<CheckInResult> => {
      try {
        // Get fresh location
        const location = await getCurrentLocation();
        if (!location) {
          return {
            success: false,
            distance: 0,
            message: 'Could not get your location',
          };
        }

        // Calculate distance
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          site.location.lat,
          site.location.lng
        );

        // Check if within geofence
        const withinFence = distance <= GEOFENCE_RADIUS_METERS;

        if (withinFence) {
          // Add activity for successful check-in
          const activityId = await addActivity({
            type: 'check-in',
            title: 'Site Check-in',
            description: `Checked in at ${site.name}`,
            siteId: site.id,
            icon: 'map-marker-check',
            metadata: {
              distance: Math.round(distance),
              accuracy: location.accuracy,
              timestamp: location.timestamp,
            },
          });

          return {
            success: true,
            distance,
            message: `Successfully checked in at ${site.name}!`,
            activityId, // Return the activity ID for linking to schedule
          };
        } else {
          return {
            success: false,
            distance,
            message: `You are ${Math.round(distance)}m away from ${site.name}. You need to be within ${GEOFENCE_RADIUS_METERS}m to check in.`,
          };
        }
      } catch (error) {
        console.error('Error checking in:', error);
        return {
          success: false,
          distance: 0,
          message: 'An error occurred while checking in',
        };
      }
    },
    [getCurrentLocation, calculateDistance, addActivity]
  );

  /**
   * Find nearest site to current location
   */
  const findNearestSite = useCallback(
    (sites: Site[], location?: LocationState): { site: Site; distance: number } | null => {
      const loc = location || currentLocation;
      if (!loc || sites.length === 0) return null;

      let nearest: { site: Site; distance: number } | null = null;

      for (const site of sites) {
        const distance = calculateDistance(
          loc.latitude,
          loc.longitude,
          site.location.lat,
          site.location.lng
        );

        if (!nearest || distance < nearest.distance) {
          nearest = { site, distance };
        }
      }

      return nearest;
    },
    [currentLocation, calculateDistance]
  );

  /**
   * Watch location changes (useful for real-time geofencing)
   */
  const startWatchingLocation = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) return null;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }, [requestLocationPermissions]);

  return {
    // State
    currentLocation,
    isLoadingLocation,
    locationError,

    // Actions
    getCurrentLocation,
    requestLocationPermissions,
    checkInAtSite,
    startWatchingLocation,

    // Queries
    isWithinGeofence,
    getDistanceToSite,
    findNearestSite,
    calculateDistance,
  };
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

/**
 * Get geofence status message
 */
export const getGeofenceStatusMessage = (
  distance: number,
  radiusMeters: number = GEOFENCE_RADIUS_METERS
): string => {
  if (distance <= radiusMeters) {
    return `You are at the site (${formatDistance(distance)} away)`;
  } else if (distance <= radiusMeters * 2) {
    return `You are ${formatDistance(distance)} away (need to be within ${formatDistance(radiusMeters)})`;
  } else {
    return `You are too far away (${formatDistance(distance)})`;
  }
};
