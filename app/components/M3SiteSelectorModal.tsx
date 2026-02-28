/**
 * M3SiteSelectorModal Component
 * 
 * Material 3 Expressive site selector modal with:
 * - Scrollable FlatList for all sites
 * - "All Sites Combined" option at top
 * - Material You dynamic colors
 * - Search functionality (future enhancement)
 * - Selected state indicator
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Text,
} from 'react-native';
import Animated, { SlideInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography, M3Shape, M3Elevation, M3Spacing } from '../../lib/design/tokens';

export interface SiteSelectorSite {
  id: string;
  name: string;
  capacity: string;
  location?: { lat: number; lng: number };
}

export interface M3SiteSelectorModalProps {
  visible: boolean;
  sites: SiteSelectorSite[];
  selectedSiteId: string | null;
  onSelectSite: (siteId: string | null) => void;
  onDismiss: () => void;
  showSearch?: boolean;
}

export default function M3SiteSelectorModal({
  visible,
  sites,
  selectedSiteId,
  onSelectSite,
  onDismiss,
  showSearch = false,
}: M3SiteSelectorModalProps) {
  const colors = useMaterialYouColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sites based on search query
  const filteredSites = searchQuery
    ? sites.filter((site) =>
        site.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sites;

  // "All Sites Combined" option
  const allSitesOption = {
    id: null,
    name: 'All Sites Combined',
    capacity: `${sites.length} Sites`,
  };

  const handleSelectSite = (siteId: string | null) => {
    onSelectSite(siteId);
    onDismiss();
  };

  const renderSiteItem = ({ item }: { item: SiteSelectorSite | typeof allSitesOption }) => {
    const isSelected = item.id === selectedSiteId;

    return (
      <TouchableOpacity
        style={[
          styles.siteItem,
          {
            backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
            borderRadius: M3Shape.large,
          },
        ]}
        onPress={() => handleSelectSite(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.siteItemContent}>
          <View style={styles.siteIcon}>
            <MaterialCommunityIcons
              name={item.id === null ? 'office-building-marker-outline' : 'solar-power-variant'}
              size={24}
              color={isSelected ? colors.onPrimaryContainer : colors.primary}
            />
          </View>

          <View style={styles.siteInfo}>
            <Text
              style={[
                M3Typography.title.medium,
                { color: isSelected ? colors.onPrimaryContainer : colors.onSurface }
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                M3Typography.body.small,
                { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant, marginTop: 2 }
              ]}
            >
              {item.capacity}
            </Text>
          </View>

          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={colors.onPrimaryContainer}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.overlay}
        onPress={onDismiss}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: M3Shape.extraExtraLarge,
              borderTopRightRadius: M3Shape.extraExtraLarge,
              paddingBottom: insets.bottom + M3Spacing.lg,
              maxHeight: '80%',
              ...M3Elevation.level3,
            },
          ]}
          entering={SlideInDown.duration(300)}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
            <View style={styles.dragHandle} />
            
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name="office-building"
                size={24}
                color={colors.primary}
                style={{ marginRight: M3Spacing.sm }}
              />
              <Text style={[M3Typography.headline.small, { color: colors.onSurface }]}>
                Select Site
              </Text>
            </View>

            <Text
              style={[
                M3Typography.body.medium,
                { color: colors.onSurfaceVariant, marginTop: M3Spacing.xs }
              ]}
            >
              Choose a site to view its performance analytics, or view aggregated data from all sites combined.
            </Text>

            {/* Search (optional) */}
            {showSearch && (
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: colors.surfaceContainerHighest,
                    borderRadius: M3Shape.extraLarge,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      color: colors.onSurface,
                      ...M3Typography.body.large,
                    },
                  ]}
                  placeholder="Search sites..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            )}
          </View>

          {/* Site List */}
          <FlatList
            data={[allSitesOption, ...filteredSites]}
            renderItem={renderSiteItem}
            keyExtractor={(item) => item.id || 'all-sites'}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle={colors.isDark ? 'white' : 'black'}
          />

          {/* Cancel Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  borderRadius: M3Shape.full,
                },
              ]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={[M3Typography.label.large, { color: colors.onSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  header: {
    paddingHorizontal: M3Spacing.lg,
    paddingTop: M3Spacing.md,
    paddingBottom: M3Spacing.lg,
    borderBottomWidth: 1,
  },
  dragHandle: {
    width: 32,
    height: 4,
    backgroundColor: '#00000020',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: M3Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: M3Spacing.md,
    paddingVertical: M3Spacing.sm,
    marginTop: M3Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: M3Spacing.sm,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
  },
  siteItem: {
    marginBottom: M3Spacing.sm,
    overflow: 'hidden',
  },
  siteItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: M3Spacing.md,
  },
  siteIcon: {
    marginRight: M3Spacing.md,
  },
  siteInfo: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: M3Spacing.lg,
    paddingTop: M3Spacing.md,
  },
  cancelButton: {
    paddingVertical: M3Spacing.md,
    alignItems: 'center',
  },
});
