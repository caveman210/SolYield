import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import StyledText from './StyledText';
import StyledView from './StyledView';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const colors = useMaterialYouColors();

  return (
    <StyledView
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.outlineVariant,
        flexDirection: 'row',
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconElement = options.tabBarIcon
          ? (options.tabBarIcon as any)({
              focused: isFocused,
              color: isFocused ? colors.onPrimaryContainer : colors.onSurfaceVariant,
              size: 24,
            })
          : null;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
          >
            <StyledView
              style={{
                padding: 12,
                borderRadius: 16,
                backgroundColor: isFocused ? colors.primaryContainer : 'transparent',
              }}
            >
              {iconElement}
            </StyledView>
            <StyledText
              style={{
                color: isFocused ? colors.primary : colors.onSurfaceVariant,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {String(label)}
            </StyledText>
          </TouchableOpacity>
        );
      })}
    </StyledView>
  );
};

export default TabBar;
