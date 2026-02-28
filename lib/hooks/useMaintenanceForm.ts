/**
 * useMaintenanceForm Hook
 * 
 * Business logic hook for managing maintenance forms with WatermelonDB.
 * Provides CRUD operations and offline-first data management.
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import MaintenanceForm from '../../database/models/MaintenanceForm';
import FormPhoto from '../../database/models/FormPhoto';
import { getMaintenanceFormsCollection, getFormPhotosCollection } from '../../database';

interface CreateFormData {
  formId: string;
  siteId: string;
  technicianName: string;
  inverterSerial?: string;
  currentGeneration?: number;
  panelCondition?: string;
  wiringIntegrity?: string;
  issuesObserved?: string[];
  sitePhotoUri?: string;
  documents?: string[];
}

/**
 * Hook for managing all maintenance forms
 */
export const useMaintenanceForms = () => {
  const database = useDatabase();
  const [forms, setForms] = useState<MaintenanceForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadForms = async () => {
      try {
        setIsLoading(true);
        const formsCollection = getMaintenanceFormsCollection();
        const allForms = await formsCollection
          .query(Q.sortBy('timestamp', Q.desc))
          .fetch();
        setForms(allForms);
      } catch (error) {
        console.error('Error loading maintenance forms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadForms();
  }, [database]);

  return { forms, isLoading };
};

/**
 * Hook for managing unsynced forms
 */
export const useUnsyncedForms = () => {
  const database = useDatabase();
  const [unsyncedForms, setUnsyncedForms] = useState<MaintenanceForm[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadUnsyncedForms = async () => {
      try {
        const formsCollection = getMaintenanceFormsCollection();
        const forms = await formsCollection
          .query(Q.where('synced', false), Q.sortBy('timestamp', Q.desc))
          .fetch();
        setUnsyncedForms(forms);
        setCount(forms.length);
      } catch (error) {
        console.error('Error loading unsynced forms:', error);
      }
    };

    loadUnsyncedForms();
  }, [database]);

  return { unsyncedForms, count, hasUnsynced: count > 0 };
};

/**
 * Hook for getting a single form by ID
 */
export const useMaintenanceForm = (formId: string | null) => {
  const database = useDatabase();
  const [form, setForm] = useState<MaintenanceForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!formId) {
      setForm(null);
      setIsLoading(false);
      return;
    }

    const loadForm = async () => {
      try {
        setIsLoading(true);
        const formsCollection = getMaintenanceFormsCollection();
        const foundForm = await formsCollection.find(formId);
        setForm(foundForm);
      } catch (error) {
        console.error('Error loading maintenance form:', error);
        setForm(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [formId, database]);

  return { form, isLoading };
};

/**
 * Hook for form CRUD operations
 */
export const useMaintenanceFormActions = () => {
  const database = useDatabase();

  /**
   * Create a new maintenance form
   */
  const createForm = useCallback(
    async (data: CreateFormData): Promise<MaintenanceForm> => {
      const formsCollection = getMaintenanceFormsCollection();

      const newForm = await database.write(async () => {
        return await formsCollection.create((form) => {
          form.formId = data.formId;
          form.siteId = data.siteId;
          form.technicianName = data.technicianName;
          form.timestamp = Date.now();
          form.completed = false;
          form.synced = false;

          // Optional fields
          if (data.inverterSerial) form.inverterSerial = data.inverterSerial;
          if (data.currentGeneration) form.currentGeneration = data.currentGeneration;
          if (data.panelCondition) form.panelCondition = data.panelCondition;
          if (data.wiringIntegrity) form.wiringIntegrity = data.wiringIntegrity;
          if (data.issuesObserved) {
            form.issuesObserved = JSON.stringify(data.issuesObserved);
          }
          if (data.sitePhotoUri) form.sitePhotoUri = data.sitePhotoUri;
          if (data.documents) {
            form.documents = JSON.stringify(data.documents);
          }
        });
      });

      console.log('Maintenance form created:', newForm.id);
      return newForm;
    },
    [database]
  );

  /**
   * Update an existing form
   */
  const updateForm = useCallback(
    async (
      form: MaintenanceForm,
      updates: Partial<CreateFormData>
    ): Promise<void> => {
      await database.write(async () => {
        await form.updateFormData(updates);
      });
      console.log('Maintenance form updated:', form.id);
    },
    [database]
  );

  /**
   * Mark form as completed
   */
  const completeForm = useCallback(
    async (form: MaintenanceForm): Promise<void> => {
      await database.write(async () => {
        await form.markAsCompleted();
      });
      console.log('Maintenance form completed:', form.id);
    },
    [database]
  );

  /**
   * Mark form as synced
   */
  const syncForm = useCallback(
    async (form: MaintenanceForm): Promise<void> => {
      await database.write(async () => {
        await form.markAsSynced();
      });
      console.log('Maintenance form synced:', form.id);
    },
    [database]
  );

  /**
   * Delete a form
   */
  const deleteForm = useCallback(
    async (form: MaintenanceForm): Promise<void> => {
      await database.write(async () => {
        await form.markAsDeleted();
      });
      console.log('Maintenance form deleted:', form.id);
    },
    [database]
  );

  /**
   * Add photo to form
   */
  const addPhotoToForm = useCallback(
    async (
      form: MaintenanceForm,
      photoUri: string,
      photoType: 'site_photo' | 'evidence' | 'issue',
      caption?: string
    ): Promise<FormPhoto> => {
      const photosCollection = getFormPhotosCollection();

      const newPhoto = await database.write(async () => {
        return await photosCollection.create((photo) => {
          photo.maintenanceFormId = form.id;
          photo.photoUri = photoUri;
          photo.photoType = photoType;
          photo.timestamp = Date.now();
          photo.synced = false;
          if (caption) photo.caption = caption;
        });
      });

      console.log('Photo added to form:', newPhoto.id);
      return newPhoto;
    },
    [database]
  );

  return {
    createForm,
    updateForm,
    completeForm,
    syncForm,
    deleteForm,
    addPhotoToForm,
  };
};

/**
 * Combined hook for all maintenance form operations
 */
export const useMaintenanceFormManager = () => {
  const { forms, isLoading } = useMaintenanceForms();
  const { unsyncedForms, count: unsyncedCount } = useUnsyncedForms();
  const actions = useMaintenanceFormActions();

  return {
    // State
    forms,
    isLoading,
    unsyncedForms,
    unsyncedCount,
    hasUnsynced: unsyncedCount > 0,

    // Actions
    ...actions,
  };
};
