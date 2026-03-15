/**
 * Performance Analytics Screen
 * Corrected: Scope for noOfSections fixed and Reanimated warnings resolved.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StyledText from './components/StyledText';
import M3AlertDialog from './components/M3AlertDialog';
import M3SiteSelectorModal from './components/M3SiteSelectorModal';
import { useMaterialYouColors, useAnimatedMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../lib/design/tokens';
import { useSites } from '../lib/hooks/useSites';
import { usePerformanceData } from '../lib/hooks/usePerformanceData';
import { PERFORMANCE_DATA } from '../lib/data/performanceData';
import { Site } from '../lib/types';
import { generatePerformancePDF } from '../lib/utils/pdfGenerator';

export default function PerformanceScreen() {
  const colors = useMaterialYouColors();
  const animatedColors = useAnimatedMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { sites } = useSites();
  const { weeklyGroups, getStatsForPeriod, getChartDataForPeriod } = usePerformanceData();

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // Chart Configuration Constants
  const noOfSections = 4;

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  const allSites: Site[] = useMemo(
    () =>
      sites.map((s) => ({
        id: s.id,
        name: s.name,
        location: { lat: s.latitude, lng: s.longitude },
        capacity: s.capacity,
        createdAt: s.createdAt.getTime(),
      })),
    [sites]
  );

  const selectedSite = useMemo(
    () => (selectedSiteId ? allSites.find((s) => s.id === selectedSiteId) || null : null),
    [selectedSiteId, allSites]
  );

  const displayName = selectedSite ? selectedSite.name : 'All Sites Combined';
  const displayCapacity = selectedSite ? selectedSite.capacity : `${allSites.length} Sites`;

  const currentPeriod = weeklyGroups[currentPeriodIndex];
  const dailyData = useMemo(
    () => (currentPeriod ? getChartDataForPeriod(currentPeriodIndex, selectedSiteId) : []),
    [currentPeriod, currentPeriodIndex, selectedSiteId, getChartDataForPeriod]
  );
  const stats = useMemo(
    () =>
      currentPeriod
        ? getStatsForPeriod(currentPeriodIndex, selectedSiteId)
        : { avgGeneration: 0, peakPower: 0, totalEnergy: 0, efficiency: 0 },
    [currentPeriod, currentPeriodIndex, selectedSiteId, getStatsForPeriod]
  );

  const goToPreviousPeriod = () => { if (currentPeriodIndex > 0) setCurrentPeriodIndex(currentPeriodIndex - 1); };
  const goToNextPeriod = () => { if (currentPeriodIndex < weeklyGroups.length - 1) setCurrentPeriodIndex(currentPeriodIndex + 1); };

  const barData = useMemo(
    () =>
      dailyData.map((day) => {
        const parts = day.date.split('-');
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate();

        const maxExpected = 60;
        const ratio = day.value / maxExpected;
        let color = colors.tertiary;
        if (ratio >= 0.8) color = colors.primary;
        else if (ratio >= 0.5) color = colors.secondary;
        else color = colors.error;

        return { value: day.value, label: `${dayName}\n${dayNum}`, frontColor: color };
      }),
    [dailyData, colors]
  );

  const { step, yAxisMax } = useMemo(() => {
    const rawMax = dailyData.length > 0 ? Math.max(...dailyData.map((d) => d.value)) : 10;
    let calculatedStep = Math.ceil(Math.max(rawMax, 10) / noOfSections);
    calculatedStep = Math.ceil(calculatedStep / 5) * 5;
    return { step: calculatedStep, yAxisMax: calculatedStep * noOfSections };
  }, [dailyData]);

  const safeChartWidth = SCREEN_WIDTH - M3Spacing.lg * 2 - 60;
  const pieRadius = Math.min(SCREEN_WIDTH * 0.25, 90);
  const innerRadius = pieRadius * 0.65;

  const pieData = useMemo(
    () =>
      [
        { value: PERFORMANCE_DATA.overPerformingDays, color: colors.primary, label: 'Over' },
        { value: PERFORMANCE_DATA.normalDays, color: colors.secondary, label: 'Normal' },
        { value: PERFORMANCE_DATA.underPerformingDays, color: colors.tertiary, label: 'Under' },
        { value: PERFORMANCE_DATA.zeroEnergyDays, color: colors.error, label: 'Zero' },
      ].filter((item) => item.value > 0),
    [colors]
  );

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const { uri, shared } = await generatePerformancePDF(
        selectedSite,
        currentPeriod?.periodLabel || 'Report',
        stats,
        dailyData
      );

      if (shared) {
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'Professional audit report generated and shared!',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to generate professional audit report',
        type: 'error',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <RNAnimated.View style={{ flex: 1, backgroundColor: animatedColors.background }}>
      <RNAnimated.View
        style={{
          paddingTop: insets.top + M3Spacing.lg,
          paddingHorizontal: M3Spacing.lg,
          paddingBottom: M3Spacing.lg,
          backgroundColor: animatedColors.surface,
          ...M3Elevation.level0,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <StyledText style={[M3Typography.headline.large, { color: colors.onSurface, fontWeight: '600' }]}>
              Performance Analytics
            </StyledText>
            <StyledText style={[M3Typography.body.medium, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              {currentPeriod?.periodLabel || 'No Data'}
            </StyledText>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: colors.secondaryContainer,
              width: 48,
              height: 48,
              borderRadius: M3Shape.full,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.onSecondaryContainer} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            marginTop: M3Spacing.md,
            backgroundColor: colors.surfaceContainerHighest,
            paddingVertical: M3Spacing.md,
            paddingHorizontal: M3Spacing.lg,
            borderRadius: M3Shape.large,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => setShowSiteSelector(true)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <StyledText style={[M3Typography.label.small, { color: colors.onSurfaceVariant, marginBottom: 4 }]}>
              Selected Site
            </StyledText>
            <StyledText style={[M3Typography.title.medium, { color: colors.onSurface, fontWeight: '600' }]}>
              {displayName}
            </StyledText>
            <StyledText style={[M3Typography.body.small, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {displayCapacity}
            </StyledText>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </RNAnimated.View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: M3Spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: M3Spacing.md, marginTop: M3Spacing.lg }}>
          <Animated.View entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(100)} style={{ flex: 1, backgroundColor: colors.primaryContainer, padding: M3Spacing.lg, borderRadius: M3Shape.extraLarge, ...M3Elevation.level1 }}>
            <View style={{ width: 48, height: 48, borderRadius: M3Shape.medium, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: M3Spacing.sm }}>
              <MaterialCommunityIcons name="chart-line" size={24} color={colors.onPrimary} />
            </View>
            <StyledText style={[M3Typography.headline.medium, { color: colors.onPrimaryContainer, fontWeight: '700' }]}>
              {stats.avgGeneration.toFixed(1)}
            </StyledText>
            <StyledText style={[M3Typography.body.small, { color: colors.onPrimaryContainer, opacity: 0.8, marginTop: 4 }]}>
              Avg kWh/day
            </StyledText>
          </Animated.View>

          <Animated.View entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(150)} style={{ flex: 1, backgroundColor: colors.secondaryContainer, padding: M3Spacing.lg, borderRadius: M3Shape.extraLarge, ...M3Elevation.level1 }}>
            <View style={{ width: 48, height: 48, borderRadius: M3Shape.medium, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: M3Spacing.sm }}>
              <MaterialCommunityIcons name="flash" size={24} color={colors.onSecondary} />
            </View>
            <StyledText style={[M3Typography.headline.medium, { color: colors.onSecondaryContainer, fontWeight: '700' }]}>
              {stats.peakPower.toFixed(1)}
            </StyledText>
            <StyledText style={[M3Typography.body.small, { color: colors.onSecondaryContainer, opacity: 0.8, marginTop: 4 }]}>
              Peak kWh
            </StyledText>
          </Animated.View>
        </View>

        <Animated.View entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(200)} style={{ backgroundColor: colors.tertiaryContainer, padding: M3Spacing.lg, borderRadius: M3Shape.extraLarge, marginTop: M3Spacing.md, ...M3Elevation.level1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <StyledText style={[M3Typography.label.medium, { color: colors.onTertiaryContainer, opacity: 0.8, marginBottom: 4 }]}>
                Total Energy Generated
              </StyledText>
              <StyledText style={[M3Typography.display.small, { color: colors.onTertiaryContainer, fontWeight: '700' }]}>
                {stats.totalEnergy.toFixed(1)} kWh
              </StyledText>
            </View>
            <View style={{ width: 64, height: 64, borderRadius: M3Shape.large, backgroundColor: colors.tertiary, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.onTertiary} />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(250)} style={{ backgroundColor: colors.surfaceContainerHigh, padding: M3Spacing.lg, borderRadius: M3Shape.extraLarge, marginTop: M3Spacing.lg, ...M3Elevation.level2, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: M3Spacing.md }}>
            <TouchableOpacity onPress={goToPreviousPeriod} disabled={currentPeriodIndex === 0} style={{ opacity: currentPeriodIndex === 0 ? 0.3 : 1, padding: M3Spacing.sm }}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
            </TouchableOpacity>
            <StyledText style={[M3Typography.title.large, { color: colors.onSurface, fontWeight: '600' }]}>
              Daily Generation
            </StyledText>
            <TouchableOpacity onPress={goToNextPeriod} disabled={currentPeriodIndex === weeklyGroups.length - 1} style={{ opacity: currentPeriodIndex === weeklyGroups.length - 1 ? 0.3 : 1, padding: M3Spacing.sm }}>
              <MaterialCommunityIcons name="chevron-right" size={28} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={{ width: '100%', paddingTop: 10 }}>
            {barData.length > 0 ? (
              <View style={{ alignItems: 'center' }}>
                <BarChart
                  data={barData}
                  barWidth={24}
                  spacing={16}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={1}
                  xAxisColor={colors.outlineVariant}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: colors.onSurfaceVariant, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: colors.onSurfaceVariant, fontSize: 11 }}
                  noOfSections={noOfSections}
                  stepValue={step}
                  maxValue={yAxisMax}
                  width={safeChartWidth}
                  height={150}
                  isAnimated
                />
                <StyledText style={[M3Typography.label.medium, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
                  {currentPeriod?.periodLabel || 'Unknown Period'}
                </StyledText>
              </View>
            ) : (
              <View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
                <StyledText style={{ color: colors.onSurfaceVariant }}>No generation data available</StyledText>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(300)} style={{ backgroundColor: colors.surfaceContainerHigh, padding: M3Spacing.lg, borderRadius: M3Shape.extraLarge, marginTop: M3Spacing.lg, ...M3Elevation.level2, overflow: 'hidden' }}>
          <StyledText style={[M3Typography.title.large, { color: colors.onSurface, fontWeight: '600', marginBottom: M3Spacing.lg }]}>
            Performance Distribution
          </StyledText>
          <View style={{ alignItems: 'center', marginVertical: M3Spacing.md, height: pieRadius * 2 + 20, justifyContent: 'center' }}>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                donut
                innerRadius={innerRadius}
                radius={pieRadius}
                innerCircleColor={colors.surfaceContainerHigh}
                centerLabelComponent={() => (
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <StyledText style={[M3Typography.display.small, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
                      {dailyData.length}
                    </StyledText>
                    <StyledText style={[M3Typography.body.small, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                      Days
                    </StyledText>
                  </View>
                )}
              />
            ) : (
              <StyledText style={{ color: colors.onSurfaceVariant }}>No performance distribution data</StyledText>
            )}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: M3Spacing.md, marginTop: M3Spacing.md, justifyContent: 'center' }}>
            {pieData.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 16, height: 16, borderRadius: M3Shape.full, backgroundColor: item.color, marginRight: M3Spacing.xs }} />
                <StyledText style={[M3Typography.body.medium, { color: colors.onSurface }]}>
                  {item.label}: {item.value}
                </StyledText>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Corrected Animated Button Wrapper to resolve Layout Animation warning */}
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(350)}
          style={{ marginTop: M3Spacing.lg }}
        >
          <TouchableOpacity
            onPress={handleGeneratePDF}
            disabled={generatingPDF}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: M3Spacing.lg,
              paddingHorizontal: M3Spacing.xl,
              borderRadius: M3Shape.extraLarge,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              ...M3Elevation.level3,
              opacity: generatingPDF ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {generatingPDF ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.onPrimary} />
                <StyledText style={[M3Typography.label.large, { color: colors.onPrimary, marginLeft: M3Spacing.sm, fontWeight: '600' }]}>
                  Export PDF Report
                </StyledText>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: M3Spacing.xxxl + insets.bottom }} />
      </ScrollView>

      <M3SiteSelectorModal visible={showSiteSelector} sites={allSites} selectedSiteId={selectedSiteId} onSelectSite={(siteId) => { setSelectedSiteId(siteId); }} onDismiss={() => setShowSiteSelector(false)} showSearch={allSites.length > 10} />
      <M3AlertDialog visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })} />
    </RNAnimated.View>
  );
}
