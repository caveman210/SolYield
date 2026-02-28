/**
 * Add Visit/Schedule Screen (COMPLETE REWRITE)
 *
 * Features:
 * - M3Expressive custom date/time pickers
 * - Other Reasons visit support (visits not linked to a specific site)
 * - Form state preservation with AsyncStorage
 * - Schedule conflict validation with 5-minute buffer
 * - "Add New Site" button in site picker
 * - Material You theming throughout
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScheduleManagement } from '../lib/hooks/useScheduleManagement';
import { useSiteManagement } from '../lib/hooks/useSiteManagement';
import { validateSchedule } from '../lib/utils/scheduleValidation';
import { Site } from '../lib/types';
import { useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Spacing } from '../lib/design/tokens';
import M3DatePicker from './components/M3DatePicker';
import M3TimePicker from './components/M3TimePicker';
import M3ErrorDialog from './components/M3ErrorDialog';

const FORM_DRAFT_KEY = '@add_visit_draft';

interface FormDraft {
  visitTitle: string;
  selectedSiteId: string;
  visitDate: string;
  visitTime: string;
  isOtherReason: boolean;
  otherReasonDescription: string;
  linkedSiteId: string;
}

export default function AddVisitScreen() {
  const { scheduleVisit } = useScheduleManagement();
  const { allSites } = useSiteManagement();
  const colors = useMaterialYouColors();
  const { returnFrom } = useLocalSearchParams<{ returnFrom?: string }>();

  // Form state
  const [visitTitle, setVisitTitle] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date());
  const [visitTime, setVisitTime] = useState(new Date());
  const [isOtherReason, setIsOtherReason] = useState(false);
  const [otherReasonDescription, setOtherReasonDescription] = useState('');
  const [linkedSiteId, setLinkedSiteId] = useState('');

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [showLinkedSitePicker, setShowLinkedSitePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Error dialog state
  const [errorDialog, setErrorDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save form draft (debounced)
  const saveDraft = useCallback(async () => {
    try {
      const draft: FormDraft = {
        visitTitle,
        selectedSiteId,
        visitDate: visitDate.toISOString(),
        visitTime: visitTime.toISOString(),
        isOtherReason,
        otherReasonDescription,
        linkedSiteId,
      };
      await AsyncStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
      console.log('📝 Draft saved');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [visitTitle, selectedSiteId, visitDate, visitTime, isOtherReason, otherReasonDescription, linkedSiteId]);

  // Debounced save (500ms)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveDraft]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Handle return from add-site screen
  useEffect(() => {
    if (returnFrom === 'add-site') {
      loadDraft();
      // Auto-select the most recently created site
      if (allSites.length > 0) {
        const latestSite = allSites.sort((a, b) => {
          const aCreated = new Date(a.createdAt || 0).getTime();
          const bCreated = new Date(b.createdAt || 0).getTime();
          return bCreated - aCreated;
        })[0];
        setSelectedSiteId(latestSite.id);
      }
      // Clear draft after successful return
      clearDraft();
    }
  }, [returnFrom, allSites]);

  const loadDraft = async () => {
    try {
      const draftStr = await AsyncStorage.getItem(FORM_DRAFT_KEY);
      if (draftStr) {
        const draft: FormDraft = JSON.parse(draftStr);
        setVisitTitle(draft.visitTitle);
        setSelectedSiteId(draft.selectedSiteId);
        setVisitDate(new Date(draft.visitDate));
        setVisitTime(new Date(draft.visitTime));
        setIsOtherReason(draft.isOtherReason);
        setOtherReasonDescription(draft.otherReasonDescription);
        setLinkedSiteId(draft.linkedSiteId);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(FORM_DRAFT_KEY);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  // Validate schedule conflicts
  const checkConflicts = useCallback(async () => {
    try {
      const dateStr = formatDate(visitDate);
      const timeStr = formatTime(visitTime);
      
      const conflict = await validateSchedule('user_1', dateStr, timeStr);
      
      if (conflict.hasConflict) {
        setConflictWarning(conflict.reason || 'Schedule conflict detected');
      } else {
        setConflictWarning(null);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  }, [visitDate, visitTime]);

  useEffect(() => {
    checkConflicts();
  }, [checkConflicts]);

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

  const getLinkedSiteName = useCallback((): string => {
    if (!linkedSiteId) return 'Select site (optional)...';
    const site = allSites.find((s) => s.id === linkedSiteId);
    return site?.name || 'Unknown Site';
  }, [linkedSiteId, allSites]);

  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(siteId);
    setShowSitePicker(false);
  }, []);

  const handleLinkedSiteSelect = useCallback((siteId: string) => {
    setLinkedSiteId(siteId);
    setShowLinkedSitePicker(false);
  }, []);

  const handleAddNewSite = async () => {
    // Save current form state
    await saveDraft();
    // Navigate to add-site with return parameter
    router.push('/add-site?returnTo=add-visit' as any);
  };

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!visitTitle.trim()) {
      setErrorDialog({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter a visit title.',
        type: 'error',
      });
      return;
    }

    if (!isOtherReason && !selectedSiteId) {
      setErrorDialog({
        visible: true,
        title: 'Validation Error',
        message: 'Please select a site for this visit.',
        type: 'error',
      });
      return;
    }

    if (isOtherReason && !otherReasonDescription.trim()) {
      setErrorDialog({
        visible: true,
        title: 'Validation Error',
        message: 'Please provide a description for this visit.',
        type: 'error',
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(visitDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrorDialog({
        visible: true,
        title: 'Validation Error',
        message: 'Cannot schedule visits in the past.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedSite = allSites.find((s) => s.id === selectedSiteId);
      const siteName = selectedSite?.name || 'Unknown Site';

      scheduleVisit(
        {
          siteId: isOtherReason ? '' : selectedSiteId,
          title: visitTitle.trim(),
          date: formatDate(visitDate),
          time: formatTime(visitTime),
          isRequiem: isOtherReason,
          requiemReason: isOtherReason ? otherReasonDescription.trim() : undefined,
          linkedSiteId: isOtherReason && linkedSiteId ? linkedSiteId : undefined,
        },
        siteName
      );

      // Clear draft on success
      await clearDraft();

      setErrorDialog({
        visible: true,
        title: 'Success',
        message: `Visit "${visitTitle}" has been scheduled successfully!`,
        type: 'success',
      });

      // Navigate back after showing success
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error scheduling visit:', error);
      setErrorDialog({
        visible: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to schedule visit. Please try again.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  }, [
    visitTitle,
    selectedSiteId,
    visitDate,
    visitTime,
    isOtherReason,
    otherReasonDescription,
    linkedSiteId,
    allSites,
    scheduleVisit,
    clearDraft,
  ]);

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

  const renderLinkedSiteItem = ({ item }: { item: Site }) => (
    <TouchableOpacity
      style={[styles.siteItem, { borderBottomColor: colors.surfaceContainerLow }]}
      onPress={() => handleLinkedSiteSelect(item.id)}
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
      {linkedSiteId === item.id && (
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

            {/* Visit Title */}
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

            {/* Other Reasons Toggle */}
            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
              onPress={() => {
                setIsOtherReason(!isOtherReason);
                if (!isOtherReason) {
                  setSelectedSiteId('');
                } else {
                  setOtherReasonDescription('');
                  setLinkedSiteId('');
                }
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isOtherReason ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={isOtherReason ? colors.primary : colors.outline}
              />
              <Text style={[styles.checkboxLabel, { color: colors.onSurface }]}>
                Other Reasons (Not site-specific)
              </Text>
            </TouchableOpacity>

            {/* Conditional: Regular Site Visit */}
            {!isOtherReason && (
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
            )}

            {/* Conditional: Other Reasons Visit Fields */}
            {isOtherReason && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Description *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        borderColor: colors.outline,
                        color: colors.onSurface,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    placeholder="e.g., Equipment malfunction, emergency repair..."
                    value={otherReasonDescription}
                    onChangeText={setOtherReasonDescription}
                    placeholderTextColor={colors.onSurfaceVariant}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                    Linked Site (optional)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dateTimeButton,
                      {
                        borderColor: colors.outline,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    onPress={() => setShowLinkedSitePicker(true)}
                  >
                    <MaterialCommunityIcons name="link" size={20} color={colors.primary} />
                    <Text
                      style={[
                        styles.dateTimeText,
                        { color: linkedSiteId ? colors.onSurface : colors.onSurfaceVariant },
                      ]}
                    >
                      {getLinkedSiteName()}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Date Picker */}
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

            {/* Time Picker */}
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

          {/* Conflict Warning */}
          {conflictWarning && (
            <View style={[styles.warningBox, { backgroundColor: colors.errorContainer }]}>
              <MaterialCommunityIcons name="alert" size={20} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.onErrorContainer }]}>
                {conflictWarning}
              </Text>
            </View>
          )}

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.primaryContainer }]}>
            <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.onPrimaryContainer }]}>
              {isOtherReason
                ? 'Other Reasons visits are not linked to a specific site. You can optionally link a site for context.'
                : 'This visit will be added to your schedule. You can sync it to your device calendar from the Schedule screen.'}
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
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Site</Text>
                <TouchableOpacity onPress={() => setShowSitePicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.outline} />
                </TouchableOpacity>
              </View>
              
              {/* Add New Site Button */}
              <TouchableOpacity
                style={[styles.addNewSiteButton, { backgroundColor: colors.primaryContainer }]}
                onPress={handleAddNewSite}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primary} />
                <Text style={[styles.addNewSiteText, { color: colors.onPrimaryContainer }]}>
                  Add New Site
                </Text>
              </TouchableOpacity>

              <FlatList
                data={allSites}
                renderItem={renderSiteItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.siteList}
              />
            </View>
          </View>
        </Modal>

        {/* Linked Site Picker Modal */}
        <Modal
          visible={showLinkedSitePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLinkedSitePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Select Linked Site
                </Text>
                <TouchableOpacity onPress={() => setShowLinkedSitePicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.outline} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={allSites}
                renderItem={renderLinkedSiteItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.siteList}
              />
            </View>
          </View>
        </Modal>

        {/* M3 Date Picker */}
        <M3DatePicker
          visible={showDatePicker}
          selectedDate={visitDate}
          onSelect={(date) => setVisitDate(date)}
          onDismiss={() => setShowDatePicker(false)}
          minimumDate={new Date()}
        />

        {/* M3 Time Picker */}
        <M3TimePicker
          visible={showTimePicker}
          selectedTime={visitTime}
          onSelect={(time) => setVisitTime(time)}
          onDismiss={() => setShowTimePicker(false)}
        />

        {/* M3 Error Dialog */}
        <M3ErrorDialog
          visible={errorDialog.visible}
          type={errorDialog.type}
          title={errorDialog.title}
          message={errorDialog.message}
          onDismiss={() => setErrorDialog({ ...errorDialog, visible: false })}
        />

        {/* Footer */}
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
    padding: M3Spacing.xl,
    marginHorizontal: M3Spacing.lg,
    marginTop: M3Spacing.lg,
    borderRadius: M3Shape.extraLarge,
    marginBottom: M3Spacing.md,
  },
  sectionTitle: {
    ...M3Typography.title.large,
    fontWeight: '600',
    marginBottom: M3Spacing.xl,
  },
  inputGroup: {
    marginBottom: M3Spacing.xl,
  },
  label: {
    ...M3Typography.label.large,
    fontWeight: '600',
    marginBottom: M3Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: M3Shape.medium,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    ...M3Typography.body.large,
  },
  textArea: {
    height: 100,
    paddingTop: M3Spacing.md,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
    marginBottom: M3Spacing.xl,
  },
  checkboxLabel: {
    ...M3Typography.body.large,
    marginLeft: M3Spacing.md,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: M3Shape.medium,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    gap: M3Spacing.md,
  },
  dateTimeText: {
    flex: 1,
    ...M3Typography.body.large,
  },
  warningBox: {
    flexDirection: 'row',
    marginHorizontal: M3Spacing.lg,
    marginBottom: M3Spacing.md,
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
    gap: M3Spacing.md,
  },
  warningText: {
    flex: 1,
    ...M3Typography.body.medium,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: M3Spacing.lg,
    marginBottom: M3Spacing.lg,
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
    gap: M3Spacing.md,
  },
  infoText: {
    flex: 1,
    ...M3Typography.body.medium,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: M3Shape.extraExtraLarge,
    borderTopRightRadius: M3Shape.extraExtraLarge,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: M3Spacing.xl,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...M3Typography.title.large,
    fontWeight: '600',
  },
  addNewSiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: M3Spacing.lg,
    padding: M3Spacing.lg,
    borderRadius: M3Shape.medium,
    gap: M3Spacing.sm,
  },
  addNewSiteText: {
    ...M3Typography.label.large,
    fontWeight: '600',
  },
  siteList: {
    paddingVertical: M3Spacing.sm,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: M3Spacing.lg,
    paddingHorizontal: M3Spacing.xl,
    borderBottomWidth: 1,
  },
  siteItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: M3Spacing.md,
  },
  siteItemText: {
    flex: 1,
  },
  siteItemName: {
    ...M3Typography.body.large,
    fontWeight: '600',
    marginBottom: 2,
  },
  siteItemCapacity: {
    ...M3Typography.body.medium,
  },
  footer: {
    padding: M3Spacing.lg,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: M3Spacing.lg,
    borderRadius: M3Shape.extraLarge,
    gap: M3Spacing.sm,
  },
  submitButtonText: {
    ...M3Typography.label.large,
    fontWeight: '700',
  },
});
