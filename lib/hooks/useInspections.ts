import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  submitForm,
  saveDraft,
  clearDraft,
  markSynced,
  deleteForm,
} from '../../store/slices/maintenanceSlice';
import { addActivity } from '../../store/slices/activitySlice';
import { InspectionForm } from '../types';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Custom hook for managing inspection forms
 * Provides abstraction layer between UI and Redux state
 */
export function useInspections() {
  const dispatch = useDispatch();
  const forms = useSelector((state: RootState) => state.maintenance.forms);
  const currentDraft = useSelector((state: RootState) => state.maintenance.currentDraft);
  const isSyncing = useSelector((state: RootState) => state.maintenance.isSyncing);

  /**
   * Get all inspection forms
   */
  const getAllInspections = useCallback(() => {
    return forms;
  }, [forms]);

  /**
   * Get a single inspection by ID
   */
  const getInspectionById = useCallback(
    (id: string): InspectionForm | undefined => {
      return forms.find((form) => form.id === id);
    },
    [forms]
  );

  /**
   * Get inspections for a specific site
   */
  const getInspectionsBySite = useCallback(
    (siteId: string): InspectionForm[] => {
      return forms.filter((form) => form.siteId === siteId);
    },
    [forms]
  );

  /**
   * Get pending (unsynced) inspections
   */
  const getPendingInspections = useCallback((): InspectionForm[] => {
    return forms.filter((form) => !form.synced);
  }, [forms]);

  /**
   * Submit a new inspection form
   */
  const submitInspection = useCallback(
    async (data: Record<string, any>, siteId?: string, siteName?: string) => {
      try {
        // Generate activity ID
        const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Copy images to permanent storage
        const copiedImages: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.startsWith('file://')) {
            try {
              const fileName = `inspection_${Date.now()}_${key}.jpg`;
              const cacheDir = FileSystem.Paths.cache;
              const newPath = `${cacheDir}/${fileName}`;
              await FileSystem.copyAsync({
                from: value,
                to: newPath,
              });
              copiedImages[key] = newPath;
              data[key] = newPath; // Update data with permanent path
            } catch (error) {
              console.error('Error copying image:', error);
              copiedImages[key] = value; // Fallback to original
            }
          }
        }

        // Dispatch form submission
        dispatch(
          submitForm({
            data,
            siteId,
            siteName,
            activityId,
          })
        );

        // Create activity entry
        dispatch(
          addActivity({
            type: 'inspection',
            title: 'Inspection Completed',
            description: siteName
              ? `Completed inspection at ${siteName}`
              : 'Inspection form submitted',
            siteId,
            siteName,
            icon: 'clipboard-check',
          })
        );

        // Create activity entry
        dispatch(
          addActivity({
            type: 'inspection',
            title: 'Inspection Completed',
            description: siteName
              ? `Completed inspection at ${siteName}`
              : 'Inspection form submitted',
            siteId,
            siteName,
            icon: 'clipboard-check',
          })
        );

        return { success: true, activityId };
      } catch (error) {
        console.error('Error submitting inspection:', error);
        return { success: false, error };
      }
    },
    [dispatch]
  );

  /**
   * Save draft of inspection form
   */
  const saveInspectionDraft = useCallback(
    (data: Record<string, any>) => {
      dispatch(saveDraft(data));
    },
    [dispatch]
  );

  /**
   * Clear current draft
   */
  const clearInspectionDraft = useCallback(() => {
    dispatch(clearDraft());
  }, [dispatch]);

  /**
   * Mark inspection as synced
   */
  const markInspectionSynced = useCallback(
    (inspectionId: string) => {
      dispatch(markSynced(inspectionId));

      // Also mark the related activity as synced
      const inspection = forms.find((f) => f.id === inspectionId);
      if (inspection?.activityId) {
        // Activity will be marked synced through its own hook
      }
    },
    [dispatch, forms]
  );

  /**
   * Delete an inspection
   */
  const deleteInspection = useCallback(
    async (inspectionId: string) => {
      try {
        const inspection = forms.find((f) => f.id === inspectionId);
        if (!inspection) return { success: false, error: 'Inspection not found' };

        // Delete associated images from file system
        for (const imageUri of Object.values(inspection.images)) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(imageUri);
            }
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        }

        // Remove from Redux
        dispatch(deleteForm(inspectionId));

        return { success: true };
      } catch (error) {
        console.error('Error deleting inspection:', error);
        return { success: false, error };
      }
    },
    [dispatch, forms]
  );

  /**
   * Get inspection statistics
   */
  const getInspectionStats = useCallback(() => {
    return {
      total: forms.length,
      pending: forms.filter((f) => !f.synced).length,
      synced: forms.filter((f) => f.synced).length,
      withImages: forms.filter((f) => Object.keys(f.images).length > 0).length,
    };
  }, [forms]);

  return {
    // Data
    forms,
    currentDraft,
    isSyncing,

    // Getters
    getAllInspections,
    getInspectionById,
    getInspectionsBySite,
    getPendingInspections,
    getInspectionStats,

    // Actions
    submitInspection,
    saveInspectionDraft,
    clearInspectionDraft,
    markInspectionSynced,
    deleteInspection,
  };
}

/**
 * Hook for inspection form validation
 */
export function useInspectionValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: any, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    if (field.type === 'number' && value && isNaN(Number(value))) {
      return `${field.label} must be a valid number`;
    }

    return null;
  }, []);

  const validateFormData = useCallback(
    (values: Record<string, any>, schema: any): boolean => {
      const newErrors: Record<string, string> = {};

      // Check for siteId
      if (!values.siteId) {
        newErrors.siteId = 'Site selection is required';
      }

      // Check all form fields
      schema.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          const error = validateField(field, values[field.id]);
          if (error) {
            newErrors[field.id] = error;
          }
        });
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setErrors,
    validateField,
    validateFormData,
    clearErrors,
  };
}

/**
 * Hook for image capture and management
 */
export function useImageCapture() {
  const captureImage = useCallback(
    async (options?: {
      quality?: number;
      allowsEditing?: boolean;
      aspect?: [number, number];
    }): Promise<string | null> => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          return null;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: options?.allowsEditing ?? true,
          aspect: options?.aspect ?? [4, 3],
          quality: options?.quality ?? 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          return result.assets[0].uri;
        }

        return null;
      } catch (error) {
        console.error('Camera error:', error);
        return null;
      }
    },
    []
  );

  const pickImageFromGallery = useCallback(
    async (options?: {
      quality?: number;
      allowsEditing?: boolean;
      aspect?: [number, number];
    }): Promise<string | null> => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: options?.allowsEditing ?? true,
          aspect: options?.aspect ?? [4, 3],
          quality: options?.quality ?? 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          return result.assets[0].uri;
        }

        return null;
      } catch (error) {
        console.error('Image picker error:', error);
        return null;
      }
    },
    []
  );

  return {
    captureImage,
    pickImageFromGallery,
  };
}
