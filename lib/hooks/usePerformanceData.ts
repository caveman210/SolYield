import { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { getPerformanceRecordsCollection, getSitesCollection } from '../../database';
import PerformanceRecord from '../../database/models/PerformanceRecord';

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MonthlyData {
  month: string; // e.g., "January 2025"
  year: number;
  data: ChartDataPoint[];
}

export interface PerformanceStats {
  avgGeneration: number;
  peakPower: number;
  totalEnergy: number;
  efficiency: number;
}

export interface UsePerformanceDataResult {
  monthlyGroups: MonthlyData[];
  isLoading: boolean;
  error: Error | null;
  getStatsForMonth: (monthIndex: number, siteId?: string | null) => PerformanceStats;
  getChartDataForMonth: (monthIndex: number, siteId?: string | null) => ChartDataPoint[];
}

/**
 * Hook to query and aggregate performance data from WatermelonDB.
 * Supports filtering by site or showing aggregate data for all sites.
 */
export function usePerformanceData(): UsePerformanceDataResult {
  const database = useDatabase();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all performance records
  useEffect(() => {
    let mounted = true;

    const loadRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const performanceCollection = getPerformanceRecordsCollection();
        const allRecords = await performanceCollection
          .query(Q.sortBy('date', Q.desc))
          .fetch();

        if (mounted) {
          setRecords(allRecords);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading performance records:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      mounted = false;
    };
  }, [database]);

  // Group records by month
  const monthlyGroups = useMemo(() => {
    const grouped: { [key: string]: PerformanceRecord[] } = {};

    records.forEach((record) => {
      // Parse date string (YYYY-MM-DD format)
      const dateParts = record.date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // 0-indexed

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const monthKey = `${monthNames[month]} ${year}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(record);
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .map(([monthKey, monthRecords]) => {
        const [monthName, yearStr] = monthKey.split(' ');
        const year = parseInt(yearStr);

        // Sort records by date within month
        const sortedRecords = monthRecords.sort((a, b) => {
          return a.date.localeCompare(b.date);
        });

        const data: ChartDataPoint[] = sortedRecords.map((record) => ({
          date: record.date,
          value: record.energyGeneratedKwh,
          label: record.date.split('-')[2], // Day of month
        }));

        return {
          month: monthKey,
          year,
          data,
        };
      })
      .sort((a, b) => {
        // Sort by year, then by month name
        if (a.year !== b.year) return b.year - a.year;
        const monthOrder = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const aMonth = monthOrder.indexOf(a.month.split(' ')[0]);
        const bMonth = monthOrder.indexOf(b.month.split(' ')[0]);
        return bMonth - aMonth;
      });
  }, [records]);

  /**
   * Get statistics for a specific month, optionally filtered by site.
   */
  const getStatsForMonth = (monthIndex: number, siteId?: string | null): PerformanceStats => {
    if (monthIndex < 0 || monthIndex >= monthlyGroups.length) {
      return { avgGeneration: 0, peakPower: 0, totalEnergy: 0, efficiency: 0 };
    }

    const monthData = monthlyGroups[monthIndex];
    
    // Filter records by site if specified
    let relevantRecords = records.filter((r) => {
      // Check if record belongs to this month
      const recordMonth = `${r.date.split('-')[1]}/${r.date.split('-')[0]}`;
      const targetMonth = `${String(monthData.year).padStart(2, '0')}/${monthData.year}`;
      
      // Simple month match (can be improved)
      const monthMatches = r.date.includes(String(monthData.year));
      
      if (siteId) {
        return monthMatches && r.siteId === siteId;
      }
      return monthMatches;
    });

    if (relevantRecords.length === 0) {
      return { avgGeneration: 0, peakPower: 0, totalEnergy: 0, efficiency: 0 };
    }

    const totalEnergy = relevantRecords.reduce((sum, r) => sum + r.energyGeneratedKwh, 0);
    const avgGeneration = totalEnergy / relevantRecords.length;
    const peakPower = Math.max(...relevantRecords.map((r) => r.peakPower ?? 0));
    const avgEfficiency = relevantRecords.reduce((sum, r) => sum + (r.efficiencyPercentage ?? 0), 0) / relevantRecords.length;

    return {
      avgGeneration: Math.round(avgGeneration * 10) / 10,
      peakPower: Math.round(peakPower * 10) / 10,
      totalEnergy: Math.round(totalEnergy * 10) / 10,
      efficiency: Math.round(avgEfficiency * 10) / 10,
    };
  };

  /**
   * Get chart data for a specific month, optionally filtered by site.
   */
  const getChartDataForMonth = (monthIndex: number, siteId?: string | null): ChartDataPoint[] => {
    if (monthIndex < 0 || monthIndex >= monthlyGroups.length) {
      return [];
    }

    const monthData = monthlyGroups[monthIndex];

    if (!siteId) {
      // Return aggregate data for all sites
      return monthData.data;
    }

    // Filter by specific site
    const siteRecords = records.filter((r) => {
      const monthMatches = r.date.includes(String(monthData.year));
      return monthMatches && r.siteId === siteId;
    });

    return siteRecords
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((record) => ({
        date: record.date,
        value: record.energyGeneratedKwh,
        label: record.date.split('-')[2],
      }));
  };

  return {
    monthlyGroups,
    isLoading,
    error,
    getStatsForMonth,
    getChartDataForMonth,
  };
}
