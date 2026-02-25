import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { SITES } from '../lib/data/sites';
import { CHART_DATA } from '../lib/data/chartData';
import { PERFORMANCE_DATA } from '../lib/data/performanceData';
import {
  flattenChartData,
  calculateAverage,
  calculatePeak,
  calculateTotal,
} from '../lib/utils/chartHelpers';
import { formatDate } from '../lib/utils/dateFormatter';
import { M3Motion } from '../lib/design';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { PDF_COLORS } from '../lib/design/staticColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function PerformanceScreen() {
  const params = useLocalSearchParams();
  const colors = useMaterialYouColors();
  const siteId = params.siteId as string | undefined;
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const site = siteId ? SITES.find((s) => s.id === siteId) : SITES[0];

  // Group data by month for navigation
  const monthlyGroups = CHART_DATA.map((monthData) => {
    const flattened = monthData.days;
    const firstDate = new Date(flattened[0].date);
    const monthName = firstDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return {
      monthName,
      data: flattened,
    };
  });

  const currentMonth = monthlyGroups[currentMonthIndex] || monthlyGroups[0];
  const dailyData = currentMonth.data;

  const avgGeneration = calculateAverage(dailyData);
  const peakGeneration = calculatePeak(dailyData);
  const totalGeneration = calculateTotal(dailyData);

  // Month navigation handlers
  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex < monthlyGroups.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  // Pastel green-yellow-red gradient based on performance
  const getBarColor = (value: number) => {
    const maxExpected = 60; // Expected max generation
    const ratio = value / maxExpected;

    if (ratio >= 0.8) return '#66BB6A'; // Pastel green (good)
    if (ratio >= 0.5) return '#FFA726'; // Pastel yellow/orange (medium)
    return '#EF5350'; // Pastel red (low/danger)
  };

  // Better chart labels showing day number
  const barData = dailyData.map((day, index) => {
    const date = new Date(day.date);
    const dayNum = date.getDate();

    return {
      value: day.energyGeneratedkWh,
      label: String(dayNum),
      frontColor: getBarColor(day.energyGeneratedkWh),
    };
  });

  // Pie chart with pastel Material You colors
  const pieData = [
    {
      value: PERFORMANCE_DATA.overPerformingDays,
      color: '#66BB6A', // Pastel green
      label: 'Over',
    },
    {
      value: PERFORMANCE_DATA.normalDays,
      color: '#42A5F5', // Pastel blue
      label: 'Normal',
    },
    {
      value: PERFORMANCE_DATA.underPerformingDays,
      color: '#FFA726', // Pastel orange
      label: 'Under',
    },
    {
      value: PERFORMANCE_DATA.daysNoData,
      color: '#9E9E9E', // Pastel grey
      label: 'No Data',
    },
    {
      value: PERFORMANCE_DATA.zeroEnergyDays,
      color: '#EF5350', // Pastel red
      label: 'Zero',
    },
  ].filter((item) => item.value > 0);

  const generatePDF = async () => {
    setGeneratingPDF(true);

    try {
      // Use static PDF colors for accessibility and easy viewing
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
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid ${PDF_COLORS.section.border};
              }
              th {
                background: ${PDF_COLORS.header.background};
                color: ${PDF_COLORS.header.text};
                font-weight: 600;
              }
              tr:nth-child(even) { background: ${colors.surfaceContainerLow}; }
              .performance-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
              }
              .perf-item {
                background: ${colors.surfaceContainer};
                padding: 12px;
                border-radius: 8px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid ${colors.outlineVariant};
                text-align: center;
                color: ${colors.outline};
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${site?.name || 'All Sites'} - Performance Report</h1>
              <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
              <p class="subtitle">Capacity: ${site?.capacity || 'N/A'}</p>
            </div>

            <div class="section">
              <h2>Performance Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="label">Average Generation</div>
                  <div class="value">${avgGeneration.toFixed(1)}</div>
                  <div class="unit">kWh/day</div>
                </div>
                <div class="stat-card">
                  <div class="label">Peak Generation</div>
                  <div class="value">${peakGeneration.toFixed(1)}</div>
                  <div class="unit">kWh</div>
                </div>
                <div class="stat-card">
                  <div class="label">Total Energy</div>
                  <div class="value">${totalGeneration.toFixed(1)}</div>
                  <div class="unit">kWh</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Day Classification</h2>
              <div class="performance-grid">
                <div class="perf-item">Over-Performing: ${PERFORMANCE_DATA.overPerformingDays} days</div>
                <div class="perf-item">Normal: ${PERFORMANCE_DATA.normalDays} days</div>
                <div class="perf-item">Under-Performing: ${PERFORMANCE_DATA.underPerformingDays} days</div>
                <div class="perf-item">Zero Energy: ${PERFORMANCE_DATA.zeroEnergyDays} days</div>
              </div>
            </div>

            <div class="section">
              <h2>Daily Generation Data</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Energy (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  ${dailyData
                    .map(
                      (day) => `
                    <tr>
                      <td>${formatDate(day.date)}</td>
                      <td>${day.energyGeneratedkWh.toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
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
        Alert.alert('Success', 'PDF report has been generated and shared!');
      } else {
        Alert.alert('PDF Generated', `Report saved at: ${uri}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.medium)}
          style={[styles.header, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.headerTitle, { color: colors.onPrimary }]}>
            Performance Analytics
          </Text>
          <Text style={[styles.headerSubtitle, { color: `${colors.onPrimary}E6` }]}>
            {site?.name || 'All Sites'} | {site?.capacity || 'N/A'}
          </Text>
        </Animated.View>

        {/* Stats Cards */}
        <AnimatedView
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(100)}
          style={styles.statsContainer}
        >
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surfaceContainer,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Average</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>
              {avgGeneration.toFixed(1)}
            </Text>
            <Text style={[styles.statUnit, { color: colors.outline }]}>kWh/day</Text>
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
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Peak</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>
              {peakGeneration.toFixed(1)}
            </Text>
            <Text style={[styles.statUnit, { color: colors.outline }]}>kWh</Text>
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
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Total</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>
              {totalGeneration.toFixed(1)}
            </Text>
            <Text style={[styles.statUnit, { color: colors.outline }]}>kWh</Text>
          </View>
        </AnimatedView>

        {/* Bar Chart Section */}
        <AnimatedView
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(200)}
          style={[
            styles.chartSection,
            {
              backgroundColor: colors.surfaceContainer,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {/* Month Navigation Header */}
          <View style={styles.monthNavigationContainer}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              disabled={currentMonthIndex === 0}
              style={[styles.monthNavButton, { opacity: currentMonthIndex === 0 ? 0.3 : 1 }]}
            >
              <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.onSurface }]}>
              {currentMonth.monthName}
            </Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={currentMonthIndex === monthlyGroups.length - 1}
              style={[
                styles.monthNavButton,
                { opacity: currentMonthIndex === monthlyGroups.length - 1 ? 0.3 : 1 },
              ]}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
            Daily Energy Generation
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={barData}
              barWidth={28}
              spacing={12}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.onSurfaceVariant }}
              noOfSections={4}
              maxValue={Math.ceil(peakGeneration * 1.2)}
            />
          </ScrollView>
        </AnimatedView>

        {/* Pie Chart Section */}
        <AnimatedView
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(300)}
          style={[
            styles.chartSection,
            {
              backgroundColor: colors.surfaceContainer,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
            Performance Distribution
          </Text>
          <View style={styles.pieChartContainer}>
            <PieChart
              data={pieData}
              donut
              innerRadius={60}
              radius={100}
              innerCircleColor={colors.surfaceContainer}
              centerLabelComponent={() => (
                <View>
                  <Text style={[styles.pieChartCenterValue, { color: colors.onSurface }]}>
                    {dailyData.length}
                  </Text>
                  <Text style={[styles.pieChartCenterLabel, { color: colors.onSurfaceVariant }]}>
                    Days
                  </Text>
                </View>
              )}
            />
          </View>
          <View style={styles.legendContainer}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  {item.label}: {item.value}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedView>

        {/* Performance Breakdown */}
        <AnimatedView
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(400)}
          style={[
            styles.breakdownSection,
            {
              backgroundColor: colors.surfaceContainer,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.onSurface }]}>
            Performance Breakdown
          </Text>
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownItem}>
              <View
                style={[
                  styles.breakdownIconContainer,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Ionicons name="trending-up" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {PERFORMANCE_DATA.overPerformingDays}
              </Text>
              <Text style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                Over-Performing
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[
                  styles.breakdownIconContainer,
                  { backgroundColor: colors.secondaryContainer },
                ]}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {PERFORMANCE_DATA.normalDays}
              </Text>
              <Text style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                Normal
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[
                  styles.breakdownIconContainer,
                  { backgroundColor: colors.tertiaryContainer },
                ]}
              >
                <Ionicons name="trending-down" size={24} color={colors.tertiary} />
              </View>
              <Text style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {PERFORMANCE_DATA.underPerformingDays}
              </Text>
              <Text style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                Under-Performing
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.breakdownIconContainer, { backgroundColor: colors.errorContainer }]}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </View>
              <Text style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {PERFORMANCE_DATA.zeroEnergyDays}
              </Text>
              <Text style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                Zero Energy
              </Text>
            </View>
          </View>
        </AnimatedView>

        {/* Export Button */}
        <AnimatedTouchableOpacity
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(500)}
          onPress={generatePDF}
          disabled={generatingPDF}
          style={[
            styles.exportButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.shadow,
              opacity: generatingPDF ? 0.6 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {generatingPDF ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="document-text" size={24} color={colors.onPrimary} />
              <Text style={[styles.exportButtonText, { color: colors.onPrimary }]}>
                Export PDF Report
              </Text>
            </>
          )}
        </AnimatedTouchableOpacity>

        <View style={styles.bottomPadding} />
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
  header: {
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
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
    fontSize: 22,
    fontWeight: '400',
  },
  statUnit: {
    fontSize: 12,
  },
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  pieChartCenterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pieChartCenterLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 14,
  },
  breakdownSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  breakdownItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
  },
  breakdownIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  exportButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 32,
  },
  monthNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});
