import { DailyGeneration, MonthlyData } from '../types';

export const flattenChartData = (monthlyData: MonthlyData[]): DailyGeneration[] => {
  return monthlyData.flatMap((month) => month.days);
};

export const calculateAverage = (data: DailyGeneration[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, day) => acc + day.energyGeneratedkWh, 0);
  return sum / data.length;
};

export const calculatePeak = (data: DailyGeneration[]): number => {
  if (data.length === 0) return 0;
  return Math.max(...data.map((day) => day.energyGeneratedkWh));
};

export const calculateTotal = (data: DailyGeneration[]): number => {
  return data.reduce((acc, day) => acc + day.energyGeneratedkWh, 0);
};
