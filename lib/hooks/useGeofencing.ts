import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useGeofencing, formatDistance } from '../hooks/useGeofencing';
import { Site } from '../types';

interface SiteMapProps {
  targetSite: Site;
  onCheckInSuccess?: (activityId: string) => void;
}

export const SiteMap: React.FC<SiteMapProps> = ({ targetSite, onCheckInSuccess }) => {
  const mapRef = useRef<MapView>(null);
  const { 
    currentLocation, 
    getCurrentLocation, 
    checkInAtSite, 
    getDistanceToSite,
    GEOFENCE_RADIUS_METERS // Export this from your hook
  } = useGeofencing();

  const distance = getDistanceToSite(targetSite);
  const isInside = distance !== null && distance <= GEOFENCE_RADIUS_METERS;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleCheckIn = async () => {
    const result = await checkInAtSite(targetSite);
    if (result.success && result.activityId) {
      onCheckInSuccess?.(result.activityId);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType="hybrid" // <--- ADD THIS LINE
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: targetSite.location.lat,
          longitude: targetSite.location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* The Geofence Visualization */}
        <Circle
          center={{
            latitude: targetSite.location.lat,
            longitude: targetSite.location.lng,
          }}
          radius={GEOFENCE_RADIUS_METERS}
          strokeColor={isInside ? 'rgba(76, 175, 80, 0.5)' : 'rgba(33, 150, 243, 0.5)'}
          fillColor={isInside ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.1)'}
        />

        {/* Site Marker */}
        <Marker
          coordinate={{
            latitude: targetSite.location.lat,
            longitude: targetSite.location.lng,
          }}
          title={targetSite.name}
          description={`Radius: ${GEOFENCE_RADIUS_METERS}m`}
        />
      </MapView>

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.infoCard}>
          <Text style={styles.distanceText}>
            {distance ? `Distance: ${formatDistance(distance)}` : 'Locating...'}
          </Text>
          <TouchableOpacity
            style={[styles.button, !isInside && styles.buttonDisabled]}
            disabled={!isInside}
            onPress={handleCheckIn}
          >
            <Text style={styles.buttonText}>
              {isInside ? 'Check In Now' : 'Too Far to Check In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    alignItems: 'center',
  },
  distanceText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonDisabled: { backgroundColor: '#bdbdbd' },
  buttonText: { color: 'white', fontWeight: '600' },
});
