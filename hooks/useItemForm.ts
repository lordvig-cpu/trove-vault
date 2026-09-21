'use client';

import { useCallback, useMemo, useState } from 'react';
import { validateImageFile } from '@/lib/storage';
import { errorMessage } from '@/lib/errors';
import { fetchTemplateCatalog } from '@/lib/templateCatalog';
import type { AdHocAttribute } from '@/components/item-form/AdHocAttributesEditor';
import type { FieldDefinition } from '@/types/field';
import type { CollectionTemplate } from '@/types/template';

/* ==========================================================================
   Shared state and behavior of the Create and Edit item modals: the name, the chosen template and
   its field values, ad-hoc attributes, the photo, and submitting. The modals only decide how the
   form is initialized and what saving does.

   'create' starts every template switch from fresh defaults and stores only the values that were
   filled in. 'edit' keeps the item's existing values when the template changes and stores them all.
   ========================================================================== */

export type ItemFormMode = 'create' | 'edit';

function defaultFieldValue(field: FieldDefinition): unknown {
  if (field.field_type === 'boolean') return false;
  if (field.field_type === 'select' && field.options && field.options.length > 0) return field.options[0];
  return '';
}

export function useItemForm(mode: ItemFormMode) {
  const keepValuesOnTemplateChange = mode === 'edit';

  const [name, setName] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<CollectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [activeTemplateFields, setActiveTemplateFields] = useState<FieldDefinition[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});
  const [adHocAttributes, setAdHocAttributes] = useState<AdHocAttribute[]>([]);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- templates -------------------------------------------------------- */

  const loadTemplates = useCallback(async (): Promise<CollectionTemplate[]> => {
    const templates = await fetchTemplateCatalog();
    setAvailableTemplates(templates);
    return templates;
  }, []);

  /** Make a template the active one and give its fields values. */
  const applyTemplate = useCallback((template: CollectionTemplate, keepValues: boolean) => {
    const fields = template.fields || [];
    setSelectedTemplateId(template.id);
    setActiveTemplateFields(fields);
    setDynamicValues((previous) => {
      const next: Record<string, unknown> = keepValues ? { ...previous } : {};
      for (const field of fields) {
        if (keepValues && next[field.name] !== undefined) continue;
        next[field.name] = defaultFieldValue(field);
      }
      return next;
    });
  }, []);

  const clearTemplate = useCallback((keepValues: boolean) => {
    setSelectedTemplateId(null);
    setActiveTemplateFields([]);
    if (!keepValues) setDynamicValues({});
  }, []);

  /** Handler for the template dropdown ('blank' or a template id). */
  const selectTemplate = useCallback(
    (value: string) => {
      if (value === 'blank') {
        clearTemplate(keepValuesOnTemplateChange);
        return;
      }
      const match = availableTemplates.find((template) => template.id === Number(value));
      if (match) applyTemplate(match, keepValuesOnTemplateChange);
    },
    [availableTemplates, applyTemplate, clearTemplate, keepValuesOnTemplateChange]
  );

  /** Which of the template's fields already have a value and which are still empty. */
  const diffSummary = useMemo(() => {
    const filled: string[] = [];
    const empty: string[] = [];
    for (const field of activeTemplateFields) {
      const value = dynamicValues[field.name];
      if (value !== undefined && value !== '') filled.push(field.label);
      else empty.push(field.label);
    }
    return { filled, empty };
  }, [activeTemplateFields, dynamicValues]);

  const changeDynamicValue = useCallback((fieldName: string, value: unknown) => {
    setDynamicValues((previous) => ({ ...previous, [fieldName]: value }));
  }, []);

  /* ---- photo ------------------------------------------------------------ */

  const chooseFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setExistingImageUrl(null);
  }, []);

  /* ---- ad-hoc attributes ------------------------------------------------ */

  const addAdHocRow = useCallback(() => {
    setAdHocAttributes((previous) => [...previous, { key: '', value: '' }]);
  }, []);

  const changeAdHocRow = useCallback((index: number, field: 'key' | 'value', text: string) => {
    setAdHocAttributes((previous) =>
      previous.map((attribute, i) => (i === index ? { ...attribute, [field]: text } : attribute))
    );
  }, []);

  const removeAdHocRow = useCallback((index: number) => {
    setAdHocAttributes((previous) => previous.filter((_, i) => i !== index));
  }, []);

  /* ---- saving ----------------------------------------------------------- */

  /** The attributes to store: template values, then ad-hoc values (the photo URL is added on save). */
  const buildAttributes = useCallback((): Record<string, unknown> => {
    const attributes: Record<string, unknown> = {};
    if (mode === 'edit') {
      Object.assign(attributes, dynamicValues);
    } else {
      for (const field of activeTemplateFields) {
        const value = dynamicValues[field.name];
        if (value !== undefined && value !== '') attributes[field.name] = value;
      }
    }
    for (const attribute of adHocAttributes) {
      const key = attribute.key.trim();
      if (key) attributes[key] = attribute.value.trim();
    }
    return attributes;
  }, [mode, dynamicValues, activeTemplateFields, adHocAttributes]);

  /** Runs a save, tracking the busy state and turning a failure into a visible error. */
  const submit = useCallback(async (action: () => Promise<void>, failureMessage: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      console.error(failureMessage, err);
      setError(errorMessage(err, failureMessage));
    } finally {
      setSubmitting(false);
    }
  }, []);

  /** Clears everything the user typed (after a successful create). */
  const resetForm = useCallback(() => {
    setName('');
    setAdHocAttributes([]);
    setSelectedFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  return {
    name,
    setName,
    availableTemplates,
    selectedTemplateId,
    activeTemplateFields,
    dynamicValues,
    setDynamicValues,
    adHocAttributes,
    existingImageUrl,
    setExistingImageUrl,
    selectedFile,
    setSelectedFile,
    previewUrl,
    setPreviewUrl,
    submitting,
    error,
    setError,
    loadTemplates,
    applyTemplate,
    clearTemplate,
    setSelectedTemplateId,
    setActiveTemplateFields,
    selectTemplate,
    diffSummary,
    changeDynamicValue,
    chooseFile,
    removeImage,
    addAdHocRow,
    changeAdHocRow,
    removeAdHocRow,
    buildAttributes,
    submit,
    resetForm,
  };
}
