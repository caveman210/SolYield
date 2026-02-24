import '../global.css';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialYouProvider, useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
  const colors = useMaterialYouColors();

  // Set NavigationBar button style for edge-to-edge mode (background handled by View components)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const setNavigationBar = async () => {
        try {
          const NavigationBar = await import('expo-navigation-bar');

          // Calculate luminance of background to determine button style
          const hex = colors.background.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const isLightBackground = luminance > 0.5;

          // Set button style based on background luminance
          // Light background = dark buttons, Dark background = light buttons
          await NavigationBar.setButtonStyleAsync(isLightBackground ? 'dark' : 'light');
        } catch (error) {
          console.log('NavigationBar configuration error:', error);
        }
      };
      setNavigationBar();
    }
  }, [colors.background]);

  return (
    <>
      <StatusBar style="auto" backgroundColor="transparent" translucent={true} />
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
          name="inspection/[id]"
          options={{
            title: 'Inspection Details',
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
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          }
          persistor={persistor}
        >
          <MaterialYouProvider>
            <AppContent />
          </MaterialYouProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}
