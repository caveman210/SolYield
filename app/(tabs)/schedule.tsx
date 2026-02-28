import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { ScheduleVisit } from '../../lib/types';
import { formatDate, isToday, isTomorrow } from '../../lib/utils/dateFormatter';
import { M3Motion, M3Spacing, M3Typography, M3Shape } from '../../lib/design';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { useScheduleManagement } from '../../lib/hooks/useScheduleManagement';
import { useSiteManagement } from '../../lib/hooks/useSiteManagement';
import StyledText from '../components/StyledText';
import M3ErrorDialog from '../components/M3ErrorDialog';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ScheduleScreen() {
  const router = useRouter();
  const colors = useMaterialYouColors();
  const insets = useSafeAreaInsets();
  const [syncing, setSyncing] = useState(false);
  const { allVisits, removeVisit, canModifyVisit } = useScheduleManagement();
  const { allSites } = useSiteManagement();
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const handleSyncCalendar = async () => {
    setSyncing(true);
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      setTimeout(() => {
        setSyncing(false);
      }, 1500);
    } else {
      setSyncing(false);
    }
  };

  const handleDeleteVisit = (visit: ScheduleVisit) => {
    const site = allSites.find((s) => s.id === visit.siteId);
    
    setDialogConfig({
      visible: true,
      title: 'Delete Visit?',
      message: `Are you sure you want to delete "${visit.title}"${site ? ` at ${site.name}` : ''}? This action cannot be undone.`,
      type: 'error',
      onConfirm: async () => {
        const success = await removeVisit(visit.id, visit.title);
        if (success) {
          setDialogConfig({
            visible: true,
            title: 'Success',
            message: 'Visit deleted successfully',
            type: 'success',
          });
        } else {
          setDialogConfig({
            visible: true,
            title: 'Error',
            message: 'Could not delete this visit. Only user-created visits can be deleted.',
            type: 'error',
          });
        }
      },
    });
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
    const site = allSites.find((s) => s.id === item.siteId);
    const badgeStyle = getDateBadgeStyle(item.date);
    const isUserCreated = canModifyVisit(item.id);

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
          <View style={styles.cardHeader}>
            <View style={styles.dateSection}>
              <View style={[styles.dateBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <StyledText style={[styles.dateBadgeText, { color: badgeStyle.color }]}>
                  {getDateLabel(item.date)}
                </StyledText>
              </View>
              <StyledText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                {item.time}
              </StyledText>
            </View>
            {isUserCreated && (
              <TouchableOpacity
                onPress={() => handleDeleteVisit(item)}
                style={[styles.deleteIconButton, { backgroundColor: colors.errorContainer }]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.visitDetails}>
            <StyledText style={[styles.visitTitle, { color: colors.onSurface }]}>
              {item.title}
            </StyledText>
            {site && (
              <View style={styles.siteLocation}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={16}
                  color={colors.outline}
                  style={styles.locationIcon}
                />
                <StyledText style={[styles.siteText, { color: colors.onSurfaceVariant }]}>
                  {site.name}
                </StyledText>
              </View>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tertiaryContainer }]}
                onPress={() => router.push('/(tabs)/inspection')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="clipboard-text"
                  size={16}
                  color={colors.onTertiaryContainer}
                />
                <StyledText
                  style={[styles.actionButtonText, { color: colors.onTertiaryContainer }]}
                >
                  Inspection
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondaryContainer }]}
                onPress={() => site && router.push(`/map-navigation?siteId=${site.id}`)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="navigation"
                  size={16}
                  color={colors.onSecondaryContainer}
                />
                <StyledText
                  style={[styles.actionButtonText, { color: colors.onSecondaryContainer }]}
                >
                  Navigate
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + M3Spacing.lg }]}>
        <StyledText
          style={[{ ...M3Typography.headline.large, color: colors.onSurface }, styles.headerTitle]}
        >
          My Visits
        </StyledText>
        <StyledText
          style={[
            { ...M3Typography.body.large, color: colors.onSurfaceVariant },
            styles.headerSubtitle,
          ]}
        >
          {allVisits.length} scheduled maintenance visit{allVisits.length !== 1 ? 's' : ''}
        </StyledText>
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
            <MaterialCommunityIcons
              name={syncing ? 'sync' : 'calendar-sync'}
              size={20}
              color={colors.onPrimary}
              style={styles.syncIcon}
            />
            <StyledText style={[styles.syncButtonText, { color: colors.onPrimary }]}>
              {syncing ? 'Syncing...' : 'Sync to Calendar'}
            </StyledText>
          </View>
        </AnimatedTouchableOpacity>
      </View>
      <FlatList
        data={allVisits}
        renderItem={renderVisit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + M3Spacing.xl + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={64}
              color={colors.onSurfaceVariant}
            />
            <StyledText
              style={[{ ...M3Typography.title.large, color: colors.onSurface }, styles.emptyTitle]}
            >
              No visits scheduled
            </StyledText>
            <StyledText
              style={[
                { ...M3Typography.body.medium, color: colors.onSurfaceVariant },
                styles.emptyText,
              ]}
            >
              Add a visit to get started
            </StyledText>
          </View>
        }
      />

      {/* Floating Action Button (FAB) */}
      <Animated.View
        entering={FadeInUp.duration(M3Motion.duration.medium).delay(200)}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primaryContainer,
            shadowColor: colors.shadow,
            bottom: insets.bottom + 80,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabTouchable}
          onPress={() => router.push('/add-visit')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </Animated.View>

      {/* Error/Info Dialog */}
      <M3ErrorDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onDismiss={() => setDialogConfig({ ...dialogConfig, visible: false })}
        onConfirm={dialogConfig.onConfirm}
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
    marginBottom: 8,
  },
  headerSubtitle: {
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
    flexDirection: 'column',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateSection: {
    alignItems: 'center',
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
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  visitDetails: {
    flex: 1,
  },
  visitTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  siteLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    marginRight: 4,
  },
  siteText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
