/**
 * Add Site Screen
 *
 * Form for creating new sites with location coordinates.
 * Users can manually enter coordinates or use their current location.
 *
 * NOTE: Map view removed temporarily to avoid Google Maps API key requirement.
 * Using simple coordinate input fields instead - works on all platforms without API keys.
 * If you need visual map in the future, uncomment the react-native-maps code at the bottom.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSiteManagement } from '../lib/hooks/useSiteManagement';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import M3ErrorDialog from './components/M3ErrorDialog';

/*
 * OLD CODE - react-native-maps (requires Google Maps API key on Android)
 * Keeping this commented for future reference if you want to add visual map back
 *
 * import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
 *
 * Then you'll need to:
 * 1. Get Google Maps API key from Google Cloud Console
 * 2. Add to app.json:
 *    "android": {
 *      "config": {
 *        "googleMaps": {
 *          "apiKey": "YOUR_API_KEY_HERE"
 *        }
 *      }
 *    }
 */

export default function AddSiteScreen() {
  const { createSite } = useSiteManagement();
  const colors = useMaterialYouColors();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  // Form state
  const [siteName, setSiteName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const useCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDialogConfig({
          visible: true,
          title: 'Permission Denied',
          message: 'Location permission is required to use this feature.',
          type: 'error',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));

      setDialogConfig({
        visible: true,
        title: 'Success',
        message: 'Current location has been filled in!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setDialogConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to get current location. Please try again.',
        type: 'error',
      });
    }
  }, []);

  const openGoogleMaps = useCallback(() => {
    const lat = latitude || '20.5937';
    const lng = longitude || '78.9629';
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  }, [latitude, longitude]);

  const handleSubmit = useCallback(() => {
    if (!siteName.trim()) {
      setDialogConfig({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter a site name.',
        type: 'error',
      });
      return;
    }

    if (!capacity.trim()) {
      setDialogConfig({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter the site capacity.',
        type: 'error',
      });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setDialogConfig({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter a valid latitude between -90 and 90.',
        type: 'error',
      });
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setDialogConfig({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter a valid longitude between -180 and 180.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      createSite({
        name: siteName.trim(),
        capacity: capacity.trim(),
        location: { lat, lng },
        createdAt: Date.now(),
      });

      setDialogConfig({
        visible: true,
        title: 'Success',
        message: `Site "${siteName}" has been created successfully!`,
        type: 'success',
        onConfirm: () => {
          // If returnTo param is provided, navigate back with returnFrom param
          if (returnTo === 'add-visit') {
            router.push('/add-visit?returnFrom=add-site' as any);
          } else {
            router.back();
          }
        },
      });
    } catch (error) {
      console.error('Error creating site:', error);
      setDialogConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to create site. Please try again.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  }, [siteName, capacity, latitude, longitude, createSite, returnTo]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add New Site',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.formSection, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Site Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Site Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.outline,
                    color: colors.onSurface,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="e.g., Solar Park Alpha"
                value={siteName}
                onChangeText={setSiteName}
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Capacity *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.outline,
                    color: colors.onSurface,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="e.g., 500 MW"
                value={capacity}
                onChangeText={setCapacity}
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <Text style={[styles.hint, { color: colors.outline }]}>
                Include units (e.g., MW, kW)
              </Text>
            </View>
          </View>

          <View style={[styles.locationSection, { backgroundColor: colors.surfaceContainer }]}>
            <View style={styles.locationHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Location *</Text>
              <TouchableOpacity
                style={[styles.locationButton, { backgroundColor: colors.primaryContainer }]}
                onPress={useCurrentLocation}
              >
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={18}
                  color={colors.onPrimaryContainer}
                />
                <Text style={[styles.locationButtonText, { color: colors.onPrimaryContainer }]}>
                  Use My Location
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.locationInstructions, { color: colors.onSurfaceVariant }]}>
              Enter coordinates manually or use your current location
            </Text>

            {/* Coordinate Input Fields */}
            <View style={styles.coordinateInputs}>
              <View style={styles.coordinateInputGroup}>
                <Text style={[styles.coordinateLabel, { color: colors.onSurfaceVariant }]}>
                  Latitude *
                </Text>
                <TextInput
                  style={[
                    styles.coordinateInput,
                    {
                      borderColor: colors.outline,
                      color: colors.onSurface,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholder="28.6139"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
                <Text style={[styles.coordinateHint, { color: colors.outline }]}>-90 to 90</Text>
              </View>
              <View style={styles.coordinateInputGroup}>
                <Text style={[styles.coordinateLabel, { color: colors.onSurfaceVariant }]}>
                  Longitude *
                </Text>
                <TextInput
                  style={[
                    styles.coordinateInput,
                    {
                      borderColor: colors.outline,
                      color: colors.onSurface,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholder="77.2090"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
                <Text style={[styles.coordinateHint, { color: colors.outline }]}>-180 to 180</Text>
              </View>
            </View>

            {/* View on Map Button */}
            {latitude && longitude && (
              <TouchableOpacity
                style={[styles.mapButton, { backgroundColor: colors.secondaryContainer }]}
                onPress={openGoogleMaps}
              >
                <MaterialCommunityIcons
                  name="map-search"
                  size={20}
                  color={colors.onSecondaryContainer}
                />
                <Text style={[styles.mapButtonText, { color: colors.onSecondaryContainer }]}>
                  View on Google Maps
                </Text>
                <MaterialCommunityIcons
                  name="open-in-new"
                  size={16}
                  color={colors.onSecondaryContainer}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.tertiaryContainer }]}>
            <MaterialCommunityIcons name="information" size={20} color={colors.tertiary} />
            <Text style={[styles.infoText, { color: colors.onTertiaryContainer }]}>
              You can find coordinates by searching your location on Google Maps and copying the
              latitude/longitude values.
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="solar-power-variant"
                size={24}
                color={colors.onPrimary}
              />
              <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                {isSubmitting ? 'Creating Site...' : 'Create Site'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* M3ErrorDialog */}
      <M3ErrorDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig({ ...dialogConfig, visible: false });
        }}
        confirmText="OK"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  locationSection: {
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  locationInstructions: {
    fontSize: 13,
    marginBottom: 16,
  },
  coordinateInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coordinateInputGroup: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  coordinateInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  coordinateHint: {
    fontSize: 11,
    marginTop: 4,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
