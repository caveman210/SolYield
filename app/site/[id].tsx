import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Q } from '@nozbe/watermelondb';

import { SITES } from '../../lib/data/sites';
import SiteMapWidget from '../components/maps/SiteMapWidget';
import M3ConfirmDialog from '../components/M3ConfirmDialog';
import M3AlertDialog from '../components/M3AlertDialog';
import { M3BottomSheet } from '../components/M3BottomSheet';
import { FloatingInfoBox } from '../components/FloatingInfoBox';
import { calculateDistance, isWithinCheckInRadius, formatDistance } from '../../lib/utils/location';
import { M3Motion, M3Shape, M3Spacing } from '../../lib/design';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { useSites } from '../../lib/hooks/useSites';
import { getSchedulesCollection } from '../../database';
import Schedule from '../../database/models/Schedule';
import { useActivities } from '../../lib/hooks/useActivities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHECK_IN_RADIUS = 500;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SiteDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useMaterialYouColors();
  const { deleteSite, sites: allSites, isLoading: sitesLoading } = useSites();
  const siteId = params.id as string;
  
  // Find site from WatermelonDB sites (includes both built-in and user-created)
  const siteModel = allSites.find((s) => s.id === siteId);
  
  // Convert WatermelonDB model to legacy Site format for UI compatibility
  const site = siteModel ? {
    id: siteModel.id,
    name: siteModel.name,
    location: { lat: siteModel.latitude, lng: siteModel.longitude },
    capacity: siteModel.capacity,
    isUserCreated: siteModel.isUserCreated, // Add this property to check for delete permission
  } : null;

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showArchiveVisitDialog, setShowArchiveVisitDialog] = useState(false);
  const [completedVisit, setCompletedVisit] = useState<Schedule | null>(null);
  const [checkedInSchedule, setCheckedInSchedule] = useState<Schedule | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  
  const { addActivity } = useActivities();

  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  // Check if there's an active checked-in schedule for this site
  useEffect(() => {
    if (!site) return;
    
    const checkActiveCheckIn = async () => {
      const schedulesCollection = getSchedulesCollection();
      const todayStr = new Date().toISOString().split('T')[0];
      
      const activeCheckIns = await schedulesCollection
        .query(
          Q.where('site_id', site.id),
          Q.where('date', todayStr),
          Q.where('checked_in_at', Q.notEq(null)),
          Q.where('checked_out_at', null),
          Q.where('archived', false)
        )
        .fetch();
      
      if (activeCheckIns.length > 0) {
        setCheckedInSchedule(activeCheckIns[0]);
      }
    };
    
    checkActiveCheckIn();
  }, [site]);

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
        // Create check-in activity
        const activityId = addActivity({
          type: 'check-in',
          title: 'Site Check-in',
          description: `Checked in at ${site.name}`,
          siteId: site.id,
          icon: 'map-marker-check',
          metadata: {
            distance: Math.round(dist),
            accuracy: currentLocation.coords.accuracy,
            timestamp: currentLocation.timestamp,
          },
        });
        
        // Find today's scheduled visit for this site
        const schedulesCollection = getSchedulesCollection();
        const todayStr = new Date().toISOString().split('T')[0];
        
        const todaysVisits = await schedulesCollection
          .query(
            Q.where('site_id', site.id),
            Q.where('date', todayStr),
            Q.where('status', 'scheduled'),
            Q.where('archived', false)
          )
          .fetch();
        
        if (todaysVisits.length > 0) {
          // Link check-in to the scheduled visit
          const visit = todaysVisits[0];
          await visit.markAsCheckedIn(activityId);
          setCheckedInSchedule(visit);
        }
        
        setAlertConfig({
          visible: true,
          title: 'Check-in Successful!',
          message: `You have successfully checked in to ${site.name}.\n\nYour distance: ${formatDistance(dist)}`,
          type: 'success',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Check-in Failed',
          message: `You are too far from ${site.name}.\n\nYour distance: ${formatDistance(dist)}\nRequired: within ${CHECK_IN_RADIUS}m`,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to verify your location. Please try again.',
        type: 'error',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkedInSchedule || !site) return;

    setCheckingOut(true);

    try {
      // Mark as checked out
      await checkedInSchedule.markAsCheckedOut();
      await checkedInSchedule.markAsCompleted();
      
      const duration = checkedInSchedule.actualDurationMinutes;
      const hours = Math.floor((duration || 0) / 60);
      const minutes = (duration || 0) % 60;
      
      // Store the completed visit for potential archival
      setCompletedVisit(checkedInSchedule);
      setCheckedInSchedule(null);
      
      setAlertConfig({
        visible: true,
        title: 'Check-out Successful!',
        message: `You have checked out from ${site.name}.\n\nDuration: ${hours}h ${minutes}m`,
        type: 'success',
      });
      
      // Show archive visit dialog first, then site archive dialog
      setTimeout(() => {
        setShowArchiveVisitDialog(true);
      }, 1500);
    } catch (error) {
      console.error('Check-out error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to check out. Please try again.',
        type: 'error',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleArchiveVisit = async () => {
    if (!completedVisit) return;

    try {
      // Archive the completed visit
      await completedVisit.update((visit: any) => {
        visit.archived = true;
      });
      
      setShowArchiveVisitDialog(false);
      setCompletedVisit(null);
      
      setAlertConfig({
        visible: true,
        title: 'Visit Archived',
        message: 'The completed visit has been archived.',
        type: 'success',
      });
      
      // Now check if site should be archived
      const schedulesCollection = getSchedulesCollection();
      const todayStr = new Date().toISOString().split('T')[0];
      
      const futureVisits = await schedulesCollection
        .query(
          Q.where('site_id', site!.id),
          Q.where('date', Q.gte(todayStr)),
          Q.where('status', 'scheduled'),
          Q.where('archived', false)
        )
        .fetch();
      
      // Show site archive dialog after a brief delay if no future visits
      if (futureVisits.length === 0) {
        setTimeout(() => {
          setShowArchiveDialog(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Archive visit error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to archive visit. Please try again.',
        type: 'error',
      });
    }
  };

  const handleKeepVisitActive = () => {
    setShowArchiveVisitDialog(false);
    setCompletedVisit(null);
    
    // Check if site should be archived
    const checkSiteArchival = async () => {
      const schedulesCollection = getSchedulesCollection();
      const todayStr = new Date().toISOString().split('T')[0];
      
      const futureVisits = await schedulesCollection
        .query(
          Q.where('site_id', site!.id),
          Q.where('date', Q.gte(todayStr)),
          Q.where('status', 'scheduled'),
          Q.where('archived', false)
        )
        .fetch();
      
      // Show site archive dialog if no future visits
      if (futureVisits.length === 0) {
        setTimeout(() => {
          setShowArchiveDialog(true);
        }, 500);
      }
    };
    
    checkSiteArchival();
  };

  const handleArchiveSite = async () => {
    if (!site || !siteModel) return;

    try {
      await siteModel.archive();
      setShowArchiveDialog(false);
      setAlertConfig({
        visible: true,
        title: 'Site Archived',
        message: `${site.name} has been archived. You can find it in the archived sites section.`,
        type: 'success',
      });
      
      // Navigate back after a brief delay
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      console.error('Archive error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to archive site. Please try again.',
        type: 'error',
      });
    }
  };

  const handleNavigate = () => {
    if (!site) return;
    setShowNavigationDialog(true);
  };

  const handleExternalNavigation = () => {
    if (!site) return;
    
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
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'Unable to open maps application',
          type: 'error',
        });
      });
    
    setShowNavigationDialog(false);
  };

  const handleDeleteSite = () => {
    // Stage 1: Initial warning
    setShowDeleteDialog(true);
  };

  const handleDeleteStage2 = () => {
    // Close stage 1 and open stage 2 (text confirmation)
    setShowDeleteDialog(false);
    setDeleteConfirmText('');
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteSite = async () => {
    if (!site) return;

    // Validate text input
    if (deleteConfirmText !== 'DELETE') {
      setAlertConfig({
        visible: true,
        title: 'Invalid Confirmation',
        message: 'Please type DELETE exactly to confirm permanent deletion.',
        type: 'error',
      });
      return;
    }

    // Check if this is a user-created site (starts with "site_user_")
    if (site.id.startsWith('site_user_')) {
      try {
        // Use WatermelonDB cascading delete
        await deleteSite(site.id, true);
        setShowDeleteConfirmDialog(false);
        setAlertConfig({
          visible: true,
          title: 'Site Deleted',
          message: `${site.name} and all associated data have been permanently deleted.`,
          type: 'success',
        });
        // Navigate back after a brief delay
        setTimeout(() => router.back(), 1500);
      } catch (error) {
        setShowDeleteConfirmDialog(false);
        setAlertConfig({
          visible: true,
          title: 'Delete Failed',
          message: 'An error occurred while deleting the site. Please try again.',
          type: 'error',
        });
        console.error('Error deleting site:', error);
      }
    } else {
      setShowDeleteConfirmDialog(false);
      setAlertConfig({
        visible: true,
        title: 'Cannot Delete',
        message: 'Built-in sites cannot be deleted.',
        type: 'error',
      });
    }
  };

  if (!site) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.onSurfaceVariant }]}>
            Site not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.enableLocationButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.enableLocationText, { color: colors.onPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />

      {/* Full-screen Map Backdrop */}
      <View style={styles.mapBackdrop}>
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
          <SiteMapWidget
            location={site.location}
            siteName={site.name}
            subtitle={site.capacity}
            radiusMeters={CHECK_IN_RADIUS}
            height={Dimensions.get('window').height}
            showCoordinates
          />
        )}
      </View>

      {/* Fixed Back Button */}
      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surfaceContainerLow }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Floating Info Box - Visible only when sheet is collapsed */}
      <FloatingInfoBox
        siteName={site.name}
        capacity={site.capacity}
        distance={distance !== null ? formatDistance(distance) : null}
        visible={bottomSheetIndex === 0}
      />

      {/* Persistent Bottom Sheet with Site Details */}
      <M3BottomSheet
        snapPoints={['10%', '50%', '90%']}
        initialSnapIndex={1}
        onChange={(index) => setBottomSheetIndex(index)}
      >
        {/* Site Header */}
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
            {/* Check-in / Check-out Button */}
            {checkedInSchedule ? (
              <AnimatedTouchableOpacity
                onPress={handleCheckOut}
                disabled={checkingOut}
                style={[
                  styles.checkInButton,
                  {
                    backgroundColor: colors.secondary,
                    shadowColor: colors.shadow,
                    opacity: checkingOut ? 0.6 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                {checkingOut ? (
                  <ActivityIndicator color={colors.onSecondary} />
                ) : (
                  <>
                    <Ionicons
                      name="log-out-outline"
                      size={24}
                      color={colors.onSecondary}
                    />
                    <Text
                      style={[
                        styles.checkInButtonText,
                        { color: colors.onSecondary },
                      ]}
                    >
                      Check-out
                    </Text>
                  </>
                )}
              </AnimatedTouchableOpacity>
            ) : (
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
            )}

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

            {/* Delete Site Button - Only for user-created sites */}
            {site.id.startsWith('site_user_') && (
              <AnimatedTouchableOpacity
                onPress={handleDeleteSite}
                entering={FadeInUp.duration(M3Motion.duration.medium).delay(400)}
                style={[
                  styles.deleteButton,
                  {
                    borderColor: colors.error,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={24} color={colors.error} />
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                  Delete Site
                </Text>
              </AnimatedTouchableOpacity>
            )}
          </Animated.View>
      </M3BottomSheet>

      {/* Stage 1: Delete Warning Dialog */}
      <M3ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Site?"
        message={`Are you sure you want to delete "${site.name}"? This action cannot be undone and will remove all associated data including visits, forms, and activities.`}
        icon="alert-circle-outline"
        iconColor={colors.error}
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setShowDeleteDialog(false),
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: handleDeleteStage2,
            style: 'destructive',
          },
        ]}
        onDismiss={() => setShowDeleteDialog(false)}
      />

      {/* Stage 2: Text Confirmation Dialog */}
      <M3ConfirmDialog
        visible={showDeleteConfirmDialog}
        title="Confirm Permanent Delete"
        message={`This will permanently remove "${site.name}" and all associated data. Type DELETE to confirm:`}
        icon="delete-forever"
        iconColor={colors.error}
        buttons={[
          {
            text: 'Cancel',
            onPress: () => {
              setShowDeleteConfirmDialog(false);
              setDeleteConfirmText('');
            },
            style: 'cancel',
          },
          {
            text: 'Delete Forever',
            onPress: confirmDeleteSite,
            style: 'destructive',
            disabled: deleteConfirmText !== 'DELETE',
          },
        ]}
        onDismiss={() => {
          setShowDeleteConfirmDialog(false);
          setDeleteConfirmText('');
        }}
      >
        <TextInput
          style={[
            styles.deleteConfirmInput,
            {
              backgroundColor: colors.surfaceContainer,
              color: colors.onSurface,
              borderColor: colors.outline,
            },
          ]}
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          placeholder="Type DELETE"
          placeholderTextColor={colors.onSurfaceVariant}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </M3ConfirmDialog>

      {/* Navigation Options Dialog */}
      <M3ConfirmDialog
        visible={showNavigationDialog}
        title="Navigate to Site"
        message="Choose your navigation option:"
        icon="navigation"
        iconColor={colors.primary}
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setShowNavigationDialog(false),
            style: 'cancel',
          },
          {
            text: 'In-App Navigation',
            onPress: () => {
              setShowNavigationDialog(false);
              router.push(`/map-navigation?siteId=${site.id}` as any);
            },
            style: 'default',
          },
          {
            text: 'External Maps',
            onPress: handleExternalNavigation,
            style: 'default',
          },
        ]}
        onDismiss={() => setShowNavigationDialog(false)}
      />

      {/* Archive Visit Dialog */}
      <M3ConfirmDialog
        visible={showArchiveVisitDialog}
        title="Archive This Visit?"
        message={`The visit to "${site.name}" is now complete.\n\nWould you like to archive this completed visit? Archived visits are hidden from your active schedule but can be viewed in visit history.`}
        icon="calendar-check-outline"
        iconColor={colors.secondary}
        buttons={[
          {
            text: 'Keep in Schedule',
            onPress: handleKeepVisitActive,
            style: 'cancel',
          },
          {
            text: 'Archive Visit',
            onPress: handleArchiveVisit,
            style: 'default',
          },
        ]}
        onDismiss={handleKeepVisitActive}
      />

      {/* Archive Site Dialog */}
      <M3ConfirmDialog
        visible={showArchiveDialog}
        title="Archive This Site?"
        message={`Do you want to archive "${site.name}"?\n\nArchiving will hide this site from your active sites list. You can restore it later from the archived sites section if needed.`}
        icon="archive-outline"
        iconColor={colors.tertiary}
        buttons={[
          {
            text: 'Keep Active',
            onPress: () => setShowArchiveDialog(false),
            style: 'cancel',
          },
          {
            text: 'Archive Site',
            onPress: handleArchiveSite,
            style: 'default',
          },
        ]}
        onDismiss={() => setShowArchiveDialog(false)}
      />

      {/* M3 Alert Dialog */}
      <M3AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: M3Spacing.lg,
    paddingTop: M3Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: M3Shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
    padding: M3Spacing.sm,
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    paddingBottom: M3Spacing.xxxl,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
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
    borderRadius: M3Shape.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  enableLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  siteHeader: {
    marginBottom: M3Spacing.xxl,
  },
  siteName: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: M3Spacing.sm,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityIcon: {
    width: 32,
    height: 32,
    borderRadius: M3Shape.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: M3Spacing.sm,
  },
  capacityText: {
    fontSize: 16,
  },
  statsGrid: {
    marginBottom: M3Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: M3Spacing.md,
    gap: M3Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
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
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
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
    marginLeft: M3Spacing.sm,
    paddingHorizontal: M3Spacing.sm,
    paddingVertical: 4,
    borderRadius: M3Shape.full,
  },
  withinRangeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: M3Spacing.md,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.lg,
    borderRadius: M3Shape.large,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: M3Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.lg,
    borderRadius: M3Shape.large,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: M3Spacing.sm,
  },
  inspectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.lg,
    borderRadius: M3Shape.large,
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  inspectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: M3Spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.lg,
    borderRadius: M3Shape.large,
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: M3Spacing.sm,
  },
  deleteConfirmInput: {
    marginTop: M3Spacing.lg,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Shape.small,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
