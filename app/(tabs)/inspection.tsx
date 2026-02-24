import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FORM_SCHEMA } from '../../lib/data/formSchema';
import { FormField as FormFieldType } from '../../lib/types';
import { M3Motion } from '../../lib/design';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { useInspections, useInspectionValidation, useImageCapture } from '../../lib/hooks/useInspections';
import { useOfflineSync } from '../../lib/hooks/useOfflineSync';
import { useSites } from '../../lib/hooks/useSites';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function InspectionScreen() {
  const colors = useMaterialYouColors();
  const { submitInspection } = useInspections();
  const { validateFormData, errors, setErrors } = useInspectionValidation();
  const { captureImage, pickImageFromGallery } = useImageCapture();
  const { isOnline } = useOfflineSync();
  const { sites, getSiteName } = useSites();
  
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  }, [setErrors]);

  const handleCaptureImage = useCallback(async (fieldId: string) => {
    const imageUri = await captureImage();
    if (imageUri) {
      handleFieldChange(fieldId, imageUri);
    }
  }, [captureImage, handleFieldChange]);

  const handleSubmit = useCallback(async () => {
    // Validate form
    const isValid = validateFormData(formValues, FORM_SCHEMA);
    if (!isValid) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Get site ID from form (assuming there's a siteId field)
    const siteId = formValues.siteId || sites[0]?.id || 'site_01';
    const siteName = getSiteName(siteId);

    setSubmitting(true);
    try {
      // Submit inspection with all data
      await submitInspection({
        siteId,
        siteName,
        data: formValues,
      });

      // Clear form and show success
      setFormValues({});
      setSubmitting(false);
      
      Alert.alert(
        'Success', 
        `Inspection submitted successfully!${!isOnline ? ' Will sync when online.' : ''}`,
        [
          {
            text: 'View History',
            onPress: () => router.push('/history'),
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', 'Failed to submit inspection. Please try again.');
    }
  }, [formValues, validateFormData, submitInspection, sites, getSiteName, isOnline]);

  const renderField = (field: FormFieldType, sectionIndex: number, fieldIndex: number) => {
    const value = formValues[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <AnimatedView
            key={field.id}
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(
              sectionIndex * 100 + fieldIndex * 50
            )}
            style={styles.fieldContainer}
          >
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              {field.label}
              {field.required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: error ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.outline}
              value={value || ''}
              onChangeText={(text) => handleFieldChange(field.id, text)}
              keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
            />
            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
          </AnimatedView>
        );

      case 'select':
        return (
          <AnimatedView
            key={field.id}
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(
              sectionIndex * 100 + fieldIndex * 50
            )}
            style={styles.fieldContainer}
          >
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              {field.label}
              {field.required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
            </Text>
            <View style={styles.optionsRow}>
              {field.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOption,
                    {
                      backgroundColor:
                        value === option ? colors.primary : colors.surfaceContainerLow,
                      borderColor: colors.outlineVariant,
                      borderWidth: value === option ? 0 : 1,
                    },
                  ]}
                  onPress={() => handleFieldChange(field.id, option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      {
                        color: value === option ? colors.onPrimary : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
          </AnimatedView>
        );

      case 'radio':
        return (
          <AnimatedView
            key={field.id}
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(
              sectionIndex * 100 + fieldIndex * 50
            )}
            style={styles.fieldContainer}
          >
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>{field.label}</Text>
            <View style={field.display === 'Row' ? styles.optionsRow : styles.optionsColumn}>
              {field.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => handleFieldChange(field.id, option)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: value === option ? colors.primary : colors.outline,
                      },
                    ]}
                  >
                    {value === option && (
                      <View
                        style={[styles.radioCircleFilled, { backgroundColor: colors.primary }]}
                      />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: colors.onSurfaceVariant }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedView>
        );

      case 'checkbox':
        return (
          <AnimatedView
            key={field.id}
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(
              sectionIndex * 100 + fieldIndex * 50
            )}
            style={styles.fieldContainer}
          >
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>{field.label}</Text>
            <View style={field.display === 'Row' ? styles.optionsRow : styles.optionsColumn}>
              {field.options?.map((option) => {
                const checked = Array.isArray(value) && value.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.checkboxOption}
                    onPress={() => {
                      const current = Array.isArray(value) ? value : [];
                      const newValue = checked
                        ? current.filter((v) => v !== option)
                        : [...current, option];
                      handleFieldChange(field.id, newValue);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkboxSquare,
                        {
                          backgroundColor: checked ? colors.primary : 'transparent',
                          borderColor: colors.outline,
                          borderWidth: checked ? 0 : 2,
                        },
                      ]}
                    >
                      {checked && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.onSurfaceVariant }]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AnimatedView>
        );

      case 'file':
        return (
          <AnimatedView
            key={field.id}
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(
              sectionIndex * 100 + fieldIndex * 50
            )}
            style={styles.fieldContainer}
          >
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              {field.label}
              {field.required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
            </Text>
            {value ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: value }} style={styles.image} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                  onPress={() => handleFieldChange(field.id, null)}
                >
                  <Ionicons name="close" size={20} color={colors.onError} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  {
                    borderColor: colors.primary,
                    backgroundColor: `${colors.primary}14`,
                  },
                ]}
                onPress={() => handleCaptureImage(field.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="camera"
                  size={40}
                  color={colors.primary}
                  style={styles.cameraIcon}
                />
                <Text style={[styles.captureButtonText, { color: colors.primary }]}>
                  {field.uploadType === 'Capture' ? 'Capture Photo' : 'Upload File'}
                </Text>
              </TouchableOpacity>
            )}
            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
          </AnimatedView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.Text
            entering={FadeInUp.duration(M3Motion.duration.medium)}
            style={[styles.title, { color: colors.onSurface }]}
          >
            {FORM_SCHEMA.title}
          </Animated.Text>

          <AnimatedView
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(50)}
            style={[
              styles.offlineBanner,
              { backgroundColor: isOnline ? `${colors.tertiary}1A` : `${colors.primary}1A` }
            ]}
          >
            <Ionicons
              name={isOnline ? "cloud-done" : "cloud-offline"}
              size={20}
              color={isOnline ? colors.tertiary : colors.primary}
              style={styles.offlineIcon}
            />
            <Text style={[styles.offlineText, { color: isOnline ? colors.tertiary : colors.primary }]}>
              {isOnline ? 'Online - Data will sync automatically' : 'Offline Mode - Will sync when online'}
            </Text>
          </AnimatedView>

          {/* Site Selector */}
          <AnimatedView
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(100)}
            style={[
              styles.section,
              {
                backgroundColor: colors.surfaceContainer,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Site Selection
            </Text>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              Select Site <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <View style={styles.optionsRow}>
              {sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.selectOption,
                    {
                      backgroundColor:
                        formValues.siteId === site.id ? colors.primary : colors.surfaceContainerLow,
                      borderColor: colors.outlineVariant,
                      borderWidth: formValues.siteId === site.id ? 0 : 1,
                    },
                  ]}
                  onPress={() => handleFieldChange('siteId', site.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      {
                        color: formValues.siteId === site.id ? colors.onPrimary : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {site.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.siteId && <Text style={[styles.errorText, { color: colors.error }]}>{errors.siteId}</Text>}
          </AnimatedView>

          {FORM_SCHEMA.sections.map((section, sectionIndex) => (
            <AnimatedView
              key={section.id}
              entering={FadeInUp.duration(M3Motion.duration.medium).delay(sectionIndex * 100)}
              style={[
                styles.section,
                {
                  backgroundColor: colors.surfaceContainer,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {section.title}
              </Text>
              {section.fields.map((field, fieldIndex) =>
                renderField(field, sectionIndex, fieldIndex)
              )}
            </AnimatedView>
          ))}

          <AnimatedTouchableOpacity
            entering={FadeInUp.duration(M3Motion.duration.medium).delay(400)}
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.shadow,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
              {submitting ? 'Submitting...' : 'Submit Inspection'}
            </Text>
          </AnimatedTouchableOpacity>

          <Animated.Text
            entering={FadeIn.duration(M3Motion.duration.medium).delay(500)}
            style={[styles.footer, { color: colors.outline }]}
          >
            All data is stored locally and will sync when internet connection is restored
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  offlineBanner: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIcon: {
    marginRight: 8,
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 24,
    marginBottom: 24,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '400',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  required: {
    fontSize: 16,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsColumn: {
    gap: 12,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 16,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  imagePreview: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 192,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
  },
  cameraIcon: {
    marginBottom: 8,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 9999,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
  },
});
