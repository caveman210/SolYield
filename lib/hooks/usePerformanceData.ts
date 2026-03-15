import { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { getPerformanceRecordsCollection } from '../../database';
import PerformanceRecord from '../../database/models/PerformanceRecord';

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface WeeklyData {
  periodLabel: string;
  sortKey: string;
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
  weeklyGroups: WeeklyData[];
  isLoading: boolean;
  error: Error | null;
  getStatsForPeriod: (periodIndex: number, siteId?: string | null) => PerformanceStats;
  getChartDataForPeriod: (periodIndex: number, siteId?: string | null) => ChartDataPoint[];
}

function getWeekInfo(dateStr: string) {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const start = new Date(d.getFullYear(), d.getMonth(), diff);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = end.getFullYear();

  let label = '';
  if (startMonth === endMonth) {
    label = `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    label = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
  
  const sortKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  
  return { label, sortKey, year };
}

export function usePerformanceData(): UsePerformanceDataResult {
  const database = useDatabase();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const performanceCollection = getPerformanceRecordsCollection();
        const allRecords = await performanceCollection.query(Q.sortBy('date', Q.desc)).fetch();

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
    return () => { mounted = false; };
  }, [database]);

  const weeklyGroups = useMemo(() => {
    const grouped: { [key: string]: { records: PerformanceRecord[], label: string, year: number } } = {};
    records.forEach((record) => {
      const { label, sortKey, year } = getWeekInfo(record.date);
      if (!grouped[sortKey]) {
        grouped[sortKey] = { records: [], label, year };
      }
      grouped[sortKey].records.push(record);
    });

    return Object.entries(grouped)
      .map(([sortKey, groupData]) => {
        const sortedRecords = groupData.records.sort((a, b) => a.date.localeCompare(b.date));
        const data: ChartDataPoint[] = sortedRecords.map((record) => ({
          date: record.date,
          value: record.energyGeneratedKwh,
          label: record.date.split('-')[2],
        }));
        return {
          periodLabel: groupData.label,
          sortKey,
          year: groupData.year,
          data,
        };
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [records]);

  const getStatsForPeriod = (periodIndex: number, siteId?: string | null): PerformanceStats => {
    if (periodIndex < 0 || periodIndex >= weeklyGroups.length) {
      return { avgGeneration: 0, peakPower: 0, totalEnergy: 0, efficiency: 0 };
    }
    const periodData = weeklyGroups[periodIndex];
    let relevantRecords = records.filter((r) => {
      const { sortKey } = getWeekInfo(r.date);
      if (siteId) return sortKey === periodData.sortKey && r.siteId === siteId;
      return sortKey === periodData.sortKey;
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

  const getChartDataForPeriod = (periodIndex: number, siteId?: string | null): ChartDataPoint[] => {
    if (periodIndex < 0 || periodIndex >= weeklyGroups.length) return [];
    const periodData = weeklyGroups[periodIndex];
    let siteRecords = records.filter((r) => {
      const { sortKey } = getWeekInfo(r.date);
      if (siteId) return sortKey === periodData.sortKey && r.siteId === siteId;
      return sortKey === periodData.sortKey;
    });

    return siteRecords
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((record) => ({
        date: record.date,
        value: record.energyGeneratedKwh,
        label: record.date.split('-')[2],
      }));
  };

  return { weeklyGroups, isLoading, error, getStatsForPeriod, getChartDataForPeriod };
}
