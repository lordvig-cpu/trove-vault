'use client';

import { useCallback, useState } from 'react';
import { validateImageFile } from '@/lib/storage';
import { errorMessage } from '@/lib/errors';
import { fetchTemplateCatalog } from '@/lib/data/templates';
import type { AdHocAttribute } from '@/components/item-form/AdHocAttributesEditor';
import { rowValue, splitItemAttributes } from '@/lib/itemAttributes';
import type { FieldDefinition } from '@/types/field';
import type { ItemTemplate } from '@/types/template';

/* ==========================================================================
   Shared state and behavior of the Create and Edit item modals: the name, the chosen template and
   its field values, ad-hoc attributes, the photo, and submitting. The modals only decide how the
   form is initialized and what saving does.

   'create' starts every template switch from fresh defaults and stores only the values that were
   filled in. 'edit' shows everything the item holds -- the template's fields, and every other stored
   value as a custom-field row (splitItemAttributes) -- keeps it all when the template changes, and
   stores it all, so removing a custom row is what deletes a value.
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
  const [availableTemplates, setAvailableTemplates] = useState<ItemTemplate[]>([]);
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

  const loadTemplates = useCallback(async (): Promise<ItemTemplate[]> => {
    const templates = await fetchTemplateCatalog();
    setAvailableTemplates(templates);
    return templates;
  }, []);

  /**
   * Keeping the item's values across a template change: everything the item holds (field values and custom
   * rows alike) is split again for the new fields, so a custom row named like one of them fills it and a
   * value of a field the new template doesn't have becomes a custom row rather than being hidden.
   */
  const resplitValues = useCallback(
    (fields: FieldDefinition[]) => {
      const all: Record<string, unknown> = { ...dynamicValues };
      const typedRows: AdHocAttribute[] = [];
      for (const row of adHocAttributes) {
        const key = row.key.trim();
        if (key) all[key] = rowValue(row);
        else typedRows.push(row); // a row still being filled in stays as it is
      }
      const { values, rows } = splitItemAttributes(all, fields);
      for (const field of fields) if (values[field.name] === undefined) values[field.name] = defaultFieldValue(field);
      setDynamicValues(values);
      setAdHocAttributes([...rows, ...typedRows]);
    },
    [dynamicValues, adHocAttributes]
  );

  /** Make a template the active one and give its fields values. */
  const applyTemplate = useCallback(
    (template: ItemTemplate, keepValues: boolean) => {
      const fields = template.fields || [];
      setSelectedTemplateId(template.id);
      setActiveTemplateFields(fields);
      if (keepValues) {
        resplitValues(fields);
        return;
      }
      setDynamicValues(Object.fromEntries(fields.map((field) => [field.name, defaultFieldValue(field)])));
    },
    [resplitValues]
  );

  const clearTemplate = useCallback(
    (keepValues: boolean) => {
      setSelectedTemplateId(null);
      setActiveTemplateFields([]);
      if (keepValues) resplitValues([]);
      else setDynamicValues({});
    },
    [resplitValues]
  );

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
      if (key) attributes[key] = rowValue(attribute);
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
    setAdHocAttributes,
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
