# SolYield Mobile - Build Guide

## Overview
This guide explains how to build the SolYield Mobile app for production releases, ensuring that Metro bundler properly packages the `index.android.bundle` for Android.

---

## Development Build (Debug)

### Running in Development Mode
```bash
# Start Metro bundler and run on connected device
npm run android

# Or use Expo CLI directly
npx expo run:android
```

**What happens:**
- Metro bundler runs in development mode
- JavaScript is loaded from Metro server (localhost:8081)
- Hot reloading is enabled
- Source maps are generated for debugging

---

## Production Build (Release)

### Method 1: APK Build (Recommended for Testing)

```bash
# Build release APK
npm run android:build

# Or manually:
cd android
./gradlew clean
./gradlew assembleRelease
cd ..
```

**Output Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

**What happens:**
1. Metro bundles JavaScript using Expo CLI's `export:embed` command
2. JavaScript bundle is compiled with Hermes bytecode
3. Assets are compressed and included in the APK
4. ProGuard minifies and obfuscates code (if enabled)
5. Bundle is packaged as `index.android.bundle` inside the APK

### Method 2: AAB Build (For Google Play Store)

```bash
# Build Android App Bundle
npm run android:bundle

# Or manually:
cd android
./gradlew clean
./gradlew bundleRelease
cd ..
```

**Output Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

**What happens:**
- Same as APK build, but creates an optimized `.aab` file
- Google Play uses this to generate device-specific APKs
- Smaller download sizes for end users

### Method 3: Direct Release Run

```bash
# Build and install release version directly to device
npm run android:release
```

**Use Case:**
- Testing release build behavior on connected device
- Verifying performance optimizations

---

## Build Configuration Explained

### 1. Metro Bundler Configuration (`metro.config.js`)

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Release optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      drop_console: true, // Removes console.log in production
    },
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
```

**Key Features:**
- Uses Expo's Metro config for proper asset resolution
- NativeWind integration for Tailwind CSS
- Console statements removed in production builds
- Minification and compression enabled

### 2. Gradle Configuration (`android/app/build.gradle`)

```gradle
react {
    // Expo's entry point resolver
    entryFile = file([...])
    
    // Use Expo CLI for bundling (critical!)
    cliFile = new File([...])
    bundleCommand = "export:embed"
    
    // Enable bundle compression
    enableBundleCompression = true
}
```

**Critical Settings:**
- `bundleCommand = "export:embed"` - Uses Expo CLI instead of React Native CLI
- Ensures Metro config is respected during build
- Properly resolves entry point via `expo-router`

### 3. Gradle Properties (`android/gradle.properties`)

```properties
# Hermes JavaScript engine
hermesEnabled=true

# Release optimizations
android.enableBundleCompression=true
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true

# Architecture support
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```

**Optimizations:**
- **Hermes**: Compiles JS to bytecode for faster startup
- **Minify**: Reduces code size using R8/ProGuard
- **ShrinkResources**: Removes unused resources
- **Bundle Compression**: Compresses JavaScript bundle

---

## Verifying Release Build

### 1. Check Bundle Inclusion

After building, verify the bundle is packaged:

```bash
# Extract APK and check for bundle
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep "index.android.bundle"

# Expected output:
# assets/index.android.bundle
```

### 2. Check Bundle Size

```bash
# View bundle size
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Typical size: 30-50 MB for this project
```

### 3. Install and Test

```bash
# Install release APK on connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Check logs for errors
adb logcat | grep "ReactNative\|SolYield"
```

---

## Common Build Issues & Solutions

### Issue 1: "Unable to load script from assets"

**Cause:** Bundle wasn't properly packaged

**Solution:**
```bash
# Clean build completely
cd android
./gradlew clean
rm -rf app/build
cd ..

# Rebuild
npm run android:build
```

### Issue 2: Metro bundler conflicts

**Cause:** Development server interfering with release build

**Solution:**
```bash
# Kill Metro server
pkill -f metro

# Clear Metro cache
npx expo start --clear

# Then rebuild
npm run android:build
```

### Issue 3: "index.android.bundle" not found

**Cause:** Gradle not using Expo CLI

**Solution:** Verify `android/app/build.gradle`:
```gradle
react {
    bundleCommand = "export:embed"  // Must be present!
    cliFile = new File([...])       // Must point to @expo/cli
}
```

### Issue 4: JavaScript errors in release only

**Cause:** Hermes bytecode compilation issues

**Solution:**
```bash
# Try disabling Hermes temporarily
# In android/gradle.properties:
hermesEnabled=false

# Rebuild and test
```

---

## Build Variants Comparison

| Variant | Bundle Location | Use Case |
|---------|----------------|----------|
| **Debug** | Metro Server (localhost:8081) | Development, hot reload |
| **Release** | Packaged in APK (`assets/index.android.bundle`) | Production, Google Play |

---

## Production Checklist

Before releasing to production:

- [ ] Run `npm run lint` - No ESLint errors
- [ ] Run `npm run format` - Code formatted
- [ ] Test all features on physical device
- [ ] Verify geofencing with real GPS
- [ ] Test offline mode (airplane mode)
- [ ] Test camera capture and image storage
- [ ] Build release APK/AAB
- [ ] Verify bundle is packaged (see verification steps)
- [ ] Test release build on multiple devices
- [ ] Check app size is reasonable
- [ ] Sign APK with production keystore (if applicable)

---

## Advanced: Custom Bundle Location

If you need to customize the bundle output:

```gradle
react {
    bundleAssetName = "custom.android.bundle"  // Custom name
    bundleCommand = "export:embed"
    extraPackagerArgs = ["--minify", "true"]   // Extra Metro args
}
```

---

## Questions & Troubleshooting

### How do I verify Metro is being used?

Check the Gradle build logs:
```bash
./gradlew assembleRelease --info | grep -i "metro\|bundle"
```

You should see references to `@expo/cli` and `export:embed`.

### Why use Expo CLI instead of React Native CLI?

- Expo CLI respects your `metro.config.js` configuration
- Properly handles Expo Router entry points
- Includes all necessary assets and fonts
- Handles NativeWind CSS compilation

### How can I reduce APK size?

1. Enable all optimizations in `gradle.properties`
2. Use ProGuard/R8 minification
3. Remove unused architectures if targeting specific devices:
   ```properties
   reactNativeArchitectures=arm64-v8a  # 64-bit only
   ```
4. Compress images in `assets/`
5. Use vector icons instead of PNG when possible

---

## Summary

Your build is correctly configured to use Metro bundler with Expo CLI's `export:embed` command. The JavaScript bundle **will be properly packaged** as `index.android.bundle` inside the APK/AAB when you run release builds.

**Key Points:**
- ✅ Metro config is properly set up
- ✅ Gradle uses Expo CLI for bundling
- ✅ Hermes compilation enabled
- ✅ Release optimizations configured
- ✅ Build scripts added to package.json

To build a release APK right now:
```bash
npm run android:build
```

The output will be at: `android/app/build/outputs/apk/release/app-release.apk`
