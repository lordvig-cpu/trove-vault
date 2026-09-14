'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadItemImage } from '@/lib/storage';
import { fetchTemplateCatalog } from '@/lib/templateCatalog';
import { ItemRecord } from '@/types/item';
import { FieldDefinition } from '@/types/field';
import { CollectionTemplate } from '@/types/template';
import AdHocAttributesEditor from '@/components/item-form/AdHocAttributesEditor';
import ItemImagePicker from '@/components/item-form/ItemImagePicker';
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
  /* ------------------------------------------------------------------------
     2.1 LOCAL STATE & TEMPLATES
     ------------------------------------------------------------------------ */
  const [name, setName] = useState('');
    const parentId = initialParentId;
  const [availableTemplates, setAvailableTemplates] = useState<CollectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Dynamic values & ad-hoc custom fields
  const [activeTemplateFields, setActiveTemplateFields] = useState<FieldDefinition[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [adHocAttributes, setAdHocAttributes] = useState<{ key: string; value: string }[]>([]);

  // Media & state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------
     2.2 TEMPLATE FETCHING & AUTO-MATCHING
     Auto-detects template matching the category context (negative IDs) or
     inherits template from a parent item record.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    async function loadTemplatesAndFields() {
      if (!isOpen) return;

      const fullTemplates = await fetchTemplateCatalog();

      setAvailableTemplates(fullTemplates);

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
      const resolvedTemplate = targetTemplate || fullTemplates[0];
      applyTemplateFields(resolvedTemplate);
    }

    loadTemplatesAndFields();
  }, [isOpen, collectionId, initialParentId, availableParents]);

  // Isolate dynamic values strictly to the selected template
  const applyTemplateFields = (template: CollectionTemplate) => {
    setSelectedTemplateId(template.id);
    const fields = template.fields || [];
    setActiveTemplateFields(fields);

    const initialValues: Record<string, any> = {};
    for (const f of fields) {
      if (f.field_type === 'boolean') initialValues[f.name] = false;
      else if (f.field_type === 'select' && f.options && f.options.length > 0)
        initialValues[f.name] = f.options[0];
      else initialValues[f.name] = '';
    }
    setDynamicValues(initialValues);
  };

  const handleTemplateSelect = (tmplId: number | 'blank') => {
    if (tmplId === 'blank') {
      setSelectedTemplateId(null);
      setActiveTemplateFields([]);
      setDynamicValues({});
      return;
    }

    const match = availableTemplates.find((t) => t.id === Number(tmplId));
    if (match) applyTemplateFields(match);
  };

  /* ------------------------------------------------------------------------
     2.3 DIFF CALCULATION
     ------------------------------------------------------------------------ */
  const diffSummary = useMemo(() => {
    const added: string[] = [];
    const merged: string[] = [];

    for (const f of activeTemplateFields) {
      if (dynamicValues[f.name] !== undefined && dynamicValues[f.name] !== '') {
        merged.push(f.label);
      } else {
        added.push(f.label);
      }
    }

    return { added, merged };
  }, [activeTemplateFields, dynamicValues]);

  if (!isOpen) return null;

  /* ------------------------------------------------------------------------
     2.4 FILE & AD-HOC FIELD HANDLERS
     ------------------------------------------------------------------------ */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleAddAdHocRow = () => {
    setAdHocAttributes([...adHocAttributes, { key: '', value: '' }]);
  };

  const handleAdHocChange = (index: number, field: 'key' | 'value', text: string) => {
    const updated = [...adHocAttributes];
    updated[index][field] = text;
    setAdHocAttributes(updated);
  };

  const handleRemoveAdHocRow = (index: number) => {
    setAdHocAttributes(adHocAttributes.filter((_, i) => i !== index));
  };

  /* ------------------------------------------------------------------------
     2.5 FORM SUBMISSION
     ------------------------------------------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let imageUrl: string | null = null;
      if (selectedFile) {
        imageUrl = await uploadItemImage(selectedFile);
      }

      // 1. Only include active template fields that have values
      const jsonAttributes: Record<string, any> = {};

      for (const field of activeTemplateFields) {
        const val = dynamicValues[field.name];
        if (val !== undefined && val !== '') {
          jsonAttributes[field.name] = val;
        }
      }

      // 2. Attach image URL if present
      if (imageUrl) {
        jsonAttributes['image_url'] = imageUrl;
      }

      // 3. Attach ad-hoc custom fields
      for (const attr of adHocAttributes) {
        if (attr.key.trim()) {
          jsonAttributes[attr.key.trim()] = attr.value.trim();
        }
      }

      const effectiveParentId = initialParentId !== null ? initialParentId : parentId;
      // Virtual category nodes use negative IDs (e.g., -2), which must sanitize to null for PostgreSQL
      const effectiveCollectionId = collectionId && collectionId > 0 ? collectionId : null;

      const { error: insertError } = await supabase.from('items').insert({
        collection_id: effectiveCollectionId,
        template_id: selectedTemplateId || null,
        parent_id: effectiveParentId || null,
        name: name.trim(),
        attributes: jsonAttributes,
      });

      if (insertError) throw insertError;

      // Reset form state
      setName('');
      setAdHocAttributes([]);
      setSelectedFile(null);
      setPreviewUrl(null);
      onItemCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create item in items table:', err);
      setError(err?.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const flattenItems = (items: ItemRecord[], depth = 0): { id: number; label: string }[] => {
    let result: { id: number; label: string }[] = [];
    for (const item of items) {
      result.push({
        id: item.id,
        label: `${'— '.repeat(depth)}${item.name}`,
      });
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenItems(item.children, depth + 1));
      }
    }
    return result;
  };

  const flatItemList = flattenItems(availableParents);

  const handleDynamicValueChange = (fieldName: string, value: unknown) => {
    setDynamicValues((previous) => ({ ...previous, [fieldName]: value }));
  };

  /* ------------------------------------------------------------------------
     2.6 RENDER
     ------------------------------------------------------------------------ */
  return (
    <div className="fixed inset-0 z-50 item-modal-backdrop flex items-center justify-center p-4">
      <div className="item-modal-dialog rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="item-modal-header flex items-center justify-between p-5 shrink-0">
          <div>
            <h2 className="text-base font-bold item-modal-primary-text">
              {initialParentId
                ? 'Add Sub-Item'
                : collectionId === null || collectionId < 0
                ? 'Create Standalone Item'
                : 'Create New Item'}
            </h2>
            <p className="text-xs item-modal-muted">
              {initialParentId
                ? `Adding child directly under Parent #${initialParentId}`
                : collectionId === null || collectionId < 0
                ? 'Creating an independent item outside of any collection'
                : 'Add a new record to the collection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="item-modal-error p-3 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Item Template Picker */}
          <div className="item-modal-template-panel rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold item-modal-template-heading flex items-center gap-1.5">
                <span>📑</span>
                <span>Item Schema Template</span>
              </label>
              <span className="text-[10px] item-modal-template-count font-mono">
                {activeTemplateFields.length} Template Fields
              </span>
            </div>

            <select
              value={selectedTemplateId || 'blank'}
              onChange={(e) => handleTemplateSelect(e.target.value as any)}
              className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
            >
              {availableTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.icon} {tmpl.name} ({tmpl.fields?.length || 0} fields)
                </option>
              ))}
              <option value="blank">➕ Blank / Custom (No Template)</option>
            </select>

            {/* Schema Diff Visualizer */}
            {activeTemplateFields.length > 0 && (
              <div className="pt-1 text-[11px] space-y-1 item-modal-muted">
                {diffSummary.merged.length > 0 && (
                  <div className="flex items-center gap-1.5 item-modal-template-heading">
                    <span className="font-mono text-[10px] px-1 py-0.2 rounded">
                      🔵 FILLED ({diffSummary.merged.length})
                    </span>
                    <span className="truncate">{diffSummary.merged.join(', ')}</span>
                  </div>
                )}
                {diffSummary.added.length > 0 && (
                  <div className="flex items-center gap-1.5 item-modal-template-heading">
                    <span className="font-mono text-[10px] px-1 py-0.2 rounded">
                      🟢 AVAILABLE ({diffSummary.added.length})
                    </span>
                    <span className="truncate">{diffSummary.added.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold item-modal-label">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. The Amazing Spider-Man #300..."
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={parentId ?? ''}
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
            imageUrl={previewUrl}
            onFileChange={handleFileChange}
            onRemove={handleRemoveImage}
          />

          <TemplateFieldInputs
            fields={activeTemplateFields}
            values={dynamicValues}
            onChange={handleDynamicValueChange}
          />

          <AdHocAttributesEditor
            attributes={adHocAttributes}
            onAdd={handleAddAdHocRow}
            onChange={handleAdHocChange}
            onRemove={handleRemoveAdHocRow}
            placeholders={{ key: 'Key (e.g. signature)', value: 'Value (e.g. Stan Lee)' }}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 item-modal-property-divider">
            <button
              type="button"
              onClick={onClose}
              className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="item-modal-primary-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}