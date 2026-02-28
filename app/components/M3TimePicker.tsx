/**
 * M3TimePicker Component
 * 
 * Material 3 Expressive styled time picker with:
 * - Material You dynamic colors
 * - Hour and minute wheels
 * - AM/PM toggle
 * - M3 shape tokens and elevation
 * - Smooth animations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../../lib/design/tokens';

const { width, height } = Dimensions.get('window');
const PICKER_WIDTH = Math.min(width - M3Spacing.xl * 2, 360);
const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface M3TimePickerProps {
  visible: boolean;
  selectedTime: Date;
  onSelect: (time: Date) => void;
  onDismiss: () => void;
  use24Hour?: boolean;
}

const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
const hours24 = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export default function M3TimePicker({
  visible,
  selectedTime,
  onSelect,
  onDismiss,
  use24Hour = false,
}: M3TimePickerProps) {
  const colors = useMaterialYouColors();
  
  const initialHour = selectedTime.getHours();
  const initialMinute = selectedTime.getMinutes();
  const initialPeriod = initialHour >= 12 ? 'PM' : 'AM';
  const initial12Hour = initialHour % 12 || 12;

  const [selectedHour, setSelectedHour] = useState(use24Hour ? initialHour : initial12Hour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);

  const handleConfirm = () => {
    const newTime = new Date(selectedTime);
    
    if (use24Hour) {
      newTime.setHours(selectedHour, selectedMinute, 0, 0);
    } else {
      let hour24 = selectedHour;
      if (period === 'PM' && selectedHour !== 12) {
        hour24 = selectedHour + 12;
      } else if (period === 'AM' && selectedHour === 12) {
        hour24 = 0;
      }
      newTime.setHours(hour24, selectedMinute, 0, 0);
    }
    
    onSelect(newTime);
    onDismiss();
  };

  const formatTime = (): string => {
    const hourStr = selectedHour.toString().padStart(2, '0');
    const minuteStr = selectedMinute.toString().padStart(2, '0');
    
    if (use24Hour) {
      return `${hourStr}:${minuteStr}`;
    } else {
      return `${hourStr}:${minuteStr} ${period}`;
    }
  };

  const renderPickerColumn = (
    items: number[],
    selected: number,
    onSelect: (value: number) => void,
    label: string
  ) => {
    // Add padding items for smooth scrolling
    const paddedItems = [null, null, ...items, null, null];
    const selectedIndex = items.indexOf(selected) + 2;

    return (
      <View style={styles.pickerColumn}>
        <Text style={[styles.columnLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
        <View style={styles.pickerContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
              const actualIndex = index - 2;
              if (actualIndex >= 0 && actualIndex < items.length) {
                onSelect(items[actualIndex]);
              }
            }}
          >
            {paddedItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerItem,
                  item === selected && {
                    backgroundColor: colors.primaryContainer,
                  },
                ]}
                onPress={() => item !== null && onSelect(item)}
                activeOpacity={0.7}
              >
                {item !== null && (
                  <Text
                    style={[
                      styles.pickerItemText,
                      {
                        color: item === selected ? colors.onPrimaryContainer : colors.onSurface,
                        fontWeight: item === selected ? '700' : '400',
                      },
                    ]}
                  >
                    {item.toString().padStart(2, '0')}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Selection Indicator */}
          <View
            style={[
              styles.selectionIndicator,
              {
                borderTopColor: colors.primary,
                borderBottomColor: colors.primary,
              },
            ]}
            pointerEvents="none"
          />
        </View>
      </View>
    );
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
                Select Time
              </Text>
              <Text style={[styles.headerTime, { color: colors.onSurface }]}>
                {formatTime()}
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

          {/* Time Pickers */}
          <View style={styles.pickersRow}>
            {renderPickerColumn(
              use24Hour ? hours24 : hours12,
              selectedHour,
              setSelectedHour,
              'Hour'
            )}
            
            <View style={styles.separator}>
              <Text style={[styles.separatorText, { color: colors.onSurface }]}>:</Text>
            </View>
            
            {renderPickerColumn(
              minutes,
              selectedMinute,
              setSelectedMinute,
              'Minute'
            )}
          </View>

          {/* AM/PM Toggle (only for 12-hour format) */}
          {!use24Hour && (
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'AM' && { backgroundColor: colors.primary },
                  { borderColor: colors.outline },
                ]}
                onPress={() => setPeriod('AM')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: period === 'AM' ? colors.onPrimary : colors.onSurface,
                      fontWeight: period === 'AM' ? '700' : '500',
                    },
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'PM' && { backgroundColor: colors.primary },
                  { borderColor: colors.outline },
                ]}
                onPress={() => setPeriod('PM')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: period === 'PM' ? colors.onPrimary : colors.onSurface,
                      fontWeight: period === 'PM' ? '700' : '500',
                    },
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.footerButton, { backgroundColor: colors.surfaceContainerHighest }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerButtonText, { color: colors.onSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.footerButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerButtonText, { color: colors.onPrimary }]}>
                Confirm
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
    width: PICKER_WIDTH,
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
  headerTime: {
    ...M3Typography.display.small,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: M3Spacing.lg,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  columnLabel: {
    ...M3Typography.label.small,
    marginBottom: M3Spacing.sm,
    textTransform: 'uppercase',
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    width: 80,
    position: 'relative',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: M3Shape.medium,
  },
  pickerItemText: {
    ...M3Typography.headline.small,
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    pointerEvents: 'none',
  },
  separator: {
    marginHorizontal: M3Spacing.md,
  },
  separatorText: {
    ...M3Typography.display.small,
    fontWeight: '700',
  },
  periodToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: M3Spacing.md,
    marginBottom: M3Spacing.lg,
  },
  periodButton: {
    paddingVertical: M3Spacing.md,
    paddingHorizontal: M3Spacing.xl,
    borderRadius: M3Shape.full,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  periodText: {
    ...M3Typography.label.large,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: M3Spacing.md,
  },
  footerButton: {
    paddingVertical: M3Spacing.md,
    paddingHorizontal: M3Spacing.xl,
    borderRadius: M3Shape.full,
    minWidth: 100,
    alignItems: 'center',
  },
  footerButtonText: {
    ...M3Typography.label.large,
    fontWeight: '600',
  },
});
