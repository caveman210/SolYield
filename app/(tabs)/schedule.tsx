import React, { useCallback, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import M3ConfirmDialog from '../components/M3ConfirmDialog';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ScheduleScreen() {
  const router = useRouter();
  const colors = useMaterialYouColors();
  const insets = useSafeAreaInsets();
  const [syncing, setSyncing] = useState(false);

  const { allVisits, removeVisit, canModifyVisit, checkInVisit, completeVisit, archiveVisit } =
    useScheduleManagement();
  const { allSites } = useSiteManagement();

  const [archiveReason, setArchiveReason] = useState('');
  const [visitToArchive, setVisitToArchive] = useState<ScheduleVisit | null>(null);

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'info' });

  const handleSyncCalendar = async () => {
    setSyncing(true);
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') setTimeout(() => setSyncing(false), 1500);
    else setSyncing(false);
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
        if (success)
          setDialogConfig({
            visible: true,
            title: 'Success',
            message: 'Visit deleted successfully',
            type: 'success',
          });
        else
          setDialogConfig({
            visible: true,
            title: 'Error',
            message: 'Could not delete this visit.',
            type: 'error',
          });
      },
    });
  };

  const handleArchiveSubmit = async () => {
    if (!visitToArchive) return;
    if (!archiveReason.trim()) {
      setDialogConfig({
        visible: true,
        title: 'Reason Required',
        message: 'You must provide a reason for archiving this visit.',
        type: 'warning',
      });
      return;
    }
    const success = await archiveVisit(visitToArchive.id, archiveReason);
    if (success) {
      setVisitToArchive(null);
      setArchiveReason('');
      setDialogConfig({
        visible: true,
        title: 'Archived',
        message: 'Visit has been successfully archived.',
        type: 'success',
      });
    }
  };

  const getDateLabel = (date: string) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDate(date);
  };

  const getDateBadgeStyle = (date: string) => {
    if (isToday(date))
      return { backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer };
    if (isTomorrow(date))
      return { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer };
    return { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant };
  };

  const renderVisit = useCallback(
    ({ item, index }: { item: ScheduleVisit; index: number }) => {
      const site = allSites.find((s) => s.id === item.siteId);
      const badgeStyle = getDateBadgeStyle(item.date);
      const status = item.status || 'pending';

      return (
        <Animated.View
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(index * 50)}
          style={[
            styles.visitCard,
            { backgroundColor: colors.surfaceContainer, shadowColor: colors.shadow },
          ]}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        status === 'completed' ? colors.primaryContainer : colors.surfaceVariant,
                    },
                  ]}
                >
                  <StyledText
                    style={{
                      color: status === 'completed' ? colors.primary : colors.onSurfaceVariant,
                      fontSize: 12,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {status.replace('-', ' ')}
                  </StyledText>
                </View>
                {canModifyVisit(item.id) && (
                  <TouchableOpacity
                    onPress={() => handleDeleteVisit(item)}
                    style={[styles.deleteIconButton, { backgroundColor: colors.errorContainer }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.visitDetails}>
              <StyledText style={[styles.visitTitle, { color: colors.onSurface }]}>
                {item.title} {item.isRequiem ? '(Other Reason)' : ''}
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

              {/* STATUS PROGRESSION ACTIONS */}
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.outlineVariant, marginTop: 12, marginBottom: 12 },
                ]}
              />
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.statusActionButton, { backgroundColor: colors.primary }]}
                    onPress={() => checkInVisit(item.id)}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-check"
                      size={18}
                      color={colors.onPrimary}
                    />
                    <StyledText style={[styles.statusActionText, { color: colors.onPrimary }]}>
                      Check-in
                    </StyledText>
                  </TouchableOpacity>
                )}
                {status === 'in-progress' && (
                  <TouchableOpacity
                    style={[styles.statusActionButton, { backgroundColor: colors.secondary }]}
                    onPress={() => completeVisit(item.id)}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={18}
                      color={colors.onSecondary}
                    />
                    <StyledText style={[styles.statusActionText, { color: colors.onSecondary }]}>
                      Complete Work
                    </StyledText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.statusActionButton,
                    {
                      backgroundColor: colors.surfaceContainerHighest,
                      borderWidth: 1,
                      borderColor: colors.outline,
                    },
                  ]}
                  onPress={() => {
                    setVisitToArchive(item);
                    setArchiveReason('');
                  }}
                >
                  <MaterialCommunityIcons
                    name="archive-outline"
                    size={18}
                    color={colors.onSurface}
                  />
                  <StyledText style={[styles.statusActionText, { color: colors.onSurface }]}>
                    Archive
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    },
    [
      allSites,
      colors,
      router,
      canModifyVisit,
      handleDeleteVisit,
      checkInVisit,
      completeVisit,
      styles,
    ]
  );

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
        // --- Aggressive FlatList Optimizations ---
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        // -----------------------------------------

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

      <M3ConfirmDialog
        visible={!!visitToArchive}
        title="Archive Visit"
        message={`Please provide a reason for archiving "${visitToArchive?.title}".`}
        icon="archive"
        iconColor={colors.primary}
        onDismiss={() => setVisitToArchive(null)}
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setVisitToArchive(null) },
          {
            text: 'Archive',
            style: 'default',
            onPress: handleArchiveSubmit,
            disabled: !archiveReason.trim(),
          },
        ]}
      >
        <TextInput
          style={[
            styles.reasonInput,
            {
              backgroundColor: colors.surface,
              color: colors.onSurface,
              borderColor: colors.outline,
            },
          ]}
          placeholder="e.g. Work fully complete, postponed..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={archiveReason}
          onChangeText={setArchiveReason}
          multiline
        />
      </M3ConfirmDialog>

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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  headerTitle: { marginBottom: 8 },
  headerSubtitle: { marginBottom: 16 },
  syncButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  syncButtonContent: { flexDirection: 'row', alignItems: 'center' },
  syncIcon: { marginRight: 8 },
  syncButtonText: { fontSize: 14, fontWeight: '500' },
  listContent: { padding: 20, paddingTop: 8 },
  visitCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  visitContent: { flexDirection: 'column' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateSection: { alignItems: 'center', minWidth: 80 },
  dateBadge: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 8 },
  dateBadgeText: { fontSize: 14, fontWeight: '500' },
  timeText: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginBottom: 12 },
  visitDetails: { flex: 1 },
  visitTitle: { fontSize: 16, marginBottom: 8, fontWeight: '600' },
  siteLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locationIcon: { marginRight: 4 },
  siteText: { fontSize: 14 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: { fontSize: 12, fontWeight: '500' },
  statusActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: '45%',
  },
  statusActionText: { fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyTitle: { marginTop: 16, marginBottom: 8 },
  emptyText: { textAlign: 'center' },
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
  fabTouchable: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 12,
  },
});
