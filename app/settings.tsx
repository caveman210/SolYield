// app/settings.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import StyledText from './components/StyledText';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';

export default function SettingsScreen() {
  const colors = useMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();

  // Mock states for UI
  const [wifiOnly, setWifiOnly] = React.useState(true);
  const [batterySaver, setBatterySaver] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    // In a real app, this would route to a Login screen. 
    // For now, we route to dashboard which will re-evaluate auth state
    router.replace('/'); 
  };

  const renderSettingItem = (icon: string, title: string, subtitle: string, control?: React.ReactNode) => (
    <View className="flex-row items-center py-4 border-b" style={{ borderBottomColor: colors.outlineVariant }}>
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${colors.primary}15` }}>
        <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View className="flex-1 ml-4 pr-4">
        <StyledText className="text-base font-medium" style={{ color: colors.onSurface }}>{title}</StyledText>
        <StyledText className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>{subtitle}</StyledText>
      </View>
      {control || <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center px-5 pb-4" style={{ paddingTop: insets.top + 20, backgroundColor: colors.surface }}>
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colors.surfaceContainerHigh }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <StyledText className="text-2xl font-semibold" style={{ color: colors.onSurface }}>Settings</StyledText>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        
        <StyledText className="text-sm font-bold uppercase mt-6 mb-2 ml-1" style={{ color: colors.primary }}>Data & Syncing</StyledText>
        <View className="rounded-2xl px-4" style={{ backgroundColor: colors.surfaceContainer }}>
          {renderSettingItem('wifi-sync', 'Sync over Wi-Fi Only', 'Save cellular data while in the field', 
            <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          )}
          {renderSettingItem('database-sync', 'Force Manual Sync', 'Push all unsynced data to server now')}
          {renderSettingItem('map-download', 'Offline Maps', 'Download region maps for remote sites')}
        </View>

        <StyledText className="text-sm font-bold uppercase mt-8 mb-2 ml-1" style={{ color: colors.primary }}>Device Preferences</StyledText>
        <View className="rounded-2xl px-4" style={{ backgroundColor: colors.surfaceContainer }}>
          {renderSettingItem('battery-charging-60', 'Battery Saver Mode', 'Reduce GPS polling frequency',
            <Switch value={batterySaver} onValueChange={setBatterySaver} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          )}
          {renderSettingItem('palette-outline', 'Dynamic Theming', 'Material You colors are currently active')}
        </View>

        <StyledText className="text-sm font-bold uppercase mt-8 mb-2 ml-1" style={{ color: colors.primary }}>Account</StyledText>
        <View className="rounded-2xl px-4 mb-8" style={{ backgroundColor: colors.surfaceContainer }}>
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-5">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.errorContainer }}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
            </View>
            <View className="flex-1 ml-4">
              <StyledText className="text-base font-bold" style={{ color: colors.error }}>Switch User / Log Out</StyledText>
            </View>
          </TouchableOpacity>
        </View>
        
        <StyledText className="text-center text-xs mb-10" style={{ color: colors.onSurfaceVariant }}>SolYield Field App v2.1.0</StyledText>
      </ScrollView>
    </View>
  );
}
