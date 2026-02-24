/**
 * Add Visit/Schedule Screen
 * 
 * Form for scheduling new site visits with date/time pickers.
 * Uses Expo-compatible DateTimePicker for native date/time selection.
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
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useScheduleManagement } from '../lib/hooks/useScheduleManagement';
import { useSiteManagement } from '../lib/hooks/useSiteManagement';
import { Site } from '../lib/types';

export default function AddVisitScreen() {
  const { scheduleVisit } = useScheduleManagement();
  const { allSites } = useSiteManagement();

  // Form state
  const [visitTitle, setVisitTitle] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date());
  const [visitTime, setVisitTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle date change
   */
  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setVisitDate(selectedDate);
    }
  }, []);

  /**
   * Handle time change
   */
  const handleTimeChange = useCallback((event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
      setVisitTime(selectedTime);
    }
  }, []);

  /**
   * Format date to YYYY-MM-DD
   */
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Format time to 12-hour format (e.g., "09:00 AM")
   */
  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  /**
   * Display formatted date
   */
  const displayDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  /**
   * Get selected site name
   */
  const getSelectedSiteName = useCallback((): string => {
    if (!selectedSiteId) return 'Select a site...';
    const site = allSites.find((s) => s.id === selectedSiteId);
    return site?.name || 'Unknown Site';
  }, [selectedSiteId, allSites]);

  /**
   * Handle site selection
   */
  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(siteId);
    setShowSitePicker(false);
  }, []);

  /**
   * Validate form and submit
   */
  const handleSubmit = useCallback(() => {
    // Validation
    if (!visitTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a visit title.');
      return;
    }

    if (!selectedSiteId) {
      Alert.alert('Validation Error', 'Please select a site.');
      return;
    }

    // Check if date is in the past
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
      // Get site name
      const selectedSite = allSites.find((s) => s.id === selectedSiteId);
      const siteName = selectedSite?.name || 'Unknown Site';

      // Schedule visit
      scheduleVisit(
        {
          siteId: selectedSiteId,
          title: visitTitle.trim(),
          date: formatDate(visitDate),
          time: formatTime(visitTime),
        },
        siteName
      );

      Alert.alert(
        'Success',
        `Visit "${visitTitle}" has been scheduled successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error scheduling visit:', error);
      Alert.alert('Error', 'Failed to schedule visit. Please try again.');
      setIsSubmitting(false);
    }
  }, [visitTitle, selectedSiteId, visitDate, visitTime, allSites, scheduleVisit]);

  /**
   * Render site item in picker
   */
  const renderSiteItem = ({ item }: { item: Site }) => (
    <TouchableOpacity
      style={styles.siteItem}
      onPress={() => handleSiteSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.siteItemContent}>
        <MaterialCommunityIcons name="map-marker" size={24} color="#3B82F6" />
        <View style={styles.siteItemText}>
          <Text style={styles.siteItemName}>{item.name}</Text>
          <Text style={styles.siteItemCapacity}>{item.capacity}</Text>
        </View>
      </View>
      {selectedSiteId === item.id && (
        <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Visit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Visit Details</Text>

          {/* Visit Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visit Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Quarterly Inspection"
              value={visitTitle}
              onChangeText={setVisitTitle}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Site Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Site *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowSitePicker(true)}
            >
              <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
              <Text style={[styles.dateTimeText, !selectedSiteId && styles.placeholderText]}>
                {getSelectedSiteName()}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>{displayDate(visitDate)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Time Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>{formatTime(visitTime)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            This visit will be added to your schedule. You can sync it to your device calendar from
            the Schedule screen.
          </Text>
        </View>
      </ScrollView>

      {/* Site Picker Modal */}
      <Modal
        visible={showSitePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSitePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Site</Text>
              <TouchableOpacity onPress={() => setShowSitePicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
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

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={visitDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={visitTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="calendar-plus" size={24} color="#FFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFF',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    gap: 8,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    borderBottomColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  siteItemCapacity: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
