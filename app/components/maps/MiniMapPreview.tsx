import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Line, Text as SvgText } from 'react-native-svg';
import StyledText from '../StyledText';
import { useMaterialYouColors } from '../../../lib/hooks/MaterialYouProvider';
import { M3Shape, M3Spacing, M3Typography } from '../../../lib/design/tokens';

export type GeoPoint = {
  lat: number;
  lng: number;
};

interface MiniMapPreviewProps {
  location?: GeoPoint;
  siteName?: string;
  subtitle?: string;
  height?: number;
  showCoordinates?: boolean;
  radiusMeters?: number;
  onPress?: () => void;
  compact?: boolean;
}

/**
 * MiniMapPreview
 *
 * Lightweight, API-key free visualization of site coordinates with stylized
 * representation of roads, buildings, and landmarks.
 * The component renders a Google Maps-like UI with deterministic features
 * based on coordinate data.
 */
export default function MiniMapPreview({
  location,
  siteName,
  subtitle,
  height = 140,
  showCoordinates = true,
  radiusMeters,
  onPress,
  compact,
}: MiniMapPreviewProps) {
  const colors = useMaterialYouColors();
  const [layout, setLayout] = useState({ width: 0, height });

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height: nextHeight } = event.nativeEvent.layout;
      if (width !== layout.width || nextHeight !== layout.height) {
        setLayout({ width, height: nextHeight });
      }
    },
    [layout.height, layout.width]
  );

  const pinPosition = useMemo(() => {
    if (!location || layout.width === 0 || layout.height === 0) {
      return { top: layout.height / 2, left: layout.width / 2 };
    }

    const normalizedLat = (location.lat + 90) / 180;
    const normalizedLng = (location.lng + 180) / 360;

    const top = Math.max(16, Math.min(layout.height - 16, layout.height * (1 - normalizedLat)));
    const left = Math.max(16, Math.min(layout.width - 16, layout.width * normalizedLng));

    return { top, left };
  }, [layout.height, layout.width, location]);

  // Generate deterministic road patterns based on location
  const roadData = useMemo(() => {
    if (!location || layout.width === 0) return [];
    
    const seed = Math.abs(location.lat * 1000 + location.lng * 1000);
    const roads: Array<{ x1: number; y1: number; x2: number; y2: number; type: 'major' | 'minor' }> = [];
    
    // Major horizontal road
    const majorY = (seed % 40) + 30;
    roads.push({
      x1: 0,
      y1: majorY,
      x2: 100,
      y2: majorY,
      type: 'major',
    });
    
    // Major vertical road
    const majorX = ((seed * 1.3) % 40) + 30;
    roads.push({
      x1: majorX,
      y1: 0,
      x2: majorX,
      y2: 100,
      type: 'major',
    });
    
    // Minor roads
    for (let i = 0; i < 3; i++) {
      const offset = (seed * (i + 2)) % 100;
      if (i % 2 === 0) {
        roads.push({
          x1: 0,
          y1: (offset % 80) + 10,
          x2: 100,
          y2: (offset % 80) + 10,
          type: 'minor',
        });
      } else {
        roads.push({
          x1: (offset % 80) + 10,
          y1: 0,
          x2: (offset % 80) + 10,
          y2: 100,
          type: 'minor',
        });
      }
    }
    
    return roads;
  }, [location, layout.width]);

  // Generate buildings
  const buildings = useMemo(() => {
    if (!location || layout.width === 0) return [];
    
    const seed = Math.abs(location.lat * 1000 + location.lng * 1000);
    const items: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    for (let i = 0; i < 8; i++) {
      const xSeed = (seed * (i + 1) * 1.7) % 80;
      const ySeed = (seed * (i + 1) * 2.3) % 80;
      
      items.push({
        x: xSeed + 10,
        y: ySeed + 10,
        width: 4 + ((seed * (i + 1)) % 8),
        height: 4 + ((seed * (i + 1) * 1.5) % 8),
      });
    }
    
    return items;
  }, [location, layout.width]);

  // Generate landmarks (parks, etc.)
  const landmarks = useMemo(() => {
    if (!location || layout.width === 0) return [];
    
    const seed = Math.abs(location.lat * 1000 + location.lng * 1000);
    const items: Array<{ x: number; y: number; size: number; type: 'park' | 'water' }> = [];
    
    // Park
    items.push({
      x: ((seed * 1.5) % 60) + 15,
      y: ((seed * 2.1) % 60) + 15,
      size: 12,
      type: 'park',
    });
    
    // Water feature
    if (seed % 3 === 0) {
      items.push({
        x: ((seed * 2.7) % 50) + 20,
        y: ((seed * 3.3) % 50) + 20,
        size: 10,
        type: 'water',
      });
    }
    
    return items;
  }, [location, layout.width]);

  // Calculate distance markers
  const distanceMarkers = useMemo(() => {
    if (!radiusMeters) return [];
    
    const distanceKm = radiusMeters / 1000;
    const markers: string[] = [];
    
    if (distanceKm < 1) {
      markers.push(`${radiusMeters}m`);
    } else if (distanceKm < 10) {
      markers.push(`${distanceKm.toFixed(1)}km`);
    } else {
      markers.push(`${Math.round(distanceKm)}km`);
    }
    
    return markers;
  }, [radiusMeters]);

  const coordinateLabel = useMemo(() => {
    if (!location) return 'Coordinates unavailable';
    return `${location.lat.toFixed(3)}°, ${location.lng.toFixed(3)}°`;
  }, [location]);

  const radiusLabel = useMemo(() => {
    if (!radiusMeters) return undefined;
    if (radiusMeters < 1000) return `${radiusMeters} m radius`;
    return `${(radiusMeters / 1000).toFixed(1)} km radius`;
  }, [radiusMeters]);

  const Container = onPress ? Pressable : View;

  return (
    <Container
      style={[styles.container, { height, backgroundColor: colors.surfaceContainer }]}
      onPress={onPress}
      disabled={!onPress}
      android_ripple={onPress ? { color: colors.surfaceVariant } : undefined}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={[colors.surfaceContainerHigh, colors.surfaceVariant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Enhanced map features layer */}
      {layout.width > 0 && (
        <Svg
          width={layout.width}
          height={height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {/* Grid background */}
          {Array.from({ length: 6 }).map((_, index) => (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1="0"
                y1={(index / 5) * height}
                x2={layout.width}
                y2={(index / 5) * height}
                stroke={colors.surfaceContainerHighest}
                strokeWidth="0.5"
                opacity="0.25"
              />
              <Line
                x1={(index / 5) * layout.width}
                y1="0"
                x2={(index / 5) * layout.width}
                y2={height}
                stroke={colors.surfaceContainerHighest}
                strokeWidth="0.5"
                opacity="0.25"
              />
            </React.Fragment>
          ))}

          {/* Landmarks (parks, water) */}
          {landmarks.map((landmark, idx) => (
            <Circle
              key={`landmark-${idx}`}
              cx={(landmark.x / 100) * layout.width}
              cy={(landmark.y / 100) * height}
              r={(landmark.size / 100) * Math.min(layout.width, height)}
              fill={landmark.type === 'park' ? `${colors.tertiary}22` : `${colors.primary}18`}
              stroke={landmark.type === 'park' ? colors.tertiary : colors.primary}
              strokeWidth="1"
              opacity="0.4"
            />
          ))}

          {/* Roads */}
          {roadData.map((road, idx) => (
            <Line
              key={`road-${idx}`}
              x1={(road.x1 / 100) * layout.width}
              y1={(road.y1 / 100) * height}
              x2={(road.x2 / 100) * layout.width}
              y2={(road.y2 / 100) * height}
              stroke={road.type === 'major' ? colors.onSurfaceVariant : colors.outlineVariant}
              strokeWidth={road.type === 'major' ? '2' : '1'}
              opacity={road.type === 'major' ? '0.5' : '0.3'}
            />
          ))}

          {/* Buildings */}
          {buildings.map((building, idx) => (
            <Rect
              key={`building-${idx}`}
              x={(building.x / 100) * layout.width}
              y={(building.y / 100) * height}
              width={(building.width / 100) * layout.width}
              height={(building.height / 100) * height}
              fill={`${colors.onSurfaceVariant}22`}
              stroke={colors.outlineVariant}
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}

          {/* Distance markers */}
          {distanceMarkers.map((marker, idx) => (
            <SvgText
              key={`marker-${idx}`}
              x={layout.width - 50}
              y={20 + idx * 16}
              fill={colors.onSurfaceVariant}
              fontSize="10"
              fontWeight="500"
              opacity="0.7"
            >
              {marker}
            </SvgText>
          ))}
        </Svg>
      )}

      {radiusMeters && (
        <View
          pointerEvents="none"
          style={[
            styles.radius,
            {
              borderColor: `${colors.primary}55`,
              backgroundColor: `${colors.primary}11`,
              width: Math.min(layout.width, layout.height) * 0.7,
              height: Math.min(layout.width, layout.height) * 0.7,
              top: pinPosition.top - (Math.min(layout.width, layout.height) * 0.35),
              left: pinPosition.left - (Math.min(layout.width, layout.height) * 0.35),
            },
          ]}
        />
      )}

      <View
        pointerEvents="none"
        style={[
          styles.pin,
          {
            top: pinPosition.top - 12,
            left: pinPosition.left - 12,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <MaterialCommunityIcons name="map-marker" size={18} color={colors.onPrimary} />
      </View>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        {siteName && (
          <StyledText
            style={{
              ...M3Typography.label.large,
              color: colors.onSurface,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {siteName}
          </StyledText>
        )}
        {subtitle && (
          <StyledText
            style={{
              ...M3Typography.label.small,
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
              ...M3Typography.label.small,
              color: colors.onSurfaceVariant,
              marginTop: subtitle ? 2 : 6,
            }}
            numberOfLines={1}
          >
            {coordinateLabel}
          </StyledText>
        )}
        {radiusLabel && (
          <StyledText
            style={{
              ...M3Typography.label.small,
              color: colors.primary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {radiusLabel}
          </StyledText>
        )}
      </View>

      {!compact && (
        <View style={styles.compass} pointerEvents="none">
          <MaterialCommunityIcons name="compass-outline" size={18} color={colors.onSurfaceVariant} />
          <StyledText
            style={{
              ...M3Typography.label.small,
              color: colors.onSurfaceVariant,
              marginLeft: 6,
            }}
          >
            Enhanced Map
          </StyledText>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: M3Shape.large,
    overflow: 'hidden',
    borderWidth: 1,
  },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: M3Shape.small,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  radius: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  infoCard: {
    position: 'absolute',
    left: M3Spacing.md,
    right: M3Spacing.md,
    bottom: M3Spacing.md,
    borderRadius: M3Shape.medium,
    padding: M3Spacing.md,
    borderWidth: 1,
  },
  compass: {
    position: 'absolute',
    top: M3Spacing.md,
    right: M3Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.sm,
    paddingVertical: 6,
    backgroundColor: '#00000022',
    borderRadius: M3Shape.full,
  },
});
