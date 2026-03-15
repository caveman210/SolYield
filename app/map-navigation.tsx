import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps'; // <-- Needed for type reference

import { SITES } from '../lib/data/sites';
import SiteMapWidget from './components/maps/SiteMapWidget';
import { calculateDistance, formatDistance } from '../lib/utils/location';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import M3ErrorDialog from './components/M3ErrorDialog';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MapNavigationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useMaterialYouColors();

  // 1. Create the Map Reference
  const mapRef = useRef<MapView>(null);

  const siteId = params.siteId as string;
  const site = SITES.find((s) => s.id === siteId);

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('--');
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeLocation();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDialogConfig({
          visible: true,
          title: 'Permission Required',
          message: 'Location permission is needed for navigation.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);

      if (site) {
        const dist = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          site.location.lat,
          site.location.lng
        );
        setDistance(dist);
        calculateETA(dist);
      }

      setLoading(false);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000, 
          distanceInterval: 50, 
        },
        (newLocation) => {
          setUserLocation(newLocation);
          if (site) {
            const newDist = calculateDistance(
              newLocation.coords.latitude,
              newLocation.coords.longitude,
              site.location.lat,
              site.location.lng
            );
            setDistance(newDist);
            calculateETA(newDist);
          }
        }
      );

      return () => subscription.remove();
    } catch (error) {
      console.error('Error initializing location:', error);
      setDialogConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to get your location. Please try again.',
        type: 'error',
      });
      setLoading(false);
    }
  };

  const calculateETA = (distanceMeters: number) => {
    const speedKmh = 40;
    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / speedKmh;
    const timeMinutes = Math.round(timeHours * 60);

    if (timeMinutes < 1) setEstimatedTime('< 1 min');
    else if (timeMinutes < 60) setEstimatedTime(`${timeMinutes} min`);
    else {
      const hours = Math.floor(timeMinutes / 60);
      const mins = timeMinutes % 60;
      setEstimatedTime(`${hours}h ${mins}m`);
    }
  };

  // 2. Command the native camera to fly to the user
  const handleRecenterMap = () => {
    if (!userLocation) {
      setDialogConfig({
        visible: true,
        title: 'Location Unavailable',
        message: 'We are still trying to determine your current location.',
        type: 'info',
      });
      return;
    }

    mapRef.current?.animateCamera(
      {
        center: {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        zoom: 16, 
        pitch: 0,
        heading: userLocation.coords.heading || 0,
      },
      { duration: 800 } 
    );
  };

  const handleOpenExternalNav = () => {
    if (!site) return;

    const label = encodeURIComponent(site.name);
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${site.location.lat},${site.location.lng}`
        : `geo:0,0?q=${site.location.lat},${site.location.lng}(${label})`;

    Linking.openURL(url).catch(() => {
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.location.lat},${site.location.lng}`;
      Linking.openURL(webUrl);
    });
  };

  if (!site) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>Site not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading map...
          </Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {/* 3. Enable interactive Native Map and pass the ref */}
          <SiteMapWidget
            ref={mapRef}
            interactive={true}
            showsUserLocation={true}
            forceNative={true}
            location={site.location}
            siteName={site.name}
            subtitle={`${site.capacity} • ${distance ? formatDistance(distance) : '--'}`}
            radiusMeters={500}
            height={SCREEN_HEIGHT}
            showCoordinates
          />
        </View>
      )}

      {/* Top Header */}
      <SafeAreaView style={styles.topHeader} edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={[styles.headerInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {site.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {site.capacity}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={handleOpenExternalNav}
          >
            <MaterialCommunityIcons name="navigation-variant" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet with Trip Info */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.surface,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={32} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.onSurface }]}>
              {distance ? formatDistance(distance) : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Distance</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={32} color={colors.tertiary} />
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{estimatedTime}</Text>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>ETA</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.secondaryContainer }]}
            onPress={handleRecenterMap}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={20}
              color={colors.onSecondaryContainer}
            />
            <Text style={[styles.secondaryButtonText, { color: colors.onSecondaryContainer }]}>
              Recenter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/site/${siteId}` as any)}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              View Site Details
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={16} color={colors.onSurfaceVariant} />
            <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
              Real-time location tracking active
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.surface }]}
          onPress={handleRecenterMap}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <M3ErrorDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onDismiss={() => setDialogConfig({ ...dialogConfig, visible: false })}
        onConfirm={dialogConfig.onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14 },
  errorText: { fontSize: 16, textAlign: 'center' },
  button: { marginTop: 16, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { fontSize: 14, fontWeight: '500' },
  topHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  headerButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  headerInfo: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#00000020', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  tripStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 60, marginHorizontal: 12 },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  secondaryButtonText: { fontSize: 14, fontWeight: '600' },
  primaryButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: '600' },
  infoSection: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#00000010' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 12 },
  floatingButtons: { position: 'absolute', right: 16, bottom: 340, gap: 12 },
  floatingButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
});
