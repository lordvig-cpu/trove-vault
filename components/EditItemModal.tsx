'use client';

import { useItemEditor } from '@/hooks/useItemEditor';
import { ItemRecord } from '@/types/item';
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
  // Loading the item into the form and saving it are shared with an item flyout's Properties tab
  const { form, save } = useItemEditor(item, isOpen);

  if (!isOpen || !item) return null;

  /* ------------------------------------------------------------------------
     2.2 FORM SUBMISSION
     ------------------------------------------------------------------------ */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await save(() => {
      onItemUpdated();
      onClose();
    });
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
