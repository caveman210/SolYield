import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StyledText from '../components/StyledText';
import ActivityCard from '../components/ActivityCard';
import {
  useAnimatedMaterialYouColors,
  useMaterialYouColors,
} from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../../lib/design/tokens';
import { Activity } from '../../lib/types';
import { useOfflineSync } from '../../lib/hooks/useOfflineSync';
import { useSites } from '../../lib/hooks/useSites';
import { useDBActivities, useDBRecentActivities } from '../../lib/hooks/useDBActivities';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Dashboard Screen
 *
 * ✅ All widgets use Material You colors INLINE (like Overview)
 * ✅ No intermediate components or prop passing
 * ✅ Colors applied directly from useMaterialYouColors()
 * ✅ This prevents any flickering or re-rendering issues
 */
export default function Dashboard() {
  const colors = useMaterialYouColors();
  const animatedColors = useAnimatedMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { activities: recentActivities } = useDBRecentActivities(3);
  const { activities: allActivities, inspectionCount } = useDBActivities();
  const { totalCount: totalSites } = useSites();
  const { unsyncedCount, isOnline } = useOfflineSync();

  // Calculate overall site summary data
  const totalInspections = inspectionCount;
  const scheduledVisitsToday = 3; // TODO: Calculate from schedule data

  const handleActivityPress = (activity: Activity) => {
    if (activity.siteId) {
      router.push(`/site/${activity.siteId}` as any);
    }
  };

  return (
    <RNAnimated.View style={{ flex: 1, backgroundColor: animatedColors.background }}>
      {/* Header */}
      <RNAnimated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + M3Spacing.lg,
            backgroundColor: animatedColors.background,
          },
        ]}
      >
        <View>
          <StyledText
            style={{
              ...M3Typography.headline.large,
              color: colors.onBackground,
              fontWeight: '600',
            }}
          >
            SolYield
          </StyledText>
          <StyledText
            style={{
              ...M3Typography.body.medium,
              color: colors.onSurfaceVariant,
              marginTop: 4,
            }}
          >
            Welcome back, Arjun
          </StyledText>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.secondaryContainer }]}
          activeOpacity={0.7}
          onPress={() => {
            // TODO: Navigate to user profile
          }}
        >
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={24}
            color={colors.onSecondaryContainer}
          />
        </TouchableOpacity>
      </RNAnimated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(100)}>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.primaryContainer,
                ...M3Elevation.level1,
              },
            ]}
          >
            <View style={styles.heroContent}>
              <View style={{ flex: 1 }}>
                <StyledText
                  style={{
                    ...M3Typography.title.small,
                    color: colors.onPrimaryContainer,
                    opacity: 0.8,
                  }}
                >
                  Today's Overview
                </StyledText>
                <StyledText
                  style={{
                    ...M3Typography.display.small,
                    color: colors.onPrimaryContainer,
                    fontWeight: '700',
                    marginTop: 8,
                  }}
                >
                  {scheduledVisitsToday}
                </StyledText>
                <StyledText
                  style={{
                    ...M3Typography.title.medium,
                    color: colors.onPrimaryContainer,
                    marginTop: 4,
                  }}
                >
                  Site Visits Scheduled
                </StyledText>
              </View>
              <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="calendar-today" size={40} color={colors.onPrimary} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats Grid - INLINE Material You colors (like Overview) */}
        <View style={styles.statsGrid}>
          {/* Total Sites Widget */}
          <AnimatedTouchable
            entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(200)}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.secondaryContainer,
                ...M3Elevation.level0,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push('/sites')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="solar-panel" size={28} color={colors.onSecondary} />
            </View>
            <StyledText
              style={{
                ...M3Typography.headline.small,
                color: colors.onSecondaryContainer,
                fontWeight: '700',
                marginTop: M3Spacing.md,
              }}
            >
              {totalSites}
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.medium,
                color: colors.onSecondaryContainer,
                opacity: 0.8,
                marginTop: M3Spacing.xs,
              }}
            >
              Total Sites
            </StyledText>
          </AnimatedTouchable>

          {/* Total Inspections Widget */}
          <AnimatedTouchable
            entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(250)}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.tertiaryContainer,
                ...M3Elevation.level0,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push('/inspections')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.tertiary }]}>
              <MaterialCommunityIcons name="clipboard-check" size={28} color={colors.onTertiary} />
            </View>
            <StyledText
              style={{
                ...M3Typography.headline.small,
                color: colors.onTertiaryContainer,
                fontWeight: '700',
                marginTop: M3Spacing.md,
              }}
            >
              {totalInspections}
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.medium,
                color: colors.onTertiaryContainer,
                opacity: 0.8,
                marginTop: M3Spacing.xs,
              }}
            >
              Inspections
            </StyledText>
          </AnimatedTouchable>
        </View>

        {/* Sync Status Banner (show when offline OR when there are unsynced items) */}
        {(!isOnline || unsyncedCount > 0) && (
          <Animated.View
            entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(300)}
            style={[
              styles.syncBanner,
              {
                backgroundColor: !isOnline ? colors.errorContainer : colors.secondaryContainer,
                ...M3Elevation.level1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={!isOnline ? "cloud-off-outline" : "cloud-sync"}
              size={24}
              color={!isOnline ? colors.onErrorContainer : colors.onSecondaryContainer}
            />
            <View style={{ flex: 1, marginLeft: M3Spacing.md }}>
              <StyledText
                style={{
                  ...M3Typography.label.large,
                  color: !isOnline ? colors.onErrorContainer : colors.onSecondaryContainer,
                  fontWeight: '600',
                }}
              >
                {!isOnline 
                  ? 'Offline Mode' 
                  : `${unsyncedCount} item${unsyncedCount > 1 ? 's' : ''} pending sync`}
              </StyledText>
              <StyledText
                style={{
                  ...M3Typography.body.small,
                  color: !isOnline ? colors.onErrorContainer : colors.onSecondaryContainer,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {!isOnline
                  ? 'Data will sync when connection is restored'
                  : 'Syncing automatically every 10 minutes'}
              </StyledText>
            </View>
          </Animated.View>
        )}

        {/* Recent Activity Section */}
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(300)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <StyledText
              style={{
                ...M3Typography.title.large,
                color: colors.onBackground,
                fontWeight: '600',
              }}
            >
              Recent Activity
            </StyledText>
            <TouchableOpacity onPress={() => router.push('/activities' as any)}>
              <StyledText
                style={{
                  ...M3Typography.label.large,
                  color: colors.primary,
                }}
              >
                See All
              </StyledText>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <Animated.View
                  key={activity.id}
                  entering={FadeInUp.duration(M3Motion.duration.normal).delay(350 + index * 50)}
                >
                  <ActivityCard activity={activity} onPress={handleActivityPress} />
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={48}
                  color={colors.onSurfaceVariant}
                />
                <StyledText
                  style={{
                    ...M3Typography.body.medium,
                    color: colors.onSurfaceVariant,
                    marginTop: M3Spacing.sm,
                  }}
                >
                  No recent activities
                </StyledText>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(500)}
          style={styles.section}
        >
          <StyledText
            style={{
              ...M3Typography.title.large,
              color: colors.onBackground,
              fontWeight: '600',
              marginBottom: M3Spacing.lg,
            }}
          >
            Quick Actions
          </StyledText>

          <View style={styles.quickActionsGrid}>
            {[
              { icon: 'plus-circle', label: 'New Inspection', route: '/inspection-form' },
              { icon: 'file-chart', label: 'View Reports', route: '/performance' },
              { icon: 'map-marker-path', label: 'Navigate to Site', route: '/sites' },
              { icon: 'calendar-plus', label: 'Schedule Visit', route: '/schedule' },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickActionButton,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    ...M3Elevation.level1,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.quickActionContent}>
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={32}
                    color={colors.primary}
                  />
                  <StyledText
                    style={{
                      ...M3Typography.label.medium,
                      color: colors.onSurface,
                      marginTop: M3Spacing.sm,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {action.label}
                  </StyledText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: M3Spacing.xxxl + insets.bottom }} />
      </ScrollView>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.lg,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: M3Spacing.lg,
  },
  heroCard: {
    borderRadius: M3Shape.extraLarge,
    padding: M3Spacing.xl,
    marginBottom: M3Spacing.lg,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: M3Shape.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: M3Spacing.md,
    marginBottom: M3Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: M3Shape.large,
    padding: M3Spacing.lg,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: M3Shape.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: M3Spacing.lg,
    borderRadius: M3Shape.large,
    marginBottom: M3Spacing.xl,
  },
  section: {
    marginBottom: M3Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: M3Spacing.md,
  },
  activityList: {
    gap: M3Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.xxl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: M3Spacing.md,
  },
  quickActionButton: {
    width: '48%',
    borderRadius: M3Shape.large,
    padding: M3Spacing.lg,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
