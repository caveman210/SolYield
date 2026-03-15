import 'dotenv/config'; // Make sure you have dotenv installed: npm install dotenv

export default {
  expo: {
    name: "SolYield",
    slug: "SolYield",
    version: "1.3.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "solyield",
    platforms: [
      "ios",
      "android"
    ],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#F59E0B"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.solyield.mobile",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "SolYield needs your location to verify site check-ins.",
        NSCameraUsageDescription: "SolYield needs camera access to capture inspection photos.",
        NSPhotoLibraryUsageDescription: "SolYield needs photo library access.",
        NSCalendarsUsageDescription: "SolYield can sync visits to your calendar.",
        ITSAppUsesNonExemptEncryption: false
      },
      config: {
        // Pulling from the .env file!
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F59E0B"
      },
      package: "com.solyield.mobile",
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_CALENDAR",
        "android.permission.WRITE_CALENDAR",
        "android.permission.RECORD_AUDIO"
      ],
      config: {
        googleMaps: {
          // Pulling from the .env file!
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow SolYield to use your location."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "SolYield needs photo library access to save inspection photos.",
          cameraPermission: "SolYield needs camera access to capture inspection photos."
        }
      ],
      [
        "expo-navigation-bar",
        {
          position: "relative",
          visibility: "visible",
          behavior: "overlay-swipe",
          borderStyle: "dark"
        }
      ],
      "@react-native-community/datetimepicker"
    ],
    extra: {
      router: {},
      "expo-navigation-bar": {
        position: "relative",
        visibility: "visible",
        behavior: "overlay-swipe",
        borderStyle: "dark"
      },
      eas: {
        projectId: "7cfb73e3-a340-4649-9214-f74ddf571220"
      }
    }
  }
};
