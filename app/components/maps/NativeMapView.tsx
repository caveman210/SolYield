import React from 'react';
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

interface NativeMapViewProps {
  location?: GeoPoint;
  siteName?: string;
  subtitle?: string;
  height?: number;
  showCoordinates?: boolean;
  radiusMeters?: number;
  onPress?: () => void;
}

/**
 * NativeMapView
 * 
 * Wrapper for react-native-maps that will be used when ENABLE_NATIVE_MAPS is true.
 * This component requires Google Maps API key to be configured in app.json.
 * 
 * Currently unused - the app defaults to MiniMapPreview to avoid API key requirement.
 */
export default function NativeMapView({
  location,
  siteName,
  subtitle,
  height = 200,
  showCoordinates = true,
  radiusMeters,
  onPress,
}: NativeMapViewProps) {
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
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{
            latitude: location.lat,
            longitude: location.lng,
          }}
          title={siteName}
          description={subtitle}
          pinColor={colors.primary}
        />
        {radiusMeters && (
          <Circle
            center={{
              latitude: location.lat,
              longitude: location.lng,
            }}
            radius={radiusMeters}
            fillColor={`${colors.primary}22`}
            strokeColor={`${colors.primary}88`}
            strokeWidth={2}
          />
        )}
      </MapView>

      {(siteName || subtitle || showCoordinates) && (
        <View
          style={[
            styles.infoOverlay,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          {siteName && (
            <StyledText
              style={{
                fontWeight: '600',
                color: colors.onSurface,
              }}
              numberOfLines={1}
            >
              {siteName}
            </StyledText>
          )}
          {subtitle && (
            <StyledText
              style={{
                fontSize: 12,
                color: colors.onSurfaceVariant,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </StyledText>
          )}
          {showCoordinates && (
            <StyledText
              style={{
                fontSize: 11,
                color: colors.onSurfaceVariant,
                marginTop: 4,
              }}
            >
              {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
            </StyledText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: M3Shape.large,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    width: '100%',
    borderRadius: M3Shape.large,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: M3Shape.medium,
    padding: 12,
    borderWidth: 1,
  },
});
