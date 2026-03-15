import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialYouProvider, useMaterialYouColors } from '../lib/hooks/MaterialYouProvider';
import { useEffect } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { Provider } from 'react-redux';

import { database } from '../database';
import { useDatabase } from '../lib/hooks/useDatabase';
import { store } from '../store';

function AppContent() {
  const colors = useMaterialYouColors();

  // Set NavigationBar button style for edge-to-edge mode
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
          headerShown: false, // <-- UNIVERSAL FIX: All new pages will default to NO native header
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="site/[id]" options={{ title: 'Site Details' }} />
        <Stack.Screen name="performance" options={{ title: 'Performance Analytics' }} />
        <Stack.Screen name="inspection/[id]" options={{ title: 'Inspection Details' }} />
        
        {/* Modals are the exception: We turn the header back ON so users get the native close/drag UI */}
        <Stack.Screen
          name="inspection-form"
          options={{
            title: 'New Inspection',
            headerShown: true, 
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="styleguide"
          options={{
            title: 'Style Guide',
            headerShown: true,
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

/**
 * InitializationGate
 * Checks if database is ready and shows loading/error screens.
 * Must be INSIDE DatabaseProvider so hooks can access database context.
 */
function InitializationGate({ children }: { children: React.ReactNode }) {
  const dbState = useDatabase();
  const colors = useMaterialYouColors();

  // Show loading screen during database initialization/migration
  if (dbState.isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onBackground }]}>
          {dbState.migrationStatus === 'running' ? 'Setting up database...' : 'Initializing app...'}
        </Text>
        {dbState.migrationStatus === 'running' && (
          <Text style={[styles.subText, { color: colors.onSurfaceVariant }]}>
            This may take a few moments on first launch
          </Text>
        )}
      </View>
    );
  }

  // Show error screen if database initialization failed
  if (dbState.error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>
          Database Error
        </Text>
        <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
          {dbState.error.message}
        </Text>
      </View>
    );
  }

  // Database is ready, render app
  return <>{children}</>;
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
      <SafeAreaProvider>
        <MaterialYouProvider>
          <DatabaseProvider database={database}>
            <InitializationGate>
              <AppContent />
            </InitializationGate>
          </DatabaseProvider>
        </MaterialYouProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  }
});
