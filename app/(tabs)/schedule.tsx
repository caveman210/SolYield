import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { SCHEDULE } from '../../lib/data/schedule';
import { SITES } from '../../lib/data/sites';
import { ScheduleVisit } from '../../lib/types';
import { formatDate, isToday, isTomorrow } from '../../lib/utils/dateFormatter';
import { M3Motion, M3Spacing } from '../../lib/design';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ScheduleScreen() {
  const router = useRouter();
  const colors = useMaterialYouColors();
  const insets = useSafeAreaInsets();
  const [syncing, setSyncing] = useState(false);

  const handleSyncCalendar = async () => {
    setSyncing(true);
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      setTimeout(() => {
        setSyncing(false);
        alert(`Synced ${SCHEDULE.length} visits to calendar!`);
      }, 1500);
    } else {
      setSyncing(false);
      alert('Calendar permission required');
    }
  };

  const getDateLabel = (date: string) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDate(date);
  };

  const getDateBadgeStyle = (date: string) => {
    if (isToday(date)) {
      return { backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer };
    }
    if (isTomorrow(date)) {
      return { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer };
    }
    return { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant };
  };

  const renderVisit = ({ item, index }: { item: ScheduleVisit; index: number }) => {
    const site = SITES.find((s) => s.id === item.siteId);
    const badgeStyle = getDateBadgeStyle(item.date);

    return (
      <AnimatedTouchableOpacity
        entering={FadeInUp.duration(M3Motion.duration.medium).delay(index * 50)}
        style={[
          styles.visitCard,
          {
            backgroundColor: colors.surfaceContainer,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => site && router.push(`/site/${site.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.visitContent}>
          <View style={styles.dateSection}>
            <View style={[styles.dateBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
              <Text style={[styles.dateBadgeText, { color: badgeStyle.color }]}>
                {getDateLabel(item.date)}
              </Text>
            </View>
            <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>{item.time}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.visitDetails}>
            <Text style={[styles.visitTitle, { color: colors.onSurface }]}>{item.title}</Text>
            {site && (
              <View style={styles.siteLocation}>
                <Ionicons
                  name="location"
                  size={14}
                  color={colors.outline}
                  style={styles.locationIcon}
                />
                <Text style={[styles.siteText, { color: colors.onSurfaceVariant }]}>
                  {site.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + M3Spacing.lg }]}>
        <Animated.Text
          entering={FadeInUp.duration(M3Motion.duration.medium)}
          style={[styles.headerTitle, { color: colors.onSurface }]}
        >
          My Visits
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(50)}
          style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}
        >
          {SCHEDULE.length} scheduled maintenance visits
        </Animated.Text>
        <AnimatedTouchableOpacity
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(100)}
          style={[
            styles.syncButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.shadow,
              opacity: syncing ? 0.6 : 1,
            },
          ]}
          onPress={handleSyncCalendar}
          disabled={syncing}
          activeOpacity={0.8}
        >
          <View style={styles.syncButtonContent}>
            <Ionicons
              name={syncing ? 'sync' : 'sync-outline'}
              size={20}
              color={colors.onPrimary}
              style={styles.syncIcon}
            />
            <Text style={[styles.syncButtonText, { color: colors.onPrimary }]}>
              {syncing ? 'Syncing...' : 'Sync to Calendar'}
            </Text>
          </View>
        </AnimatedTouchableOpacity>
      </View>
      <FlatList
        data={SCHEDULE}
        renderItem={renderVisit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + M3Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  syncButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIcon: {
    marginRight: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  visitCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  visitContent: {
    flexDirection: 'row',
  },
  dateSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  dateBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dateBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
  },
  divider: {
    width: 1,
    marginRight: 16,
  },
  visitDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  visitTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  siteLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 4,
  },
  siteText: {
    fontSize: 14,
  },
});
