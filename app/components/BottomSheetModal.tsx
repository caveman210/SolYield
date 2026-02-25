import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';

interface BottomSheetModalProps {
  children: React.ReactNode;
  snapPoints?: string[];
  enablePanDownToClose?: boolean;
  style?: ViewStyle;
  onClose?: () => void;
}

export const BottomSheetModal = forwardRef<BottomSheet, BottomSheetModalProps>(
  ({ children, snapPoints = ['50%', '90%'], enablePanDownToClose = true, style, onClose }, ref) => {
    const colors = useMaterialYouColors();

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1 && onClose) {
          onClose();
        }
      },
      [onClose]
    );

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={{
          backgroundColor: colors.surfaceContainerHigh,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.onSurfaceVariant,
        }}
        style={[styles.bottomSheet, style]}
      >
        <BottomSheetView
          style={[styles.contentContainer, { backgroundColor: colors.surfaceContainerHigh }]}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

BottomSheetModal.displayName = 'BottomSheetModal';

const styles = StyleSheet.create({
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
