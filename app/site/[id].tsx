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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { getSchedulesCollection, getActivitiesCollection } from '../../database';
import Schedule from '../../database/models/Schedule';
import { useActivities } from '../../lib/hooks/useActivities';

// Import Schedule Management to fetch visits specific to this site
import { useScheduleManagement } from '../../lib/hooks/useScheduleManagement';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHECK_IN_RADIUS = 500;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SiteDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useMaterialYouColors();
  
  const { deleteSite, sites: allSites, isLoading: sitesLoading } = useSites();
  const { getVisitsBySite } = useScheduleManagement();
  
  const siteId = params.id as string;
  const siteModel = allSites.find((s) => s.id === siteId);
  const site = siteModel ? {
    id: siteModel.id,
    name: siteModel.name,
    location: { lat: siteModel.latitude, lng: siteModel.longitude },
    capacity: siteModel.capacity,
    isUserCreated: siteModel.isUserCreated, 
  } : null;

  // Retrieve upcoming unarchived visits for this site
  const siteVisits = site ? getVisitsBySite(site.id) : [];

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
  
  const [hasWorkAssigned, setHasWorkAssigned] = useState(true);

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
  
  useEffect(() => {
    if (!site) return;

    const checkWorkAssigned = async () => {
      const scheduleCount = await getSchedulesCollection().query(Q.where('site_id', site.id)).fetchCount();
      const activityCount = await getActivitiesCollection().query(Q.where('site_id', site.id)).fetchCount();
      
      setHasWorkAssigned((scheduleCount + activityCount) > 0);
    };

    checkWorkAssigned();
  }, [site]);

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
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setLocationError('Location services are disabled. Please enable them in device settings.');
        setLoading(false);
        return;
      }

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
        } catch (err) { }
      }

      if (!location) {
        try {
          location = await Location.getLastKnownPositionAsync({ maxAge: 300000, requiredAccuracy: 1000 });
        } catch (err) { }
      }

      if (location) {
        setUserLocation(location);
        if (site) {
          const dist = calculateDistance(location.coords.latitude, location.coords.longitude, site.location.lat, site.location.lng);
          setDistance(dist);
        }
      } else {
        setLocationError('Unable to get location. You can still view site info without location.');
      }
      setLoading(false);
    } catch (error: any) {
      setLocationError('Location error occurred. You can still view site info.');
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!userLocation || !site) return;
    setCheckingIn(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const withinRadius = isWithinCheckInRadius(currentLocation.coords.latitude, currentLocation.coords.longitude, site.location.lat, site.location.lng);
      const dist = calculateDistance(currentLocation.coords.latitude, currentLocation.coords.longitude, site.location.lat, site.location.lng);

      if (withinRadius) {
        const activityId = addActivity({
          type: 'check-in',
          title: 'Site Check-in',
          description: `Checked in at ${site.name}`,
          siteId: site.id,
          icon: 'map-marker-check',
        });
        
        const schedulesCollection = getSchedulesCollection();
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysVisits = await schedulesCollection.query(Q.where('site_id', site.id), Q.where('date', todayStr), Q.where('status', 'scheduled'), Q.where('archived', false)).fetch();
        
        if (todaysVisits.length > 0) {
          const visit = todaysVisits[0];
          await visit.markAsCheckedIn?.(activityId);
          setCheckedInSchedule(visit);
        }
        
        setAlertConfig({ visible: true, title: 'Check-in Successful!', message: `You have successfully checked in.\n\nDistance: ${formatDistance(dist)}`, type: 'success' });
      } else {
        setAlertConfig({ visible: true, title: 'Check-in Failed', message: `You are too far from ${site.name}.\n\nDistance: ${formatDistance(dist)}\nRequired: within ${CHECK_IN_RADIUS}m`, type: 'error' });
      }
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to verify your location. Please try again.', type: 'error' });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkedInSchedule || !site) return;
    setCheckingOut(true);
    try {
      await checkedInSchedule.markAsCheckedOut?.();
      await checkedInSchedule.markAsCompleted?.();
      
      const duration = checkedInSchedule.actualDurationMinutes || 0;
      setCompletedVisit(checkedInSchedule);
      setCheckedInSchedule(null);
      
      setAlertConfig({ visible: true, title: 'Check-out Successful!', message: `You have checked out from ${site.name}.\n\nDuration: ${Math.floor(duration/60)}h ${duration%60}m`, type: 'success' });
      setTimeout(() => setShowArchiveVisitDialog(true), 1500);
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to check out. Please try again.', type: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleArchiveVisit = async () => {
    if (!completedVisit) return;
    try {
      await completedVisit.update((visit: any) => { visit.archived = true; });
      setShowArchiveVisitDialog(false);
      setCompletedVisit(null);
      setAlertConfig({ visible: true, title: 'Visit Archived', message: 'The completed visit has been archived.', type: 'success' });
      
      const futureVisits = await getSchedulesCollection().query(Q.where('site_id', site!.id), Q.where('date', Q.gte(new Date().toISOString().split('T')[0])), Q.where('status', 'scheduled'), Q.where('archived', false)).fetch();
      if (futureVisits.length === 0) setTimeout(() => setShowArchiveDialog(true), 1000);
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to archive visit. Please try again.', type: 'error' });
    }
  };

  const handleKeepVisitActive = () => {
    setShowArchiveVisitDialog(false);
    setCompletedVisit(null);
    const checkSiteArchival = async () => {
      const futureVisits = await getSchedulesCollection().query(Q.where('site_id', site!.id), Q.where('date', Q.gte(new Date().toISOString().split('T')[0])), Q.where('status', 'scheduled'), Q.where('archived', false)).fetch();
      if (futureVisits.length === 0) setTimeout(() => setShowArchiveDialog(true), 500);
    };
    checkSiteArchival();
  };

  const handleArchiveSite = async () => {
    if (!site || !siteModel) return;
    try {
      await siteModel.archive();
      
      // Inject metadata so the Activity feed knows WHAT site to unarchive
      await database.write(async () => {
        const activitiesCollection = getActivitiesCollection();
        await activitiesCollection.create((activity: any) => {
          activity.type = 'inspection';
          activity.title = 'Site Archived';
          activity.description = `Archived site: ${site.name}`;
          activity.siteId = site.id;
          activity.timestamp = Date.now();
          activity.icon = 'archive';
          activity.archived = false;
          activity.synced = false;
          activity.metadata = JSON.stringify({ archivedSiteId: site.id });
        });
      });

      setShowArchiveDialog(false);
      setAlertConfig({ visible: true, title: 'Site Archived', message: `${site.name} has been archived.`, type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to archive site.', type: 'error' });
    }
  };
  const handleExternalNavigation = () => {
    if (!site) return;
    const label = encodeURIComponent(site.name);
    const url = Platform.OS === 'ios' ? `maps://app?daddr=${site.location.lat},${site.location.lng}` : `geo:0,0?q=${site.location.lat},${site.location.lng}(${label})`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${site.location.lat},${site.location.lng}`));
    setShowNavigationDialog(false);
  };

  const confirmDeleteSite = async () => {
    if (!site) return;
    if (deleteConfirmText !== 'DELETE') {
      setAlertConfig({ visible: true, title: 'Invalid Confirmation', message: 'Please type DELETE exactly.', type: 'error' });
      return;
    }

    try {
      await deleteSite(site.id, true);
      setShowDeleteConfirmDialog(false);
      setAlertConfig({ visible: true, title: 'Site Deleted', message: `${site.name} deleted successfully.`, type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      setShowDeleteConfirmDialog(false);
      setAlertConfig({ visible: true, title: 'Delete Failed', message: 'Error deleting site.', type: 'error' });
    }
  };

  if (!site) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.onSurfaceVariant }]}>Site not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.enableLocationButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.enableLocationText, { color: colors.onPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canCheckIn = userLocation && !locationError;
  const withinRadius = userLocation && isWithinCheckInRadius(userLocation.coords.latitude, userLocation.coords.longitude, site.location.lat, site.location.lng);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      <View style={styles.mapBackdrop}>
        {loading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : locationError ? (
          <View style={styles.mapError}>
            <Ionicons name="location-outline" size={48} color={colors.outline} />
            <Text style={[styles.mapErrorText, { color: colors.onSurfaceVariant }]}>{locationError}</Text>
          </View>
        ) : (
          <SiteMapWidget location={site.location} siteName={site.name} subtitle={site.capacity} radiusMeters={CHECK_IN_RADIUS} height={Dimensions.get('window').height} showCoordinates />
        )}
      </View>

      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surfaceContainerLow }]} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      <FloatingInfoBox siteName={site.name} capacity={site.capacity} distance={distance !== null ? formatDistance(distance) : null} visible={bottomSheetIndex === 0} />

      <M3BottomSheet snapPoints={['10%', '50%', '90%']} initialSnapIndex={1} onChange={setBottomSheetIndex}>
        <Animated.View entering={FadeInUp.duration(M3Motion.duration.medium)} style={styles.siteHeader}>
          <Text style={[styles.siteName, { color: colors.onSurface }]}>{site.name}</Text>
          <View style={styles.capacityRow}>
            <View style={[styles.capacityIcon, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.capacityText, { color: colors.onSurfaceVariant }]}>{site.capacity}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(M3Motion.duration.medium).delay(100)} style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surfaceContainer, shadowColor: colors.shadow }]}>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Latitude</Text>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{site.location.lat.toFixed(4)}°</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surfaceContainer, shadowColor: colors.shadow }]}>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Longitude</Text>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{site.location.lng.toFixed(4)}°</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(M3Motion.duration.medium).delay(200)} style={styles.actionsContainer}>
          {checkedInSchedule ? (
            <AnimatedTouchableOpacity onPress={handleCheckOut} disabled={checkingOut} style={[styles.checkInButton, { backgroundColor: colors.secondary, opacity: checkingOut ? 0.6 : 1 }]}>
              {checkingOut ? <ActivityIndicator color={colors.onSecondary} /> : <Text style={[styles.checkInButtonText, { color: colors.onSecondary }]}>Check-out</Text>}
            </AnimatedTouchableOpacity>
          ) : (
            <AnimatedTouchableOpacity onPress={handleCheckIn} disabled={!canCheckIn || checkingIn} style={[styles.checkInButton, { backgroundColor: withinRadius ? colors.primary : canCheckIn ? colors.tertiary : colors.surfaceContainerHigh, opacity: !canCheckIn || checkingIn ? 0.6 : 1 }]}>
              {checkingIn ? <ActivityIndicator color={withinRadius ? colors.onPrimary : colors.onTertiary} /> : <Text style={[styles.checkInButtonText, { color: withinRadius ? colors.onPrimary : canCheckIn ? colors.onTertiary : colors.outline }]}>{withinRadius ? "I'm Here! (Check-in)" : 'Check-in'}</Text>}
            </AnimatedTouchableOpacity>
          )}

          <AnimatedTouchableOpacity onPress={() => setShowNavigationDialog(true)} style={[styles.actionButton, { backgroundColor: colors.tertiary }]}>
            <Ionicons name="navigate" size={24} color={colors.onTertiary} />
            <Text style={[styles.actionButtonText, { color: colors.onTertiary }]}>Navigate to Site</Text>
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity onPress={() => router.push(`/performance?siteId=${site.id}`)} style={[styles.actionButton, { backgroundColor: colors.secondary }]}>
            <Ionicons name="analytics" size={24} color={colors.onSecondary} />
            <Text style={[styles.actionButtonText, { color: colors.onSecondary }]}>View Performance</Text>
          </AnimatedTouchableOpacity>

          {(!hasWorkAssigned || site.isUserCreated) && (
            <AnimatedTouchableOpacity
              onPress={() => setShowDeleteDialog(true)}
              entering={FadeInUp.duration(M3Motion.duration.medium).delay(300)}
              style={[styles.deleteButton, { borderColor: colors.error }]}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                {!hasWorkAssigned ? 'Delete Unused Site' : 'Delete Site'}
              </Text>
            </AnimatedTouchableOpacity>
          )}
        </Animated.View>

        {/* --- SCHEDULED VISITS PANE --- */}
        <Animated.View entering={FadeInUp.duration(M3Motion.duration.medium).delay(400)} style={styles.visitsSection}>
          <Text style={[styles.visitsSectionTitle, { color: colors.onSurface }]}>Scheduled Visits</Text>
          {siteVisits.length === 0 ? (
            <View style={[styles.noVisitsContainer, { backgroundColor: colors.surfaceContainerHighest }]}>
               <MaterialCommunityIcons name="calendar-blank" size={32} color={colors.onSurfaceVariant} />
               <Text style={[styles.noVisitsText, { color: colors.onSurfaceVariant }]}>No upcoming visits scheduled.</Text>
            </View>
          ) : (
            siteVisits.map((visit) => (
              <View key={visit.id} style={[styles.visitItemCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 16 }}>{visit.title}</Text>
                  <View style={{ backgroundColor: colors.surfaceVariant, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                      {visit.status}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.primary} style={{ marginRight: 6 }}/>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
                    {visit.date} at {visit.time}
                  </Text>
                </View>
                {visit.description && (
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 8 }} numberOfLines={2}>
                    {visit.description}
                  </Text>
                )}
              </View>
            ))
          )}
        </Animated.View>

      </M3BottomSheet>

      {/* Delete Warning Dialog */}
      <M3ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Site?"
        message={`Are you sure you want to delete "${site.name}"? This action cannot be undone.`}
        icon="alert-circle-outline"
        iconColor={colors.error}
        buttons={[
          { text: 'Cancel', onPress: () => setShowDeleteDialog(false), style: 'cancel' },
          { text: 'Continue', onPress: () => { setShowDeleteDialog(false); setDeleteConfirmText(''); setShowDeleteConfirmDialog(true); }, style: 'destructive' },
        ]}
        onDismiss={() => setShowDeleteDialog(false)}
      />

      <M3ConfirmDialog
        visible={showDeleteConfirmDialog}
        title="Confirm Permanent Delete"
        message={`Type DELETE to confirm:`}
        icon="delete-forever"
        iconColor={colors.error}
        buttons={[
          { text: 'Cancel', onPress: () => setShowDeleteConfirmDialog(false), style: 'cancel' },
          { text: 'Delete Forever', onPress: confirmDeleteSite, style: 'destructive', disabled: deleteConfirmText !== 'DELETE' },
        ]}
      >
        <TextInput style={[styles.deleteConfirmInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outline }]} value={deleteConfirmText} onChangeText={setDeleteConfirmText} placeholder="Type DELETE" autoCapitalize="characters" />
      </M3ConfirmDialog>

      <M3ConfirmDialog visible={showNavigationDialog} title="Navigate to Site" message="Choose your navigation option:" icon="navigation" iconColor={colors.primary} buttons={[
        { text: 'Cancel', onPress: () => setShowNavigationDialog(false), style: 'cancel' },
        { text: 'In-App Navigation', onPress: () => { setShowNavigationDialog(false); router.push(`/map-navigation?siteId=${site.id}` as any); } },
        { text: 'External Maps', onPress: handleExternalNavigation }
      ]} />

      <M3AlertDialog visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapBackdrop: { ...StyleSheet.absoluteFillObject },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: M3Spacing.lg, paddingTop: M3Spacing.sm },
  backButton: { width: 44, height: 44, borderRadius: M3Shape.medium, alignItems: 'center', justifyContent: 'center' },
  notFoundContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapError: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mapErrorText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  enableLocationButton: { marginTop: 16, borderRadius: M3Shape.full, paddingHorizontal: 24, paddingVertical: 12 },
  enableLocationText: { fontSize: 14, fontWeight: '500' },
  siteHeader: { marginBottom: M3Spacing.xxl },
  siteName: { fontSize: 28, fontWeight: '400', marginBottom: M3Spacing.sm },
  capacityRow: { flexDirection: 'row', alignItems: 'center' },
  capacityIcon: { width: 32, height: 32, borderRadius: M3Shape.small, alignItems: 'center', justifyContent: 'center', marginRight: M3Spacing.sm },
  capacityText: { fontSize: 16 },
  statsGrid: { marginBottom: M3Spacing.xxl },
  statsRow: { flexDirection: 'row', marginBottom: M3Spacing.md, gap: M3Spacing.sm },
  statCard: { flex: 1, padding: M3Spacing.lg, borderRadius: M3Shape.medium, elevation: 1 },
  statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 16 },
  actionsContainer: { gap: M3Spacing.md },
  checkInButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: M3Spacing.lg, borderRadius: M3Shape.large, elevation: 3 },
  checkInButtonText: { fontSize: 14, fontWeight: '500', marginLeft: M3Spacing.sm },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: M3Spacing.lg, borderRadius: M3Shape.large, elevation: 2 },
  actionButtonText: { fontSize: 14, fontWeight: '500', marginLeft: M3Spacing.sm },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: M3Spacing.lg, borderRadius: M3Shape.large, backgroundColor: 'transparent', borderWidth: 2 },
  deleteButtonText: { fontSize: 14, fontWeight: '500', marginLeft: M3Spacing.sm },
  deleteConfirmInput: { marginTop: M3Spacing.lg, paddingHorizontal: M3Spacing.lg, paddingVertical: M3Spacing.md, borderRadius: M3Shape.small, borderWidth: 1, fontSize: 16, fontWeight: '500' },
  
  // New Styles for Scheduled Visits section
  visitsSection: { marginTop: M3Spacing.xxl, marginBottom: M3Spacing.xl },
  visitsSectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: M3Spacing.md },
  visitItemCard: { padding: M3Spacing.lg, borderRadius: M3Shape.medium, marginBottom: M3Spacing.md, elevation: 1 },
  noVisitsContainer: { padding: M3Spacing.xl, borderRadius: M3Shape.medium, alignItems: 'center', justifyContent: 'center', gap: 8 },
  noVisitsText: { fontSize: 14, fontWeight: '500' }
});
