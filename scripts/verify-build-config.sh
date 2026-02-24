#!/bin/bash
# Release Build Verification Script for SolYield Mobile

set -e

echo "=========================================="
echo "SolYield Mobile - Release Build Checker"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Metro Config
echo "Checking Metro Configuration..."
if grep -q "getDefaultConfig.*expo/metro-config" metro.config.js; then
    echo -e "${GREEN}✓${NC} Metro config uses Expo's default config"
else
    echo -e "${RED}✗${NC} Metro config not using Expo's default config"
    exit 1
fi

# Check 2: Gradle Bundle Command
echo "Checking Gradle bundleCommand..."
if grep -q 'bundleCommand = "export:embed"' android/app/build.gradle; then
    echo -e "${GREEN}✓${NC} Gradle configured to use Expo CLI (export:embed)"
else
    echo -e "${RED}✗${NC} Gradle not configured for Expo CLI bundling"
    exit 1
fi

# Check 3: Hermes Enabled
echo "Checking Hermes configuration..."
if grep -q "hermesEnabled=true" android/gradle.properties; then
    echo -e "${GREEN}✓${NC} Hermes JavaScript engine enabled"
else
    echo -e "${YELLOW}⚠${NC} Hermes not enabled (JSC will be used)"
fi

# Check 4: Entry Point
echo "Checking entry point..."
if grep -q '"main": "expo-router/entry"' package.json; then
    echo -e "${GREEN}✓${NC} Entry point set to expo-router/entry"
else
    echo -e "${RED}✗${NC} Entry point not configured for Expo Router"
    exit 1
fi

# Check 5: Build Scripts
echo "Checking build scripts..."
if grep -q "android:build" package.json; then
    echo -e "${GREEN}✓${NC} Build scripts configured in package.json"
else
    echo -e "${YELLOW}⚠${NC} Build scripts not found in package.json"
fi

# Check 6: Release Optimizations
echo "Checking release optimizations..."
OPTS=0
if grep -q "android.enableBundleCompression=true" android/gradle.properties; then
    OPTS=$((OPTS+1))
fi
if grep -q "android.enableMinifyInReleaseBuilds=true" android/gradle.properties; then
    OPTS=$((OPTS+1))
fi
if grep -q "android.enableShrinkResourcesInReleaseBuilds=true" android/gradle.properties; then
    OPTS=$((OPTS+1))
fi

if [ $OPTS -eq 3 ]; then
    echo -e "${GREEN}✓${NC} All release optimizations enabled ($OPTS/3)"
else
    echo -e "${YELLOW}⚠${NC} Some optimizations missing ($OPTS/3)"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Configuration Check Complete!${NC}"
echo "=========================================="
echo ""
echo "Your build is configured correctly to use Metro bundler."
echo "The JavaScript bundle will be properly packaged as:"
echo "  → assets/index.android.bundle (in APK/AAB)"
echo ""
echo "To build a release APK, run:"
echo "  npm run android:build"
echo ""
echo "Output will be at:"
echo "  android/app/build/outputs/apk/release/app-release.apk"
echo ""
