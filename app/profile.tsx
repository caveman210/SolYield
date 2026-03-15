// app/profile.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import StyledText from './components/StyledText';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';

export default function ProfileScreen() {
  const colors = useMaterialYouColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const user = useSelector((state: RootState) => state.auth.currentUser);

  if (!user) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-5 pb-4" 
        style={{ paddingTop: insets.top + 20, backgroundColor: colors.surface }}
      >
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.surfaceContainerHigh }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <StyledText className="text-xl font-semibold" style={{ color: colors.onSurface }}>Technician Profile</StyledText>
        <TouchableOpacity onPress={() => router.push('/settings')} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.secondaryContainer }}>
          <MaterialCommunityIcons name="cog" size={24} color={colors.onSecondaryContainer} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Avatar & Basic Info */}
        <View className="items-center mt-6 mb-8">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.primaryContainer }}>
            <StyledText className="text-4xl font-bold" style={{ color: colors.onPrimaryContainer }}>
              {user.name.charAt(0)}
            </StyledText>
          </View>
          <StyledText className="text-2xl font-bold" style={{ color: colors.onSurface }}>{user.name}</StyledText>
          <StyledText className="text-base mt-1" style={{ color: colors.primary }}>{user.role}</StyledText>
          
          <View className="flex-row items-center mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.surfaceContainerHigh }}>
            <MaterialCommunityIcons name="badge-account-horizontal-outline" size={16} color={colors.onSurfaceVariant} />
            <StyledText className="text-xs ml-2" style={{ color: colors.onSurfaceVariant }}>ID: {user.employeeId}</StyledText>
          </View>
        </View>

        {/* Field Performance Stats */}
        <StyledText className="text-lg font-semibold mb-3" style={{ color: colors.onSurface }}>This Week's Performance</StyledText>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: colors.secondaryContainer }}>
            <MaterialCommunityIcons name="clipboard-check" size={28} color={colors.onSecondaryContainer} />
            <StyledText className="text-2xl font-bold mt-2" style={{ color: colors.onSecondaryContainer }}>14</StyledText>
            <StyledText className="text-xs opacity-80" style={{ color: colors.onSecondaryContainer }}>Inspections</StyledText>
          </View>
          <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: colors.tertiaryContainer }}>
            <MaterialCommunityIcons name="map-marker-path" size={28} color={colors.onTertiaryContainer} />
            <StyledText className="text-2xl font-bold mt-2" style={{ color: colors.onTertiaryContainer }}>320</StyledText>
            <StyledText className="text-xs opacity-80" style={{ color: colors.onTertiaryContainer }}>Km Travelled</StyledText>
          </View>
        </View>

        {/* Assignment Details */}
        <StyledText className="text-lg font-semibold mb-3" style={{ color: colors.onSurface }}>Assignment Details</StyledText>
        <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: colors.surfaceContainer }}>
          <View className="flex-row items-center mb-4">
            <MaterialCommunityIcons name="map-legend" size={20} color={colors.onSurfaceVariant} />
            <View className="ml-3">
              <StyledText className="text-xs uppercase" style={{ color: colors.onSurfaceVariant }}>Assigned Region</StyledText>
              <StyledText className="text-base font-medium" style={{ color: colors.onSurface }}>{user.region}</StyledText>
            </View>
          </View>
          <View className="h-[1px] w-full mb-4" style={{ backgroundColor: colors.outlineVariant }} />
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="car-wrench" size={20} color={colors.onSurfaceVariant} />
            <View className="ml-3">
              <StyledText className="text-xs uppercase" style={{ color: colors.onSurfaceVariant }}>Current Vehicle</StyledText>
              <StyledText className="text-base font-medium" style={{ color: colors.onSurface }}>Fleet Truck #4 (KL-04)</StyledText>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
