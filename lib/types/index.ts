export interface Site {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  capacity: string;
}

export interface ScheduleVisit {
  id: string;
  siteId: string;
  date: string;
  time: string;
  title: string;
}

export interface DailyGeneration {
  date: string;
  energyGeneratedkWh: number;
}

export interface MonthlyData {
  _id: number;
  days: DailyGeneration[];
}

export interface PerformanceData {
  underPerformingDays: number;
  overPerformingDays: number;
  daysNoData: number;
  normalDays: number;
  zeroEnergyDays: number;
}

export type FieldType = 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'file';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  display?: 'List' | 'Row';
  uploadType?: 'Capture' | 'Upload';
  uploadFileType?: 'Image' | 'PDF';
  numberOfFiles?: number;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormSchema {
  id: string;
  title: string;
  sections: FormSection[];
}
