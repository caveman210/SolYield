import React, { forwardRef } from 'react';
import MapView from 'react-native-maps';
import MiniMapPreview, { GeoPoint } from './MiniMapPreview';
import NativeMapView from './NativeMapView';
import { ENABLE_NATIVE_MAPS } from '../../../lib/config/maps';

interface SiteMapWidgetProps {
  location?: GeoPoint;
  siteName?: string;
  radiusMeters?: number;
  subtitle?: string;
  height?: number;
  showCoordinates?: boolean;
  onPress?: () => void;
  interactive?: boolean;        // NEW
  showsUserLocation?: boolean;  // NEW
  forceNative?: boolean;        // NEW: Override the .env config for specific screens
}

const SiteMapWidget = forwardRef<MapView, SiteMapWidgetProps>(({
  location,
  siteName,
  radiusMeters,
  subtitle,
  height,
  showCoordinates = false,
  onPress,
  interactive = false,
  showsUserLocation = false,
  forceNative = false,
}, ref) => {

  // If interactive, forced, or globally enabled, use the real Native Map
  if (ENABLE_NATIVE_MAPS || forceNative || interactive) {
    return (
      <NativeMapView
        ref={ref}
        location={location}
        siteName={siteName}
        radiusMeters={radiusMeters}
        subtitle={subtitle}
        height={height}
        showCoordinates={showCoordinates}
        onPress={onPress}
        interactive={interactive}
        showsUserLocation={showsUserLocation}
      />
    );
  }

  // Otherwise, use the lightweight SVG map (crucial for FlatList performance)
  return (
    <MiniMapPreview
      location={location}
      siteName={siteName}
      radiusMeters={radiusMeters}
      subtitle={subtitle}
      height={height}
      showCoordinates={showCoordinates}
      compact
      onPress={onPress}
    />
  );
});

export default SiteMapWidget;
