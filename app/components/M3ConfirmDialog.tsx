import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Spacing } from '../../lib/design/tokens';
import StyledText from './StyledText';

interface M3ConfirmDialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
  disabled?: boolean;
}

interface M3ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  buttons: M3ConfirmDialogButton[];
  onDismiss?: () => void;
  children?: React.ReactNode;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * M3ConfirmDialog
 * 
 * Material Design 3 compliant dialog with dynamic color support.
 * Replaces React Native's Alert.alert with a more polished, themeable UI.
 */
export default function M3ConfirmDialog({
  visible,
  title,
  message,
  icon,
  iconColor,
  buttons,
  onDismiss,
  children,
}: M3ConfirmDialogProps) {
  const colors = useMaterialYouColors();

  const handleBackdropPress = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonColors = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'destructive':
        return {
          textColor: colors.error,
          backgroundColor: `${colors.error}14`,
          pressedBackgroundColor: `${colors.error}1F`,
        };
      case 'cancel':
        return {
          textColor: colors.onSurfaceVariant,
          backgroundColor: colors.surfaceVariant,
          pressedBackgroundColor: colors.surfaceContainerHigh,
        };
      default:
        return {
          textColor: colors.primary,
          backgroundColor: `${colors.primary}14`,
          pressedBackgroundColor: `${colors.primary}1F`,
        };
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onDismiss}
      animationType="none"
      statusBarTranslucent
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.scrim }]}
        onPress={handleBackdropPress}
      >
        <AnimatedPressable
          entering={SlideInDown.duration(300).springify()}
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surfaceContainerHigh,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {icon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${iconColor || colors.primary}14`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={icon}
                size={32}
                color={iconColor || colors.primary}
              />
            </View>
          )}

          <StyledText
            style={[
              M3Typography.headline.small,
              {
                color: colors.onSurface,
                textAlign: 'center',
                marginBottom: message ? M3Spacing.sm : M3Spacing.md,
              },
            ]}
          >
            {title}
          </StyledText>

          {message && (
            <StyledText
              style={[
                M3Typography.body.medium,
                {
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginBottom: M3Spacing.lg,
                },
              ]}
            >
              {message}
            </StyledText>
          )}

          {children && <View style={styles.childrenContainer}>{children}</View>}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const buttonColors = getButtonColors(button.style);
              const isDisabled = button.disabled ?? false;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    {
                      backgroundColor: buttonColors.backgroundColor,
                      flex: buttons.length > 2 ? 0 : 1,
                      minWidth: buttons.length > 2 ? 100 : undefined,
                      opacity: isDisabled ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    button.onPress();
                    if (onDismiss && button.style !== 'cancel') onDismiss();
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      M3Typography.label.large,
                      {
                        color: buttonColors.textColor,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedPressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: M3Spacing.xl,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: M3Shape.extraLarge,
    padding: M3Spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: M3Shape.full,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: M3Spacing.md,
  },
  childrenContainer: {
    marginBottom: M3Spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: M3Spacing.md,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
