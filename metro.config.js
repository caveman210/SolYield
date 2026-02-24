const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ensure proper asset handling for release builds
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    compress: {
      // Drop console statements in production
      drop_console: true,
    },
  },
};

// Optimize Metro bundler for release builds
config.resolver = {
  ...config.resolver,
  // Ensure proper resolution of assets
  assetExts: [
    ...(config.resolver?.assetExts || []),
    // Add any custom asset extensions if needed
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });
