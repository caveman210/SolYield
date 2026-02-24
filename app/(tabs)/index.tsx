import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StyledText from '../components/StyledText';
import ActivityCard from '../components/ActivityCard';
import {
  useMaterialYouColors,
  useAnimatedMaterialYouColors,
} from '../../lib/hooks/MaterialYouProvider';
import { useRecentActivities } from '../../lib/hooks/useActivityManager';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../../lib/design/tokens';
import { Activity } from '../../lib/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Dashboard Screen Component (Presentation)
 * Displays overview with stats, recent activities, and quick actions
 * Business logic delegated to custom hooks
 */
export default function Dashboard() {
  const colors = useMaterialYouColors();
  const animatedColors = useAnimatedMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get recent activities from Redux store via hook
  const { activities: recentActivities } = useRecentActivities(3);

  const handleActivityPress = (activity: Activity) => {
    // Navigate to relevant screen based on activity
    if (activity.siteId) {
      router.push(`/site/${activity.siteId}` as any);
    }
  };

  return (
    <RNAnimated.View style={{ flex: 1, backgroundColor: animatedColors.background }}>
      {/* Header with safe area insets */}
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
        >
          <MaterialCommunityIcons
            name="bell-outline"
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
                  3
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

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
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
              12
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.medium,
                color: colors.onSecondaryContainer,
                opacity: 0.8,
                marginTop: M3Spacing.xs,
              }}
            >
              Active Sites
            </StyledText>
          </AnimatedTouchable>

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
            onPress={() => router.push('/performance')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.tertiary }]}>
              <MaterialCommunityIcons name="chart-line" size={28} color={colors.onTertiary} />
            </View>
            <StyledText
              style={{
                ...M3Typography.headline.small,
                color: colors.onTertiaryContainer,
                fontWeight: '700',
                marginTop: M3Spacing.md,
              }}
            >
              92%
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.medium,
                color: colors.onTertiaryContainer,
                opacity: 0.8,
                marginTop: M3Spacing.xs,
              }}
            >
              Performance
            </StyledText>
          </AnimatedTouchable>
        </View>

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

          {/* Activity Cards */}
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
              { icon: 'plus-circle', label: 'New Inspection', route: '/inspection' },
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

        {/* Bottom padding for tab bar and safe area */}
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
  section: {
    marginBottom: M3Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: M3Spacing.lg,
  },
  activityList: {
    gap: M3Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: M3Spacing.md,
  },
  quickActionButton: {
    width: '47.5%',
    aspectRatio: 1,
    borderRadius: M3Shape.large,
    padding: M3Spacing.lg,
  },
  quickActionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
