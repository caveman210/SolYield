import React from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StyledText from '../components/StyledText';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../../lib/design/tokens';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Dashboard() {
  const colors = useMaterialYouColors();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(M3Motion.duration.emphasized)}
          style={styles.header}
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
            style={[
              styles.iconButton,
              { backgroundColor: colors.secondaryContainer }
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="bell-outline" 
              size={24} 
              color={colors.onSecondaryContainer} 
            />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <Animated.View
            entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(100)}
          >
            <View 
              style={[
                styles.heroCard,
                { 
                  backgroundColor: colors.primaryContainer,
                  ...M3Elevation.level1,
                }
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
                <View 
                  style={[
                    styles.heroIcon,
                    { backgroundColor: colors.primary }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name="calendar-today" 
                    size={40} 
                    color={colors.onPrimary} 
                  />
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
                }
              ]}
              activeOpacity={0.8}
              onPress={() => router.push('/sites')}
            >
              <View 
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.secondary }
                ]}
              >
                <MaterialCommunityIcons 
                  name="solar-panel" 
                  size={28} 
                  color={colors.onSecondary} 
                />
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
                }
              ]}
              activeOpacity={0.8}
              onPress={() => router.push('/performance')}
            >
              <View 
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.tertiary }
                ]}
              >
                <MaterialCommunityIcons 
                  name="chart-line" 
                  size={28} 
                  color={colors.onTertiary} 
                />
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
              <TouchableOpacity>
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
              {[
                {
                  icon: 'check-circle',
                  title: 'Site A Inspection Complete',
                  time: '2 hours ago',
                  color: colors.tertiary,
                },
                {
                  icon: 'wrench',
                  title: 'Maintenance Scheduled - Site B',
                  time: '5 hours ago',
                  color: colors.secondary,
                },
                {
                  icon: 'file-document',
                  title: 'Report Generated - Site C',
                  time: 'Yesterday',
                  color: colors.primary,
                },
              ].map((item, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInUp.duration(M3Motion.duration.normal).delay(350 + index * 50)}
                >
                  <TouchableOpacity
                    style={[
                      styles.activityCard,
                      { 
                        backgroundColor: colors.surfaceContainer,
                        borderLeftColor: item.color,
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View 
                      style={[
                        styles.activityIconContainer,
                        { backgroundColor: `${item.color}20` }
                      ]}
                    >
                      <MaterialCommunityIcons 
                        name={item.icon as any} 
                        size={20} 
                        color={item.color} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <StyledText 
                        style={{ 
                          ...M3Typography.body.large, 
                          color: colors.onSurface,
                          fontWeight: '500',
                        }}
                      >
                        {item.title}
                      </StyledText>
                      <StyledText 
                        style={{ 
                          ...M3Typography.body.small, 
                          color: colors.onSurfaceVariant,
                          marginTop: 2,
                        }}
                      >
                        {item.time}
                      </StyledText>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={20} 
                      color={colors.onSurfaceVariant} 
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
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
                <AnimatedTouchable
                  key={index}
                  entering={FadeInUp.duration(M3Motion.duration.normal).delay(550 + index * 30)}
                  style={[
                    styles.quickActionButton,
                    { 
                      backgroundColor: colors.surface,
                      ...M3Elevation.level1,
                    }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push(action.route as any)}
                >
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
                  >
                    {action.label}
                  </StyledText>
                </AnimatedTouchable>
              ))}
            </View>
          </Animated.View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: M3Spacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
    borderLeftWidth: 4,
    gap: M3Spacing.md,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: M3Shape.small,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
