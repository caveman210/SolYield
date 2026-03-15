import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMaterialYouColors } from '../../../lib/hooks/MaterialYouProvider';
import { M3Shape } from '../../../lib/design/tokens';
import StyledText from '../StyledText';

export type GeoPoint = {
  lat: number;
  lng: number;
};

export interface NativeMapViewProps {
  location?: GeoPoint;
  siteName?: string;
  subtitle?: string;
  height?: number;
  showCoordinates?: boolean;
  radiusMeters?: number;
  onPress?: () => void;
  interactive?: boolean;        // NEW: Enables zoom/pan gestures
  showsUserLocation?: boolean;  // NEW: Shows the blue GPS dot
}

const NativeMapView = forwardRef<MapView, NativeMapViewProps>(({
  location,
  siteName,
  subtitle,
  height = 200,
  showCoordinates = true,
  radiusMeters,
  onPress,
  interactive = false,
  showsUserLocation = false,
}, ref) => {
  const colors = useMaterialYouColors();

  if (!location) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: colors.surfaceVariant }]}>
        <MaterialCommunityIcons name="map-marker-off" size={32} color={colors.onSurfaceVariant} />
        <StyledText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          Location unavailable
        </StyledText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, borderWidth: interactive ? 0 : 1 }]}>
      <MapView
        ref={ref}
        style={styles.map}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: interactive ? 0.04 : 0.01,
          longitudeDelta: interactive ? 0.04 : 0.01,
        }}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false} // We are using our custom Recenter button
      >
        <Marker
          coordinate={{ latitude: location.lat, longitude: location.lng }}
          title={siteName}
          description={subtitle}
          pinColor={colors.primary}
        />
        {radiusMeters && (
          <Circle
            center={{ latitude: location.lat, longitude: location.lng }}
            radius={radiusMeters}
            fillColor={`${colors.primary}22`}
            strokeColor={`${colors.primary}88`}
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Only show the overlay box if it's NOT an interactive full-screen map */}
      {!interactive && (siteName || subtitle || showCoordinates) && (
        <View
          style={[
            styles.infoOverlay,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
          pointerEvents="none"
        >
          {siteName && (
            <StyledText style={{ fontWeight: '600', color: colors.onSurface }} numberOfLines={1}>
              {siteName}
            </StyledText>
          )}
          {subtitle && (
            <StyledText style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </StyledText>
          )}
          {showCoordinates && (
            <StyledText style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 }}>
              {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
            </StyledText>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: M3Shape.large, overflow: 'hidden', borderColor: '#00000020' },
  map: { ...StyleSheet.absoluteFillObject },
  placeholder: { width: '100%', borderRadius: M3Shape.large, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  infoOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12, borderRadius: M3Shape.medium, padding: 12, borderWidth: 1 },
});

export default NativeMapView;
