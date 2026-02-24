import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { markSynced, deleteForm } from '../../store/slices/maintenanceSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useState } from 'react';
import { FORM_SCHEMA } from '../../lib/data/formSchema';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useMaterialYouColors();
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) =>
    state.maintenance.forms.find((f) => f.id === id)
  );
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!form) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.onSurface }]}>
            Inspection not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSync = () => {
    Alert.alert(
      'Sync Inspection',
      'Mark this inspection as synced to the server?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: () => {
            dispatch(markSynced(form.id));
            Alert.alert('Success', 'Inspection marked as synced');
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Inspection',
      'Are you sure you want to delete this inspection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteForm(form.id));
            router.back();
            Alert.alert('Deleted', 'Inspection has been deleted');
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const formData = Object.entries(form.data)
        .map(([key, value]) => {
          const field = FORM_SCHEMA.sections
            .flatMap((s) => s.fields)
            .find((f) => f.id === key);
          const label = field?.label || key;
          return `${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
        })
        .join('\n');

      await Share.share({
        message: `Inspection Report\n\nSite: ${form.siteName || 'Unknown'}\nDate: ${formatDate(
          form.timestamp
        )}\n\n${formData}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getFieldLabel = (fieldId: string): string => {
    const field = FORM_SCHEMA.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === fieldId);
    return field?.label || fieldId;
  };

  const renderFieldValue = (fieldId: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <Text style={[styles.fieldValue, { color: colors.outline }]}>Not provided</Text>;
    }

    if (Array.isArray(value)) {
      return (
        <View style={styles.chipContainer}>
          {value.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: `${colors.primary}14` }]}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (typeof value === 'string' && value.startsWith('file://')) {
      return null; // Images are handled separately
    }

    return <Text style={[styles.fieldValue, { color: colors.onSurface }]}>{String(value)}</Text>;
  };

  const images = Object.entries(form.images);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Inspection Details
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <AnimatedView
          entering={FadeInUp.duration(400)}
          style={[styles.statusCard, { backgroundColor: colors.surfaceContainer }]}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <MaterialCommunityIcons
                name="clipboard-text"
                size={32}
                color={colors.primary}
                style={styles.statusIcon}
              />
              <View>
                <Text style={[styles.statusTitle, { color: colors.onSurface }]}>
                  {form.siteName || 'Inspection Report'}
                </Text>
                <Text style={[styles.statusSubtitle, { color: colors.outline }]}>
                  {formatDate(form.timestamp)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: form.synced
                    ? `${colors.primary}14`
                    : `${colors.error}14`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={form.synced ? 'cloud-check' : 'cloud-upload'}
                size={18}
                color={form.synced ? colors.primary : colors.error}
                style={styles.badgeIcon}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: form.synced ? colors.primary : colors.error },
                ]}
              >
                {form.synced ? 'Synced' : 'Pending Sync'}
              </Text>
            </View>
          </View>
        </AnimatedView>

        {/* Images Section */}
        {images.length > 0 && (
          <AnimatedView
            entering={FadeInUp.duration(400).delay(100)}
            style={[styles.section, { backgroundColor: colors.surfaceContainer }]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="camera" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Captured Images
              </Text>
            </View>
            <View style={styles.imageGrid}>
              {images.map(([fieldId, uri], index) => (
                <TouchableOpacity
                  key={fieldId}
                  style={styles.imageContainer}
                  onPress={() => setExpandedImage(uri)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri }} style={styles.image} />
                  <View style={[styles.imageOverlay, { backgroundColor: colors.scrim }]}>
                    <MaterialCommunityIcons name="magnify" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedView>
        )}

        {/* Form Data Section */}
        {FORM_SCHEMA.sections.map((section, sectionIndex) => {
          const sectionFields = section.fields.filter(
            (field) => form.data[field.id] !== undefined && field.type !== 'file'
          );

          if (sectionFields.length === 0) return null;

          return (
            <AnimatedView
              key={section.id}
              entering={FadeInUp.duration(400).delay(200 + sectionIndex * 100)}
              style={[styles.section, { backgroundColor: colors.surfaceContainer }]}
            >
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="clipboard-list-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  {section.title}
                </Text>
              </View>
              {sectionFields.map((field) => (
                <View key={field.id} style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                    {field.label}
                    {field.required && <Text style={{ color: colors.error }}> *</Text>}
                  </Text>
                  {renderFieldValue(field.id, form.data[field.id])}
                </View>
              ))}
            </AnimatedView>
          );
        })}

        {/* Action Buttons */}
        <AnimatedView
          entering={FadeIn.duration(600).delay(400)}
          style={styles.actionContainer}
        >
          {!form.synced && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleSync}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cloud-upload" size={20} color={colors.onPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
                Mark as Synced
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              { backgroundColor: `${colors.error}14`, borderColor: colors.error },
            ]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Delete Inspection
            </Text>
          </TouchableOpacity>
        </AnimatedView>
      </ScrollView>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <TouchableOpacity
          style={[styles.modal, { backgroundColor: colors.scrim }]}
          activeOpacity={1}
          onPress={() => setExpandedImage(null)}
        >
          <Image source={{ uri: expandedImage }} style={styles.expandedImage} />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={() => setExpandedImage(null)}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    flex: 1,
  },
  headerButton: {
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 16,
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedImage: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
