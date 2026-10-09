'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { updateItem } from '@/lib/data/items';
import { useItemForm } from '@/hooks/useItemForm';
import { errorMessage } from '@/lib/errors';
import type { ItemRecord } from '@/types/item';
import type { ItemTemplate } from '@/types/template';

/* ==========================================================================
   Editing an existing item: useItemForm('edit') loaded with the item, plus whether anything has changed,
   Save and Revert. Shared by the Edit Item modal and an item flyout's Properties tab, so both load and
   save an item the same way (the save is updateItem's all-or-nothing one, photo upload included).

   The item is loaded when the editor becomes `active` (the modal opening, the Properties tab showing) --
   not before, since every Items-tree row has an editor and each load fetches the template catalog -- and
   again whenever the saved item changes (after a save, or someone else's edit), unless there are unsaved
   changes, which are never thrown away behind the user's back.
   ========================================================================== */

/** Identifies the saved state of an item, so a reload happens only when that actually changed. */
const savedKeyOf = (item: ItemRecord) => JSON.stringify([item.id, item.name, item.template_id ?? null, item.attributes ?? {}]);

export function useItemEditor(item: ItemRecord | null, active: boolean) {
  const form = useItemForm('edit');
  const {
    loadTemplates,
    setName,
    setDynamicValues,
    setExistingImageUrl,
    setSelectedFile,
    setPreviewUrl,
    setError,
    setSelectedTemplateId,
    setActiveTemplateFields,
  } = form;
  const clearAdHocRows = form.clearAdHocRows;

  // The saved item the form was last loaded from, and the form's state right after that load
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        name: form.name,
        templateId: form.selectedTemplateId,
        values: form.dynamicValues,
        adHoc: form.adHocAttributes,
        image: form.existingImageUrl,
        newPhoto: Boolean(form.selectedFile),
      }),
    [form.name, form.selectedTemplateId, form.dynamicValues, form.adHocAttributes, form.existingImageUrl, form.selectedFile]
  );
  const isLoaded = loadedKey !== null && baseline !== null;
  const isDirty = isLoaded && snapshot !== baseline;

  /** Fills the form from `item` (its name, template, attribute values and photo), given the template catalog. */
  const applyItem = useCallback((fullTemplates: ItemTemplate[]) => {
    if (!item) return;
    const name = item.name || '';
    const rawAttrs = item.attributes || {};
    const imageUrl = rawAttrs['image_url'] ? String(rawAttrs['image_url']) : null;
    setName(name);
    setExistingImageUrl(imageUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    clearAdHocRows();

    // Existing attributes, excluding the photo URL (it has its own control)
    const values: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawAttrs)) {
      if (key === 'image_url') continue;
      values[key] = val;
    }
    setDynamicValues(values);

    // Match template by template_id first, then fallback to attribute key match
    let matchedTemplate: ItemTemplate | undefined;
    if (item.template_id) matchedTemplate = fullTemplates.find((t) => t.id === item.template_id);
    if (!matchedTemplate) {
      matchedTemplate = fullTemplates.find((tmpl) =>
        tmpl.fields?.some((f) => Object.prototype.hasOwnProperty.call(values, f.name))
      );
    }
    const templateId = matchedTemplate ? matchedTemplate.id : null;
    setSelectedTemplateId(templateId);
    setActiveTemplateFields(matchedTemplate?.fields || []);

    setBaseline(JSON.stringify({ name, templateId, values, adHoc: [], image: imageUrl, newPhoto: false }));
    setLoadedKey(savedKeyOf(item));
  }, [
    item,
    setName,
    setDynamicValues,
    setExistingImageUrl,
    setSelectedFile,
    setPreviewUrl,
    setError,
    setSelectedTemplateId,
    setActiveTemplateFields,
    clearAdHocRows,
  ]);

  const itemKey = item ? savedKeyOf(item) : null;
  useEffect(() => {
    if (!active || !itemKey || itemKey === loadedKey || isDirty) return;
    // Fetch the template catalog, then fill the form once it arrives (unless this load was superseded)
    let cancelled = false;
    loadTemplates()
      .then((templates) => {
        if (!cancelled) applyItem(templates);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load the item templates'));
      });
    return () => {
      cancelled = true;
    };
  }, [active, itemKey, loadedKey, isDirty, loadTemplates, applyItem, setError]);

  /** Saves every change in one go; `onSaved` runs after a successful save (e.g. to refresh the data). */
  const save = useCallback(
    async (onSaved?: () => void) => {
      if (!item || !form.name.trim()) return;
      await form.submit(async () => {
        await updateItem({
          id: item.id,
          name: form.name.trim(),
          templateId: form.selectedTemplateId,
          attributes: form.buildAttributes(),
          imageFile: form.selectedFile,
          existingImageUrl: form.existingImageUrl,
          previousImageUrl: typeof item.attributes?.image_url === 'string' ? item.attributes.image_url : null,
        });
        // What was just saved is the new baseline, so the form reads as unchanged and reloads (to pick up
        // the stored photo URL, say) once the refreshed item arrives
        setBaseline(snapshot);
        onSaved?.();
      }, 'Failed to update item');
    },
    [item, form, snapshot]
  );

  /** Discards unsaved changes, back to the item as saved. */
  const revert = useCallback(() => {
    loadTemplates()
      .then(applyItem)
      .catch((err) => setError(errorMessage(err, 'Could not load the item templates')));
  }, [loadTemplates, applyItem, setError]);

  return { form, isLoaded, isDirty, save, revert };
}
