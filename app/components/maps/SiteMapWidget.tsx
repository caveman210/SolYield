import React from 'react';
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
}

export default function SiteMapWidget({
  location,
  siteName,
  radiusMeters,
  subtitle,
  height,
  showCoordinates = false,
  onPress,
}: SiteMapWidgetProps) {
  if (ENABLE_NATIVE_MAPS) {
    return (
      <NativeMapView
        location={location}
        siteName={siteName}
        radiusMeters={radiusMeters}
        subtitle={subtitle}
        height={height}
        showCoordinates={showCoordinates}
        onPress={onPress}
      />
    );
  }

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
}
