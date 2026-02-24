import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { InspectionForm } from '../../lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { router } from 'expo-router';
import { useState } from 'react';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function InspectionHistoryScreen() {
  const colors = useMaterialYouColors();
  const forms = useSelector((state: RootState) => state.maintenance.forms);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getFieldValue = (form: InspectionForm, fieldId: string): string => {
    const value = form.data[fieldId];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value ? String(value) : 'N/A';
  };

  const renderItem = ({ item, index }: { item: InspectionForm; index: number }) => {
    const imageCount = Object.keys(item.images).length;

    return (
      <AnimatedTouchableOpacity
        entering={FadeInUp.duration(400).delay(index * 50)}
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceContainer,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => router.push(`/inspection/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${colors.primary}14` },
              ]}
            >
              <MaterialCommunityIcons
                name="clipboard-text"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                Inspection Report
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.outline }]}>
                {item.siteName || 'Unknown Site'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.synced
                  ? `${colors.primary}14`
                  : `${colors.error}14`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.synced ? 'cloud-check' : 'cloud-upload'}
              size={14}
              color={item.synced ? colors.primary : colors.error}
              style={styles.statusIcon}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.synced ? colors.primary : colors.error },
              ]}
            >
              {item.synced ? 'Synced' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.outline}
            />
            <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
              {formatDate(item.timestamp)}
            </Text>
          </View>

          {imageCount > 0 && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="camera"
                size={16}
                color={colors.outline}
              />
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
          )}

          {item.data.f_inverter_serial && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="identifier"
                size={16}
                color={colors.outline}
              />
              <Text
                style={[styles.infoText, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {getFieldValue(item, 'f_inverter_serial')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.primary}
          />
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[styles.emptyContainer, { backgroundColor: colors.surfaceContainer }]}
    >
      <MaterialCommunityIcons
        name="clipboard-text-off-outline"
        size={64}
        color={colors.outline}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No Inspections Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.outline }]}>
        Complete an inspection to see it here
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/inspection')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
        <Text style={[styles.emptyButtonText, { color: colors.onPrimary }]}>
          New Inspection
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Inspection History
        </Text>
        <Text style={[styles.subtitle, { color: colors.outline }]}>
          {forms.length} {forms.length === 1 ? 'report' : 'reports'}
        </Text>
      </View>

      <FlatList
        data={forms}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          forms.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
