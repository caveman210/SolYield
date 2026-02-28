/**
 * Performance Analytics Screen
 * 
 * M3Expressive themed performance dashboard with:
 * - Site dropdown selector (All Sites aggregate + individual sites)
 * - Aggregated data visualization for all sites combined
 * - Material You dynamic colors throughout
 * - PDF export with comprehensive reports
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import {
  calculateAverage,
  calculatePeak,
  calculateTotal,
} from '../lib/utils/chartHelpers';
import { formatDate } from '../lib/utils/dateFormatter';
import { PDF_COLORS } from '../lib/design/staticColors';
import { Site } from '../lib/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PerformanceScreen() {
  const colors = useMaterialYouColors();
  const animatedColors = useAnimatedMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sites, isLoading: sitesLoading } = useSites();
  const {
    monthlyGroups,
    isLoading: performanceLoading,
    getStatsForMonth,
    getChartDataForMonth,
  } = usePerformanceData();

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
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

  // Convert WatermelonDB sites to legacy Site format
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

  // Get selected site or null for "All Sites"
  const selectedSite = selectedSiteId ? allSites.find((s) => s.id === selectedSiteId) : null;
  const displayName = selectedSite ? selectedSite.name : 'All Sites Combined';
  const displayCapacity = selectedSite ? selectedSite.capacity : `${allSites.length} Sites`;

  // Get current month data
  const currentMonth = monthlyGroups[currentMonthIndex];
  const dailyData = currentMonth ? getChartDataForMonth(currentMonthIndex, selectedSiteId) : [];
  const stats = currentMonth ? getStatsForMonth(currentMonthIndex, selectedSiteId) : {
    avgGeneration: 0,
    peakPower: 0,
    totalEnergy: 0,
    efficiency: 0,
  };

  // Month navigation
  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) setCurrentMonthIndex(currentMonthIndex - 1);
  };

  const goToNextMonth = () => {
    if (currentMonthIndex < monthlyGroups.length - 1) setCurrentMonthIndex(currentMonthIndex + 1);
  };

  // Bar chart data with Material You themed colors
  const barData = dailyData.map((day) => {
    const date = new Date(day.date);
    const dayNum = date.getDate();
    const value = day.value; // Already contains the aggregated value

    // Dynamic color based on performance
    const maxExpected = 60;
    const ratio = value / maxExpected;
    let color = colors.tertiary; // Default
    if (ratio >= 0.8) color = colors.primary; // High performance
    else if (ratio >= 0.5) color = colors.secondary; // Medium performance
    else color = colors.error; // Low performance

    return {
      value,
      label: String(dayNum),
      frontColor: color,
    };
  });

  // Calculate chart dimensions
  const barWidth = 32;
  const spacing = 16;
  const chartPadding = 60; // Left padding for Y-axis labels
  const chartWidth = barData.length * (barWidth + spacing) + chartPadding;

  // Pie chart data with Material You colors
  const pieData = [
    {
      value: PERFORMANCE_DATA.overPerformingDays,
      color: colors.primary,
      label: 'Over',
    },
    {
      value: PERFORMANCE_DATA.normalDays,
      color: colors.secondary,
      label: 'Normal',
    },
    {
      value: PERFORMANCE_DATA.underPerformingDays,
      color: colors.tertiary,
      label: 'Under',
    },
    {
      value: PERFORMANCE_DATA.zeroEnergyDays,
      color: colors.error,
      label: 'Zero',
    },
  ].filter((item) => item.value > 0);

  const generatePDF = async () => {
    setGeneratingPDF(true);

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 40px;
                color: ${PDF_COLORS.section.text};
                background: white;
              }
              .header {
                border-bottom: 4px solid ${PDF_COLORS.header.background};
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: ${PDF_COLORS.header.background};
                font-size: 28px;
                margin-bottom: 8px;
              }
              .header .subtitle {
                color: ${PDF_COLORS.section.text};
                opacity: 0.7;
                font-size: 16px;
              }
              .section { margin-bottom: 30px; }
              .section h2 {
                color: ${PDF_COLORS.section.text};
                font-size: 20px;
                margin-bottom: 16px;
                border-left: 4px solid ${PDF_COLORS.chart.primary};
                padding-left: 12px;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 30px;
              }
              .stat-card {
                background: ${PDF_COLORS.section.background};
                padding: 20px;
                border-radius: 12px;
                border-left: 4px solid ${PDF_COLORS.chart.primary};
              }
              .stat-card .label {
                color: ${PDF_COLORS.section.text};
                opacity: 0.7;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .stat-card .value {
                color: ${PDF_COLORS.section.text};
                font-size: 24px;
                font-weight: bold;
              }
              .stat-card .unit {
                color: ${PDF_COLORS.section.text};
                opacity: 0.6;
                font-size: 14px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #E0E0E0;
                text-align: center;
                color: #757575;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${displayName} - Performance Report</h1>
              <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
              <p class="subtitle">Capacity: ${displayCapacity}</p>
            </div>

            <div class="section">
              <h2>Performance Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="label">Average Generation</div>
                  <div class="value">${stats.avgGeneration.toFixed(1)}</div>
                  <div class="unit">kWh/day</div>
                </div>
                <div class="stat-card">
                  <div class="label">Peak Generation</div>
                  <div class="value">${stats.peakPower.toFixed(1)}</div>
                  <div class="unit">kWh</div>
                </div>
                <div class="stat-card">
                  <div class="label">Total Energy</div>
                  <div class="value">${stats.totalEnergy.toFixed(1)}</div>
                  <div class="unit">kWh</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>SolYield - Solar Farm Management System</p>
              <p>This report is generated automatically by the mobile application</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'PDF report has been generated and shared!',
          type: 'success',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'PDF Generated',
          message: `Report saved at: ${uri}`,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to generate PDF report',
        type: 'error',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <RNAnimated.View style={{ flex: 1, backgroundColor: animatedColors.background }}>
      {/* Header */}
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
            <StyledText
              style={{
                ...M3Typography.headline.large,
                color: colors.onSurface,
                fontWeight: '600',
              }}
            >
              Performance Analytics
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.medium,
                color: colors.onSurfaceVariant,
                marginTop: 4,
              }}
            >
              {currentMonth?.month || 'No Data'}
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

        {/* Site Selector */}
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
            <StyledText
              style={{
                ...M3Typography.label.small,
                color: colors.onSurfaceVariant,
                marginBottom: 4,
              }}
            >
              Selected Site
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.title.medium,
                color: colors.onSurface,
                fontWeight: '600',
              }}
            >
              {displayName}
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.small,
                color: colors.onSurfaceVariant,
                marginTop: 2,
              }}
            >
              {displayCapacity}
            </StyledText>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </RNAnimated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: M3Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', gap: M3Spacing.md, marginTop: M3Spacing.lg }}>
          <Animated.View
            entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(100)}
            style={{
              flex: 1,
              backgroundColor: colors.primaryContainer,
              padding: M3Spacing.lg,
              borderRadius: M3Shape.extraLarge,
              ...M3Elevation.level1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: M3Shape.medium,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: M3Spacing.sm,
              }}
            >
              <MaterialCommunityIcons name="chart-line" size={24} color={colors.onPrimary} />
            </View>
            <StyledText
              style={{
                ...M3Typography.headline.medium,
                color: colors.onPrimaryContainer,
                fontWeight: '700',
              }}
            >
              {stats.avgGeneration.toFixed(1)}
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.small,
                color: colors.onPrimaryContainer,
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              Avg kWh/day
            </StyledText>
          </Animated.View>

          <Animated.View
            entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(150)}
            style={{
              flex: 1,
              backgroundColor: colors.secondaryContainer,
              padding: M3Spacing.lg,
              borderRadius: M3Shape.extraLarge,
              ...M3Elevation.level1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: M3Shape.medium,
                backgroundColor: colors.secondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: M3Spacing.sm,
              }}
            >
              <MaterialCommunityIcons name="flash" size={24} color={colors.onSecondary} />
            </View>
            <StyledText
              style={{
                ...M3Typography.headline.medium,
                color: colors.onSecondaryContainer,
                fontWeight: '700',
              }}
            >
              {stats.peakPower.toFixed(1)}
            </StyledText>
            <StyledText
              style={{
                ...M3Typography.body.small,
                color: colors.onSecondaryContainer,
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              Peak kWh
            </StyledText>
          </Animated.View>
        </View>

        <Animated.View
          entering={SlideInRight.duration(M3Motion.duration.emphasized).delay(200)}
          style={{
            backgroundColor: colors.tertiaryContainer,
            padding: M3Spacing.lg,
            borderRadius: M3Shape.extraLarge,
            marginTop: M3Spacing.md,
            ...M3Elevation.level1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <StyledText
                style={{
                  ...M3Typography.label.medium,
                  color: colors.onTertiaryContainer,
                  opacity: 0.8,
                  marginBottom: 4,
                }}
              >
                Total Energy Generated
              </StyledText>
              <StyledText
                style={{
                  ...M3Typography.display.small,
                  color: colors.onTertiaryContainer,
                  fontWeight: '700',
                }}
              >
                {stats.totalEnergy.toFixed(1)} kWh
              </StyledText>
            </View>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: M3Shape.large,
                backgroundColor: colors.tertiary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.onTertiary} />
            </View>
          </View>
        </Animated.View>

        {/* Bar Chart */}
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(250)}
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            padding: M3Spacing.lg,
            borderRadius: M3Shape.extraLarge,
            marginTop: M3Spacing.lg,
            ...M3Elevation.level2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: M3Spacing.md }}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              disabled={currentMonthIndex === 0}
              style={{ opacity: currentMonthIndex === 0 ? 0.3 : 1, padding: M3Spacing.sm }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
            </TouchableOpacity>
            <StyledText
              style={{
                ...M3Typography.title.large,
                color: colors.onSurface,
                fontWeight: '600',
              }}
            >
              Daily Generation
            </StyledText>
            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={currentMonthIndex === monthlyGroups.length - 1}
              style={{ opacity: currentMonthIndex === monthlyGroups.length - 1 ? 0.3 : 1, padding: M3Spacing.sm }}
            >
              <MaterialCommunityIcons name="chevron-right" size={28} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ minWidth: chartWidth }}
          >
            <BarChart
              data={barData}
              barWidth={barWidth}
              spacing={spacing}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.onSurfaceVariant, ...M3Typography.body.small }}
              noOfSections={4}
              maxValue={Math.ceil(stats.peakPower * 1.2)}
              width={chartWidth - chartPadding}
            />
          </ScrollView>
        </Animated.View>

        {/* Pie Chart */}
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(300)}
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            padding: M3Spacing.lg,
            borderRadius: M3Shape.extraLarge,
            marginTop: M3Spacing.lg,
            ...M3Elevation.level2,
          }}
        >
          <StyledText
            style={{
              ...M3Typography.title.large,
              color: colors.onSurface,
              fontWeight: '600',
              marginBottom: M3Spacing.lg,
            }}
          >
            Performance Distribution
          </StyledText>
          <View style={{ alignItems: 'center', marginVertical: M3Spacing.md }}>
            <PieChart
              data={pieData}
              donut
              innerRadius={70}
              radius={110}
              innerCircleColor={colors.surfaceContainerHigh}
              centerLabelComponent={() => (
                <View>
                  <StyledText
                    style={{
                      ...M3Typography.display.small,
                      color: colors.onSurface,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                  >
                    {dailyData.length}
                  </StyledText>
                  <StyledText
                    style={{
                      ...M3Typography.body.small,
                      color: colors.onSurfaceVariant,
                      textAlign: 'center',
                    }}
                  >
                    Days
                  </StyledText>
                </View>
              )}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: M3Spacing.md, marginTop: M3Spacing.md }}>
            {pieData.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: M3Shape.full,
                    backgroundColor: item.color,
                    marginRight: M3Spacing.xs,
                  }}
                />
                <StyledText style={{ ...M3Typography.body.medium, color: colors.onSurface }}>
                  {item.label}: {item.value}
                </StyledText>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Export Button */}
        <AnimatedTouchable
          entering={FadeInUp.duration(M3Motion.duration.emphasized).delay(350)}
          onPress={generatePDF}
          disabled={generatingPDF}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: M3Spacing.lg,
            paddingHorizontal: M3Spacing.xl,
            borderRadius: M3Shape.extraLarge,
            marginTop: M3Spacing.lg,
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
              <StyledText
                style={{
                  ...M3Typography.label.large,
                  color: colors.onPrimary,
                  marginLeft: M3Spacing.sm,
                  fontWeight: '600',
                }}
              >
                Export PDF Report
              </StyledText>
            </>
          )}
        </AnimatedTouchable>

        <View style={{ height: M3Spacing.xxxl + insets.bottom }} />
      </ScrollView>

      {/* Site Selector Dialog */}
      <M3SiteSelectorModal
        visible={showSiteSelector}
        sites={allSites}
        selectedSiteId={selectedSiteId}
        onSelectSite={(siteId) => {
          setSelectedSiteId(siteId);
        }}
        onDismiss={() => setShowSiteSelector(false)}
        showSearch={allSites.length > 10}
      />

      {/* M3 Alert Dialog */}
      <M3AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </RNAnimated.View>
  );
}
