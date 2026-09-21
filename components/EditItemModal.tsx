'use client';

import { useEffect } from 'react';
import { updateItem } from '@/lib/data/items';
import { useItemForm } from '@/hooks/useItemForm';
import { ItemRecord } from '@/types/item';
import { CollectionTemplate } from '@/types/template';
import AdHocAttributesEditor from '@/components/item-form/AdHocAttributesEditor';
import ItemImagePicker from '@/components/item-form/ItemImagePicker';
import ItemModalShell from '@/components/item-form/ItemModalShell';
import ItemTemplatePicker from '@/components/item-form/ItemTemplatePicker';
import TemplateFieldInputs from '@/components/item-form/TemplateFieldInputs';

/* ==========================================================================
   1. TYPE DEFINITIONS & PROPS
   ========================================================================== */

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
  item: ItemRecord | null;
}

/* ==========================================================================
   2. MAIN COMPONENT: EditItemModal
   Provides full modification of item names, template association, dynamic
   schema attributes, ad-hoc attributes, and photo assets.
   ========================================================================== */

export default function EditItemModal({
  isOpen,
  onClose,
  onItemUpdated,
  item,
}: EditItemModalProps) {
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

  /* ------------------------------------------------------------------------
     2.1 MODAL INITIALIZATION & ATTRIBUTE PARSING
     ------------------------------------------------------------------------ */
  useEffect(() => {
    async function initModal() {
      if (!item || !isOpen) return;

      setName(item.name || '');
      const rawAttrs = item.attributes || {};
      setExistingImageUrl(rawAttrs['image_url'] ? String(rawAttrs['image_url']) : null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);

      const fullTemplates = await loadTemplates();

      // Existing attributes, excluding the photo URL (it has its own control)
      const loadedDynamicValues: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(rawAttrs)) {
        if (key === 'image_url') continue;
        loadedDynamicValues[key] = val;
      }
      setDynamicValues(loadedDynamicValues);

      // Match template by template_id first, then fallback to attribute key match
      let matchedTemplate: CollectionTemplate | undefined;
      if (item.template_id) {
        matchedTemplate = fullTemplates.find((t) => t.id === item.template_id);
      }
      if (!matchedTemplate) {
        matchedTemplate = fullTemplates.find((tmpl) =>
          tmpl.fields?.some((f) => Object.prototype.hasOwnProperty.call(loadedDynamicValues, f.name))
        );
      }

      setSelectedTemplateId(matchedTemplate ? matchedTemplate.id : null);
      setActiveTemplateFields(matchedTemplate?.fields || []);
    }

    initModal();
  }, [
    item,
    isOpen,
    loadTemplates,
    setName,
    setDynamicValues,
    setExistingImageUrl,
    setSelectedFile,
    setPreviewUrl,
    setError,
    setSelectedTemplateId,
    setActiveTemplateFields,
  ]);

  if (!isOpen || !item) return null;

  /* ------------------------------------------------------------------------
     2.2 FORM SUBMISSION
     ------------------------------------------------------------------------ */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    await form.submit(async () => {
      await updateItem({
        id: item.id,
        name: form.name.trim(),
        templateId: form.selectedTemplateId,
        attributes: form.buildAttributes(),
        imageFile: form.selectedFile,
        existingImageUrl: form.existingImageUrl,
      });
      onItemUpdated();
      onClose();
    }, 'Failed to update item');
  };

  /* ------------------------------------------------------------------------
     2.3 RENDER
     ------------------------------------------------------------------------ */
  return (
    <ItemModalShell
      title="Edit Item"
      subtitle={`ID: #${item.id}`}
      monoSubtitle
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={form.submitting}
      submitLabel="Save Changes"
      submittingLabel="Saving Changes..."
      error={form.error}
    >
      <ItemTemplatePicker
        templates={form.availableTemplates}
        selectedTemplateId={form.selectedTemplateId}
        onSelect={form.selectTemplate}
        fieldCount={form.activeTemplateFields.length}
        fieldCountLabel="Defined Fields"
        filled={form.diffSummary.filled}
        empty={form.diffSummary.empty}
        filledLabel="PRESERVED / MERGED"
        emptyLabel="ADDED"
      />

      {/* Item Name */}
      <div className="space-y-1">
        <label className="text-xs font-semibold item-modal-label">Item Name *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          className="w-full item-modal-input rounded-lg px-3 py-2 text-xs transition"
        />
      </div>

      <ItemImagePicker
        imageUrl={form.previewUrl || form.existingImageUrl}
        onFileChange={form.chooseFile}
        onRemove={form.removeImage}
        replaceLabel="Replace Photo"
      />

      <TemplateFieldInputs
        fields={form.activeTemplateFields}
        values={form.dynamicValues}
        onChange={form.changeDynamicValue}
      />

      <AdHocAttributesEditor
        attributes={form.adHocAttributes}
        onAdd={form.addAdHocRow}
        onChange={form.changeAdHocRow}
        onRemove={form.removeAdHocRow}
      />
    </ItemModalShell>
  );
}
