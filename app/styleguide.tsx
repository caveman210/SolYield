import React from 'react';
import { ScrollView } from 'react-native';
import StyledView from './components/StyledView';
import StyledText from './components/StyledText';
import { theme } from '../lib/theme/theme';
import Icon, { IconName } from '../lib/theme/icons';

const StyleGuide: React.FC = () => {
  const iconList = [
    'Accessibility', 'Add', 'Apps', 'ArrowBack', 'ArrowDownward', 'ArrowForward',
    'AttachMoney', 'CalendarMonth', 'Check', 'CheckCircle', 'ChevronRight', 'Close',
    'ContentCopy', 'Dashboard', 'Delete', 'Edit', 'Error', 'ExpandMore', 'GridView',
    'Home', 'Insights', 'InvertColors', 'LightMode', 'LocationOn', 'Lock', 'Logout',
    'Mail', 'Menu', 'MoreVert', 'MyLocation', 'Notifications', 'People', 'Person',
    'PieChart', 'Print', 'Report', 'Save', 'Search', 'Send', 'Settings', 'Share',
    'ShowChart', 'Sync', 'Toc', 'Today', 'ViewDay', 'Warning',
  ] as IconName[];

  return (
    <ScrollView className="bg-background">
      <StyledView className="p-4">
        <StyledText className="text-2xl font-bold mb-4">Style Guide</StyledText>

        {/* Colors */}
        <StyledText className="text-xl font-bold mb-2">Colors</StyledText>
        <StyledView className="flex-row flex-wrap mb-4">
          {Object.entries(theme.colors).map(([name, color]) => (
            <StyledView key={name} className="items-center mr-4 mb-4">
              <StyledView
                className="w-20 h-20 rounded-lg mb-1"
                style={{ backgroundColor: color as string }}
              />
              <StyledText className="text-sm">{name}</StyledText>
            </StyledView>
          ))}
        </StyledView>

        {/* Typography */}
        <StyledText className="text-xl font-bold mb-2">Typography</StyledText>
        <StyledView className="mb-4">
          <StyledText className="text-4xl font-light mb-2">Light</StyledText>
          <StyledText className="text-3xl mb-2">Regular</StyledText>
          <StyledText className="text-2xl font-bold mb-2">Bold</StyledText>
          <StyledText className="text-lg mb-2">Large</StyledText>
          <StyledText className="text-base mb-2">Base</StyledText>
          <StyledText className="text-sm mb-2">Small</StyledText>
        </StyledView>

        {/* Icons */}
        <StyledText className="text-xl font-bold mb-2">Icons</StyledText>
        <StyledView className="flex-row flex-wrap">
          {iconList.map((name) => (
            <StyledView key={name} className="items-center p-2">
              <Icon name={name} size="large" />
              <StyledText className="text-xs mt-1">{name}</StyledText>
            </StyledView>
          ))}
        </StyledView>
      </StyledView>
    </ScrollView>
  );
};

export default StyleGuide;
