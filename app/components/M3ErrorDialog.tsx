/**
 * M3ErrorDialog Component
 * 
 * Material 3 Expressive styled error/validation dialog with:
 * - Material You dynamic colors
 * - Support for error, warning, info, and success types
 * - Icon-based visual hierarchy
 * - M3 shape tokens and elevation
 * - Smooth animations
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing, M3Motion } from '../../lib/design/tokens';

export type M3ErrorDialogType = 'error' | 'warning' | 'info' | 'success';

interface M3ErrorDialogProps {
  visible: boolean;
  type?: M3ErrorDialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  showCancel?: boolean;
}

export default function M3ErrorDialog({
  visible,
  type = 'error',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onDismiss,
  showCancel = false,
}: M3ErrorDialogProps) {
  const colors = useMaterialYouColors();

  const getIconAndColors = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle',
          iconColor: colors.error,
          backgroundColor: colors.errorContainer,
          textColor: colors.onErrorContainer,
        };
      case 'warning':
        return {
          icon: 'alert',
          iconColor: colors.tertiary,
          backgroundColor: colors.tertiaryContainer,
          textColor: colors.onTertiaryContainer,
        };
      case 'info':
        return {
          icon: 'information',
          iconColor: colors.primary,
          backgroundColor: colors.primaryContainer,
          textColor: colors.onPrimaryContainer,
        };
      case 'success':
        return {
          icon: 'check-circle',
          iconColor: colors.primary,
          backgroundColor: colors.primaryContainer,
          textColor: colors.onPrimaryContainer,
        };
    }
  };

  const { icon, iconColor, backgroundColor, textColor } = getIconAndColors();

  const handleConfirm = () => {
    onConfirm?.();
    onDismiss?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onDismiss?.();
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
          entering={ZoomIn.duration(M3Motion.duration.emphasized)}
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceContainerHigh,
              ...M3Elevation.level3,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Icon */}
          <Animated.View
            entering={FadeIn.duration(M3Motion.duration.emphasized).delay(100)}
            style={[
              styles.iconContainer,
              {
                backgroundColor,
              },
            ]}
          >
            <MaterialCommunityIcons name={icon as any} size={32} color={iconColor} />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            {message}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            {showCancel && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surfaceContainerHighest,
                  },
                ]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.onSurface }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: type === 'error' ? colors.error : colors.primary,
                },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: type === 'error' ? colors.onError : colors.onPrimary },
                ]}
              >
                {confirmText}
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
    width: '100%',
    maxWidth: 400,
    borderRadius: M3Shape.extraExtraLarge,
    padding: M3Spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: M3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: M3Spacing.lg,
  },
  title: {
    ...M3Typography.headline.small,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: M3Spacing.md,
  },
  message: {
    ...M3Typography.body.medium,
    textAlign: 'center',
    marginBottom: M3Spacing.xl,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: M3Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // Style applied via backgroundColor prop
  },
  confirmButton: {
    // Style applied via backgroundColor prop
  },
  buttonText: {
    ...M3Typography.label.large,
    fontWeight: '600',
  },
});
