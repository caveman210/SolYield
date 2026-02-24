/**
 * Add Site Screen
 * 
 * Form for creating new sites with interactive map location picker.
 * Users can tap on map to select latitude/longitude coordinates.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSiteManagement } from '../lib/hooks/useSiteManagement';

export default function AddSiteScreen() {
  const { createSite } = useSiteManagement();

  // Form state
  const [siteName, setSiteName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map state
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 20.5937, // Center of India
    longitude: 78.9629,
    latitudeDelta: 15,
    longitudeDelta: 15,
  });

  /**
   * Get user's current location and center map
   */
  const useCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setMapRegion(newRegion);
      setSelectedLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  }, []);

  /**
   * Handle map press to select location
   */
  const handleMapPress = useCallback((event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({
      lat: latitude,
      lng: longitude,
    });
  }, []);

  /**
   * Validate form and submit
   */
  const handleSubmit = useCallback(() => {
    // Validation
    if (!siteName.trim()) {
      Alert.alert('Validation Error', 'Please enter a site name.');
      return;
    }

    if (!capacity.trim()) {
      Alert.alert('Validation Error', 'Please enter the site capacity.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Validation Error', 'Please select a location on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create site
      createSite({
        name: siteName.trim(),
        capacity: capacity.trim(),
        location: selectedLocation,
      });

      Alert.alert(
        'Success',
        `Site "${siteName}" has been created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating site:', error);
      Alert.alert('Error', 'Failed to create site. Please try again.');
      setIsSubmitting(false);
    }
  }, [siteName, capacity, selectedLocation, createSite]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Site</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Site Information</Text>

          {/* Site Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Site Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Solar Park Alpha"
              value={siteName}
              onChangeText={setSiteName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Capacity Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Capacity *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500 MW"
              value={capacity}
              onChangeText={setCapacity}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.hint}>Include units (e.g., MW, kW)</Text>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Location *</Text>
            <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#3B82F6" />
              <Text style={styles.locationButtonText}>Use My Location</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.mapInstructions}>Tap on the map to select site location</Text>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                  }}
                  title={siteName || 'New Site'}
                  pinColor="#EF4444"
                />
              )}
            </MapView>
          </View>

          {/* Coordinates Display */}
          {selectedLocation && (
            <View style={styles.coordinatesBox}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
              <View style={styles.coordinatesText}>
                <Text style={styles.coordinateLabel}>Selected Coordinates:</Text>
                <Text style={styles.coordinateValue}>
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating Site...' : 'Create Site'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFF',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  mapSection: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  mapInstructions: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  coordinatesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  coordinatesText: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
