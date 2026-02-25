/**
 * Add Visit/Schedule Screen
 *
 * Form for scheduling new site visits with date/time pickers.
 * Uses Material You theming and modal presentation.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScheduleManagement } from '../lib/hooks/useScheduleManagement';
import { useSiteManagement } from '../lib/hooks/useSiteManagement';
import { Site } from '../lib/types';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';

export default function AddVisitScreen() {
  const { scheduleVisit } = useScheduleManagement();
  const { allSites } = useSiteManagement();
  const colors = useMaterialYouColors();

  // Form state
  const [visitTitle, setVisitTitle] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date());
  const [visitTime, setVisitTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setVisitDate(selectedDate);
    }
  }, []);

  const handleTimeChange = useCallback((event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
      setVisitTime(selectedTime);
    }
  }, []);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const displayDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getSelectedSiteName = useCallback((): string => {
    if (!selectedSiteId) return 'Select a site...';
    const site = allSites.find((s) => s.id === selectedSiteId);
    return site?.name || 'Unknown Site';
  }, [selectedSiteId, allSites]);

  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(siteId);
    setShowSitePicker(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!visitTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a visit title.');
      return;
    }

    if (!selectedSiteId) {
      Alert.alert('Validation Error', 'Please select a site.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(visitDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert('Validation Error', 'Cannot schedule visits in the past.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedSite = allSites.find((s) => s.id === selectedSiteId);
      const siteName = selectedSite?.name || 'Unknown Site';

      scheduleVisit(
        {
          siteId: selectedSiteId,
          title: visitTitle.trim(),
          date: formatDate(visitDate),
          time: formatTime(visitTime),
        },
        siteName
      );

      Alert.alert('Success', `Visit "${visitTitle}" has been scheduled successfully!`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error scheduling visit:', error);
      Alert.alert('Error', 'Failed to schedule visit. Please try again.');
      setIsSubmitting(false);
    }
  }, [visitTitle, selectedSiteId, visitDate, visitTime, allSites, scheduleVisit]);

  const renderSiteItem = ({ item }: { item: Site }) => (
    <TouchableOpacity
      style={[styles.siteItem, { borderBottomColor: colors.surfaceContainerLow }]}
      onPress={() => handleSiteSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.siteItemContent}>
        <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
        <View style={styles.siteItemText}>
          <Text style={[styles.siteItemName, { color: colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.siteItemCapacity, { color: colors.onSurfaceVariant }]}>
            {item.capacity}
          </Text>
        </View>
      </View>
      {selectedSiteId === item.id && (
        <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Schedule Visit',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.formSection, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Visit Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Visit Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.outline,
                    color: colors.onSurface,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="e.g., Quarterly Inspection"
                value={visitTitle}
                onChangeText={setVisitTitle}
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Site *</Text>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  {
                    borderColor: colors.outline,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => setShowSitePicker(true)}
              >
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.dateTimeText,
                    { color: selectedSiteId ? colors.onSurface : colors.onSurfaceVariant },
                  ]}
                >
                  {getSelectedSiteName()}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Date *</Text>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  {
                    borderColor: colors.outline,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.onSurface }]}>
                  {displayDate(visitDate)}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Time *</Text>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  {
                    borderColor: colors.outline,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.onSurface }]}>
                  {formatTime(visitTime)}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.primaryContainer }]}>
            <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.onPrimaryContainer }]}>
              This visit will be added to your schedule. You can sync it to your device calendar
              from the Schedule screen.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={showSitePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSitePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Site</Text>
                <TouchableOpacity onPress={() => setShowSitePicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.outline} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={allSites}
                renderItem={renderSiteItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.siteList}
              />
            </View>
          </View>
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={visitDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={visitTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isSubmitting ? colors.surfaceContainerHigh : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons name="calendar-plus" size={24} color={colors.onPrimary} />
            <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  siteList: {
    paddingVertical: 8,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  siteItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  siteItemText: {
    flex: 1,
  },
  siteItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  siteItemCapacity: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
