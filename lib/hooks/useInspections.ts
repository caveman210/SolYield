import { useCallback, useState } from 'react';
import {
  useMaintenanceForms,
  useUnsyncedForms,
  useMaintenanceFormActions,
  useMaintenanceForm,
} from './useMaintenanceForm';
import { InspectionForm } from '../types';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Custom hook for managing inspection forms
 * Provides abstraction layer between UI and WatermelonDB state
 */
export function useInspections() {
  const { forms, isLoading } = useMaintenanceForms();
  const { unsyncedForms } = useUnsyncedForms();
  const actions = useMaintenanceFormActions();

  // Convert MaintenanceForm[] to InspectionForm[] for compatibility
  const convertToInspectionForm = useCallback(
    (form: any): InspectionForm => ({
      id: form.id,
      timestamp: form.timestamp,
      synced: form.synced,
      siteId: form.siteId,
      siteName: form.siteName,
      data: {
        inverterSerial: form.inverterSerial,
        currentGeneration: form.currentGeneration,
        panelCondition: form.panelCondition,
        wiringIntegrity: form.wiringIntegrity,
        issuesObserved: form.issuesObservedArray,
        documents: form.documentsArray,
      },
      images: {
        sitePhoto: form.sitePhotoUri || '',
      },
      activityId: form.activityId,
    }),
    []
  );

  const inspectionForms = forms.map(convertToInspectionForm);
  const unsyncedInspectionForms = unsyncedForms.map(convertToInspectionForm);

  /**
   * Get all inspection forms
   */
  const getAllInspections = useCallback(() => {
    return inspectionForms;
  }, [inspectionForms]);

  /**
   * Get a single inspection by ID
   */
  const getInspectionById = useCallback(
    (id: string): InspectionForm | undefined => {
      return inspectionForms.find((form) => form.id === id);
    },
    [inspectionForms]
  );

  /**
   * Get inspections for a specific site
   */
  const getInspectionsBySite = useCallback(
    (siteId: string): InspectionForm[] => {
      return inspectionForms.filter((form) => form.siteId === siteId);
    },
    [inspectionForms]
  );

  /**
   * Get pending (unsynced) inspections
   */
  const getPendingInspections = useCallback((): InspectionForm[] => {
    return unsyncedInspectionForms;
  }, [unsyncedInspectionForms]);

  /**
   * Submit a new inspection form
   */
  const submitInspection = useCallback(
    async (data: Record<string, any>, siteId?: string, siteName?: string) => {
      try {
        if (!siteId) {
          return { success: false, error: 'Site ID is required' };
        }

        // Generate unique form ID
        const formId = `inspection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Copy images to permanent storage if needed
        const sitePhotoUri = data.sitePhotoUri || data.sitePhoto;

        // Create form using WatermelonDB
        const newForm = await actions.createForm({
          formId,
          siteId,
          technicianName: 'Current User', // TODO: Get from auth
          inverterSerial: data.inverterSerial,
          currentGeneration: data.currentGeneration,
          panelCondition: data.panelCondition,
          wiringIntegrity: data.wiringIntegrity,
          issuesObserved: data.issuesObserved,
          sitePhotoUri,
          documents: data.documents,
          images: data.images,
          activityId: formId, // Use formId as activityId for now
        });

        // Mark as completed and synced
        await actions.completeForm(newForm);
        await actions.syncForm(newForm);

        // TODO: Create activity entry if needed

        return { success: true, activityId: formId };
      } catch (error) {
        console.error('Error submitting inspection:', error);
        return { success: false, error };
      }
    },
    [actions]
  );

  /**
   * Save draft of inspection form (not implemented in WatermelonDB yet)
   */
  const saveInspectionDraft = useCallback((data: Record<string, any>) => {
    // TODO: Implement draft saving in WatermelonDB
    console.log('Draft saving not implemented yet:', data);
  }, []);

  /**
   * Clear current draft
   */
  const clearInspectionDraft = useCallback(() => {
    // TODO: Implement draft clearing
    console.log('Draft clearing not implemented yet');
  }, []);

  /**
   * Mark inspection as synced
   */
  const markInspectionSynced = useCallback(
    async (inspectionId: string) => {
      try {
        const { form } = useMaintenanceForm(inspectionId);
        if (form) {
          await actions.syncForm(form);
        }
      } catch (error) {
        console.error('Error marking inspection as synced:', error);
      }
    },
    [actions]
  );

  /**
   * Delete an inspection
   */
  const deleteInspection = useCallback(
    async (inspectionId: string) => {
      try {
        const { form } = useMaintenanceForm(inspectionId);
        if (form) {
          await actions.deleteForm(form);
        }
        return { success: true };
      } catch (error) {
        console.error('Error deleting inspection:', error);
        return { success: false, error };
      }
    },
    [actions]
  );

  /**
   * Get inspection statistics
   */
  const getInspectionStats = useCallback(() => {
    return {
      total: inspectionForms.length,
      pending: unsyncedInspectionForms.length,
      synced: inspectionForms.length - unsyncedInspectionForms.length,
      withImages: inspectionForms.filter((f) => f.images.sitePhoto).length,
    };
  }, [inspectionForms, unsyncedInspectionForms]);

  return {
    // Data
    forms: inspectionForms,
    currentDraft: null, // TODO: Implement draft functionality
    isSyncing: isLoading,

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
