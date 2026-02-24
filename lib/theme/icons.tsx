import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const icons: Record<string, string> = {
  Accessibility: 'accessibility',
  Add: 'plus',
  Apps: 'apps',
  ArrowBack: 'arrow-left',
  ArrowDownward: 'arrow-down',
  ArrowForward: 'arrow-right',
  AttachMoney: 'currency-usd',
  CalendarMonth: 'calendar-month',
  Check: 'check',
  CheckCircle: 'check-circle',
  ChevronRight: 'chevron-right',
  Close: 'close',
  ContentCopy: 'content-copy',
  Dashboard: 'view-dashboard',
  Delete: 'delete',
  Edit: 'pencil',
  Error: 'alert-circle',
  ExpandMore: 'chevron-down',
  GridView: 'view-grid',
  Home: 'home',
  Insights: 'insights',
  InvertColors: 'invert-colors',
  LightMode: 'white-balance-sunny',
  LocationOn: 'location-on',
  Lock: 'lock',
  Logout: 'logout',
  Mail: 'mail',
  Menu: 'menu',
  MoreVert: 'dots-vertical',
  MyLocation: 'my-location',
  Notifications: 'bell',
  People: 'account-group',
  Person: 'account',
  PieChart: 'chart-pie',
  Print: 'printer',
  Report: 'file-document',
  Save: 'content-save',
  Search: 'magnify',
  Send: 'send',
  Settings: 'cog',
  Share: 'share-variant',
  ShowChart: 'chart-line',
  Sync: 'sync',
  Toc: 'table-of-contents',
  Today: 'calendar-today',
  ViewDay: 'view-day',
  Warning: 'alert',
};

export type IconName = keyof typeof icons;

interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
}

const sizeMap = {
  small: 16,
  medium: 24,
  large: 32,
};

const Icon: React.FC<IconProps> = ({ name, size = 'medium', color = '#000' }) => {
  const iconName = icons[name] || name;
  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <MaterialCommunityIcons 
      name={iconName as any} 
      size={iconSize} 
      color={color} 
    />
  );
};

export default Icon;
