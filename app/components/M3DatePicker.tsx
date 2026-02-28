/**
 * M3DatePicker Component
 * 
 * Material 3 Expressive styled date picker with:
 * - Material You dynamic colors
 * - Calendar grid view
 * - Month/year navigation
 * - M3 shape tokens and elevation
 * - Smooth animations
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../../lib/design/tokens';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = Math.min(width - M3Spacing.xl * 2, 400);
const DAY_SIZE = (CALENDAR_WIDTH - M3Spacing.lg * 2) / 7;

interface M3DatePickerProps {
  visible: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onDismiss: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function M3DatePicker({
  visible,
  selectedDate,
  onSelect,
  onDismiss,
  minimumDate,
  maximumDate,
}: M3DatePickerProps) {
  const colors = useMaterialYouColors();
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  }, [currentMonth, currentYear]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;
    if (minimumDate && date < minimumDate) return true;
    if (maximumDate && date > maximumDate) return true;
    return false;
  };

  const isDateSelected = (date: Date | null): boolean => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date || isDateDisabled(date)) return;
    onSelect(date);
    onDismiss();
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    onSelect(today);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          entering={SlideInDown.duration(M3Motion.duration.emphasized)}
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceContainerHigh,
              ...M3Elevation.level3,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
            <View>
              <Text style={[styles.headerLabel, { color: colors.onSurfaceVariant }]}>
                Select Date
              </Text>
              <Text style={[styles.headerDate, { color: colors.onSurface }]}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.closeButton, { backgroundColor: colors.surfaceContainerHighest }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Month/Year Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={[styles.navButton, { backgroundColor: colors.surfaceContainerHighest }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.monthYearContainer}>
              <Text style={[styles.monthYear, { color: colors.onSurface }]}>
                {MONTHS[currentMonth]} {currentYear}
              </Text>
            </View>

            <TouchableOpacity
              onPress={goToNextMonth}
              style={[styles.navButton, { backgroundColor: colors.surfaceContainerHighest }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-right" size={28} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: colors.onSurfaceVariant }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    selected && {
                      backgroundColor: colors.primary,
                    },
                    today && !selected && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleDateSelect(date)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  {date && (
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: selected
                            ? colors.onPrimary
                            : disabled
                            ? colors.outline
                            : today
                            ? colors.primary
                            : colors.onSurface,
                        },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleToday}
              style={[styles.todayButton, { backgroundColor: colors.secondaryContainer }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={20}
                color={colors.onSecondaryContainer}
              />
              <Text style={[styles.todayButtonText, { color: colors.onSecondaryContainer }]}>
                Today
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: M3Spacing.xl,
  },
  container: {
    width: CALENDAR_WIDTH,
    borderRadius: M3Shape.extraExtraLarge,
    padding: M3Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: M3Spacing.lg,
    marginBottom: M3Spacing.lg,
    borderBottomWidth: 1,
  },
  headerLabel: {
    ...M3Typography.label.large,
    marginBottom: M3Spacing.xs,
  },
  headerDate: {
    ...M3Typography.title.large,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: M3Spacing.lg,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    ...M3Typography.title.large,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: M3Spacing.sm,
  },
  weekdayCell: {
    width: DAY_SIZE,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    ...M3Typography.label.medium,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: M3Spacing.lg,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: M3Shape.full,
  },
  dayText: {
    ...M3Typography.body.medium,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: M3Spacing.md,
    paddingHorizontal: M3Spacing.lg,
    borderRadius: M3Shape.full,
    gap: M3Spacing.xs,
  },
  todayButtonText: {
    ...M3Typography.label.large,
    fontWeight: '600',
  },
});
