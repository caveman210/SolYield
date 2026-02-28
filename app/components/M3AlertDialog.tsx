import React from 'react';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import M3ConfirmDialog from './M3ConfirmDialog';

export interface M3AlertDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  closeText?: string;
}

/**
 * M3AlertDialog
 * 
 * Simplified alert dialog (single action button) built on top of M3ConfirmDialog.
 * Material Design 3 compliant with dynamic color support.
 * 
 * Usage:
 * ```tsx
 * <M3AlertDialog
 *   visible={showAlert}
 *   title="Success"
 *   message="Operation completed successfully"
 *   type="success"
 *   onDismiss={() => setShowAlert(false)}
 * />
 * ```
 */
export default function M3AlertDialog({
  visible,
  title,
  message,
  type = 'info',
  onDismiss,
  closeText = 'OK',
}: M3AlertDialogProps) {
  const colors = useMaterialYouColors();

  // Map type to icon and color
  const typeConfig = {
    success: {
      icon: 'check-circle' as const,
      color: colors.primary,
    },
    error: {
      icon: 'alert-circle' as const,
      color: colors.error,
    },
    info: {
      icon: 'information' as const,
      color: colors.tertiary,
    },
  };

  const config = typeConfig[type];

  return (
    <M3ConfirmDialog
      visible={visible}
      title={title}
      message={message}
      icon={config.icon}
      iconColor={config.color}
      buttons={[
        {
          text: closeText,
          onPress: onDismiss,
          style: 'default',
        },
      ]}
      onDismiss={onDismiss}
    />
  );
}
