import '../global.css';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialYouProvider, useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

function AppContent() {
  const colors = useMaterialYouColors();

  // Set NavigationBar colors on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const setNavigationBar = async () => {
        try {
          const NavigationBar = await import('expo-navigation-bar');
          const hex = colors.onSurface.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const isDarkSurface = luminance > 0.5;
          await NavigationBar.setButtonStyleAsync(isDarkSurface ? 'light' : 'dark');
        } catch (error) {
          console.log('NavigationBar not available or edge-to-edge enabled:', error);
        }
      };
      setNavigationBar();
    }
  }, [colors.surface, colors.onSurface]);

  return (
    <>
      <StatusBar
        style={
          colors.onSurface.includes('FF') ||
          colors.onSurface.includes('EE') ||
          colors.onSurface.includes('DD')
            ? 'light'
            : 'dark'
        }
        backgroundColor={colors.background}
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.onSurface,
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: '400',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="site/[id]"
          options={{
            title: 'Site Details',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="performance"
          options={{
            title: 'Performance Analytics',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="styleguide"
          options={{
            title: 'Style Guide',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <MaterialYouProvider>
        <AppContent />
      </MaterialYouProvider>
    </Provider>
  );
}

