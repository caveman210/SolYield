import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import TabBar from '../components/TabBar';

export default function TabLayout() {
  const colors = useMaterialYouColors();

  // Memoize the custom tab bar to prevent unnecessary re-renders
  const renderTabBar = useCallback((props: any) => <TabBar {...props} />, []);

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurface,
        tabBarStyle: {
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'My Visits',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-clock" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="sites"
        options={{
          title: 'Sites',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="map-marker-multiple" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="inspections"
        options={{
          title: 'Inspections',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-check" color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}
