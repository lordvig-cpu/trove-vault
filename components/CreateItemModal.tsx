'use client';

import { useEffect } from 'react';
import { createItem } from '@/lib/data/items';
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

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: () => void;
  collectionId: number | null;
  availableParents: ItemRecord[];
  initialParentId?: number | null;
}

function flattenItems(items: ItemRecord[], depth = 0): { id: number; label: string }[] {
  const result: { id: number; label: string }[] = [];
  for (const item of items) {
    result.push({ id: item.id, label: `${'— '.repeat(depth)}${item.name}` });
    if (item.children && item.children.length > 0) {
      result.push(...flattenItems(item.children, depth + 1));
    }
  }
  return result;
}

/* ==========================================================================
   2. MAIN COMPONENT: CreateItemModal
   Handles item instantiation under curated collections, dynamic taxonomy
   categories, or as standalone root items with optional schema templates.
   ========================================================================== */

export default function CreateItemModal({
  isOpen,
  onClose,
  onItemCreated,
  collectionId,
  availableParents,
  initialParentId = null,
}: CreateItemModalProps) {
  const form = useItemForm('create');
  const { loadTemplates, applyTemplate } = form;

  /* ------------------------------------------------------------------------
     2.1 TEMPLATE FETCHING & AUTO-MATCHING
     Auto-detects template matching the category context (negative IDs) or
     inherits template from a parent item record.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    async function loadTemplatesAndFields() {
      if (!isOpen) return;

      const fullTemplates = await loadTemplates();
      if (fullTemplates.length === 0) return;

      // 1. Check if launched from a dynamic virtual category (negative ID, e.g. -2 for Comics)
      let targetTemplate: CollectionTemplate | undefined;
      if (collectionId !== null && collectionId < 0) {
        const targetId = Math.abs(collectionId);
        targetTemplate = fullTemplates.find((t) => t.id === targetId);
      }

      // 2. Check if launched as a sub-item, inheriting from parent if available
      if (!targetTemplate && initialParentId && availableParents) {
        const parentRecord = availableParents.find((p) => p.id === initialParentId);
        if (parentRecord?.template_id) {
          targetTemplate = fullTemplates.find((t) => t.id === parentRecord.template_id);
        }
      }

      // 3. Fallback to the first available template
      applyTemplate(targetTemplate || fullTemplates[0], false);
    }

    loadTemplatesAndFields();
  }, [isOpen, collectionId, initialParentId, availableParents, loadTemplates, applyTemplate]);

  if (!isOpen) return null;

  /* ------------------------------------------------------------------------
     2.2 FORM SUBMISSION
     ------------------------------------------------------------------------ */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    await form.submit(async () => {
      await createItem({
        name: form.name.trim(),
        templateId: form.selectedTemplateId,
        parentId: initialParentId,
        collectionId,
        attributes: form.buildAttributes(),
        imageFile: form.selectedFile,
      });
      form.resetForm();
      onItemCreated();
      onClose();
    }, 'Failed to create item');
  };

  const flatItemList = flattenItems(availableParents);
  const isStandalone = collectionId === null || collectionId < 0;

  /* ------------------------------------------------------------------------
     2.3 RENDER
     ------------------------------------------------------------------------ */
  return (
    <ItemModalShell
      title={initialParentId ? 'Add Sub-Item' : isStandalone ? 'Create Standalone Item' : 'Create New Item'}
      subtitle={
        initialParentId
          ? `Adding child directly under Parent #${initialParentId}`
          : isStandalone
          ? 'Creating an independent item outside of any collection'
          : 'Add a new record to the collection'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={form.submitting}
      submitLabel="Create Item"
      submittingLabel="Creating..."
      error={form.error}
    >
      <ItemTemplatePicker
        templates={form.availableTemplates}
        selectedTemplateId={form.selectedTemplateId}
        onSelect={form.selectTemplate}
        fieldCount={form.activeTemplateFields.length}
        fieldCountLabel="Template Fields"
        filled={form.diffSummary.filled}
        empty={form.diffSummary.empty}
        filledLabel="FILLED"
        emptyLabel="AVAILABLE"
      />

      {/* Item Name */}
      <div className="space-y-1">
        <label className="text-xs font-semibold item-modal-label">Item Name *</label>
        <input
          type="text"
          required
          placeholder="e.g. The Amazing Spider-Man #300..."
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          className="w-full item-modal-input rounded-lg px-3 py-2 text-xs transition"
        />
      </div>

      {/* Parent Item Selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold ui-secondary">Parent Item</label>
          {initialParentId ? (
            <span className="item-modal-template-heading text-[10px] font-mono px-1.5 py-0.5 rounded">
              Locked to Parent
            </span>
          ) : (
            <span className="item-modal-root-badge text-[10px] font-mono px-1.5 py-0.5 rounded">
              Root Item
            </span>
          )}
        </div>

        <select
          value={initialParentId ?? ''}
          disabled={true}
          className="w-full item-modal-parent-select rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
        >
          {initialParentId ? (
            flatItemList
              .filter((it) => it.id === initialParentId)
              .map((it) => (
                <option key={it.id} value={it.id}>
                  {it.label}
                </option>
              ))
          ) : (
            <option value="">None (Top-Level Root Item)</option>
          )}
        </select>
      </div>

      {/* Photo Upload Box */}
      <ItemImagePicker
        imageUrl={form.previewUrl}
        onFileChange={form.chooseFile}
        onRemove={form.removeImage}
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
        placeholders={{ key: 'Key (e.g. signature)', value: 'Value (e.g. Stan Lee)' }}
      />
    </ItemModalShell>
  );
}
