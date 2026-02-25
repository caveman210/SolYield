import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { SITES } from '../../lib/data/sites';
import { calculateDistance, isWithinCheckInRadius, formatDistance } from '../../lib/utils/location';
import { M3Motion } from '../../lib/design';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHECK_IN_RADIUS = 500;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SiteDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useMaterialYouColors();
  const siteId = params.id as string;
  const site = SITES.find((s) => s.id === siteId);

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLoading(false);
        return;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setLocationError('Location services are disabled. Please enable them in device settings.');
        setLoading(false);
        return;
      }

      // Try multiple accuracy levels for better compatibility
      let location = null;
      const accuracyLevels = [
        Location.Accuracy.BestForNavigation,
        Location.Accuracy.High,
        Location.Accuracy.Balanced,
        Location.Accuracy.Low,
      ];

      for (const accuracy of accuracyLevels) {
        try {
          location = await Location.getCurrentPositionAsync({ accuracy });
          break;
        } catch (err) {
          console.log(`Failed with accuracy ${accuracy}`);
        }
      }

      if (!location) {
        // Last resort
        try {
          location = await Location.getLastKnownPositionAsync({
            maxAge: 300000,
            requiredAccuracy: 1000,
          });
        } catch (err) {
          console.log('Failed to get last known position');
        }
      }

      if (location) {
        setUserLocation(location);

        if (site) {
          const dist = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            site.location.lat,
            site.location.lng
          );
          setDistance(dist);
        }
      } else {
        setLocationError('Unable to get location. You can still view site info without location.');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error getting location:', error);

      let errorMessage = 'Unable to get location. You can still view site info.';
      if (error?.message?.includes('settings') || error?.message?.includes('disabled')) {
        errorMessage = 'Location services are disabled. You can still view site info.';
      } else if (error?.message?.includes('permission')) {
        errorMessage = 'Location permission denied. You can still view site info.';
      }

      setLocationError(errorMessage);
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!userLocation || !site) return;

    setCheckingIn(true);

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const withinRadius = isWithinCheckInRadius(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        site.location.lat,
        site.location.lng
      );

      const dist = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        site.location.lat,
        site.location.lng
      );

      if (withinRadius) {
        Alert.alert(
          'Check-in Successful!',
          `You have successfully checked in to ${site.name}.\n\nYour distance: ${formatDistance(dist)}`,
          [
            {
              text: 'View Performance',
              onPress: () => router.push(`/performance?siteId=${site.id}`),
            },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert(
          'Check-in Failed',
          `You are too far from ${site.name}.\n\nYour distance: ${formatDistance(dist)}\nRequired: within ${CHECK_IN_RADIUS}m`,
          [
            {
              text: 'Refresh Location',
              onPress: () => requestLocationPermission(),
            },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to verify your location. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleNavigate = () => {
    if (!site) return;

    Alert.alert('Navigate to Site', 'Choose navigation option:', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'In-App Navigation',
        onPress: () => router.push(`/map-navigation?siteId=${site.id}` as any),
      },
      {
        text: 'External Maps',
        onPress: () => {
          const label = encodeURIComponent(site.name);
          const url =
            Platform.OS === 'ios'
              ? `maps://app?daddr=${site.location.lat},${site.location.lng}`
              : `geo:0,0?q=${site.location.lat},${site.location.lng}(${label})`;

          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.location.lat},${site.location.lng}`;
                Linking.openURL(webUrl);
              }
            })
            .catch((err) => {
              console.error('Navigation error:', err);
              Alert.alert('Error', 'Unable to open maps application');
            });
        },
      },
    ]);
  };

  if (!site) {
    return (
      <SafeAreaView style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.onSurfaceVariant }]}>
          Site not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.backButtonText, { color: colors.onPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canCheckIn = userLocation && !locationError;
  const withinRadius =
    userLocation &&
    isWithinCheckInRadius(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      site.location.lat,
      site.location.lng
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Map Section */}
        <View style={[styles.mapContainer, { backgroundColor: colors.surfaceVariant }]}>
          {loading ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.mapPlaceholderText, { color: colors.onSurfaceVariant }]}>
                Loading map...
              </Text>
            </View>
          ) : locationError ? (
            <View style={styles.mapError}>
              <Ionicons name="location-outline" size={48} color={colors.outline} />
              <Text style={[styles.mapErrorText, { color: colors.onSurfaceVariant }]}>
                {locationError}
              </Text>
              <TouchableOpacity
                onPress={requestLocationPermission}
                style={[styles.enableLocationButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.enableLocationText, { color: colors.onPrimary }]}>
                  Enable Location
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: site.location.lat,
                longitude: site.location.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation
              showsMyLocationButton
            >
              <Marker
                coordinate={{
                  latitude: site.location.lat,
                  longitude: site.location.lng,
                }}
                title={site.name}
                description={site.capacity}
                pinColor={colors.primary}
              />
              <Circle
                center={{
                  latitude: site.location.lat,
                  longitude: site.location.lng,
                }}
                radius={CHECK_IN_RADIUS}
                fillColor={`${colors.primary}33`}
                strokeColor={`${colors.primary}80`}
                strokeWidth={2}
              />
              {userLocation && (
                <Marker
                  coordinate={{
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                  }}
                  title="Your Location"
                  pinColor={colors.tertiary}
                />
              )}
            </MapView>
          )}
        </View>

        {/* Site Information */}
        <View style={[styles.infoContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <Animated.View
            entering={FadeInUp.duration(M3Motion.duration.medium)}
            style={styles.siteHeader}
          >
            <Text style={[styles.siteName, { color: colors.onSurface }]}>{site.name}</Text>
            <View style={styles.capacityRow}>
              <View style={[styles.capacityIcon, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="flash" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.capacityText, { color: colors.onSurfaceVariant }]}>
                {site.capacity}
              </Text>
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(100)}
            style={styles.statsGrid}
          >
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surfaceContainer,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Latitude</Text>
                <Text style={[styles.statValue, { color: colors.onSurface }]}>
                  {site.location.lat.toFixed(4)}°
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surfaceContainer,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Longitude
                </Text>
                <Text style={[styles.statValue, { color: colors.onSurface }]}>
                  {site.location.lng.toFixed(4)}°
                </Text>
              </View>
            </View>

            {distance !== null && (
              <View
                style={[
                  styles.distanceCard,
                  {
                    backgroundColor: colors.surfaceContainer,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Your Distance
                </Text>
                <View style={styles.distanceRow}>
                  <Text
                    style={[
                      styles.distanceValue,
                      { color: withinRadius ? colors.primary : colors.error },
                    ]}
                  >
                    {formatDistance(distance)}
                  </Text>
                  {withinRadius && (
                    <View
                      style={[
                        styles.withinRangeBadge,
                        { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <Text style={[styles.withinRangeText, { color: colors.onPrimaryContainer }]}>
                        Within Range
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(200)}
            style={styles.actionsContainer}
          >
            {/* Check-in Button */}
            <AnimatedTouchableOpacity
              onPress={handleCheckIn}
              disabled={!canCheckIn || checkingIn}
              style={[
                styles.checkInButton,
                {
                  backgroundColor: withinRadius
                    ? colors.primary
                    : canCheckIn
                      ? colors.tertiary
                      : colors.surfaceContainerHigh,
                  shadowColor: colors.shadow,
                  opacity: !canCheckIn || checkingIn ? 0.6 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              {checkingIn ? (
                <ActivityIndicator color={withinRadius ? colors.onPrimary : colors.onTertiary} />
              ) : (
                <>
                  <Ionicons
                    name={withinRadius ? 'checkmark-circle' : 'location'}
                    size={24}
                    color={
                      withinRadius
                        ? colors.onPrimary
                        : canCheckIn
                          ? colors.onTertiary
                          : colors.outline
                    }
                  />
                  <Text
                    style={[
                      styles.checkInButtonText,
                      {
                        color: withinRadius
                          ? colors.onPrimary
                          : canCheckIn
                            ? colors.onTertiary
                            : colors.outline,
                      },
                    ]}
                  >
                    {withinRadius ? "I'm Here! (Check-in)" : 'Check-in'}
                  </Text>
                </>
              )}
            </AnimatedTouchableOpacity>

            {/* Navigate Button */}
            <AnimatedTouchableOpacity
              onPress={handleNavigate}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.tertiary,
                  shadowColor: colors.shadow,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={24} color={colors.onTertiary} />
              <Text style={[styles.actionButtonText, { color: colors.onTertiary }]}>
                Navigate to Site
              </Text>
            </AnimatedTouchableOpacity>

            {/* View Performance Button */}
            <AnimatedTouchableOpacity
              onPress={() => router.push(`/performance?siteId=${site.id}`)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.secondary,
                  shadowColor: colors.shadow,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="analytics" size={24} color={colors.onSecondary} />
              <Text style={[styles.actionButtonText, { color: colors.onSecondary }]}>
                View Performance
              </Text>
            </AnimatedTouchableOpacity>

            {/* Inspection Form Button */}
            <AnimatedTouchableOpacity
              onPress={() => router.push('/(tabs)/inspection')}
              style={[
                styles.inspectionButton,
                {
                  borderColor: colors.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="clipboard" size={24} color={colors.primary} />
              <Text style={[styles.inspectionButtonText, { color: colors.primary }]}>
                Start Inspection
              </Text>
            </AnimatedTouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  mapContainer: {
    height: 320,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  mapError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mapErrorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  enableLocationButton: {
    marginTop: 16,
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  enableLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  siteHeader: {
    marginBottom: 24,
  },
  siteName: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  capacityText: {
    fontSize: 16,
  },
  statsGrid: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
  },
  distanceCard: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 16,
  },
  withinRangeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  withinRangeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  inspectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  inspectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
