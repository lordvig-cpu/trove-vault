'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadItemImage } from '@/lib/storage';
import { ItemRecord } from '@/types/item';
import { FieldDefinition } from '@/types/field';
import { CollectionTemplate } from '@/types/template';
import AdHocAttributesEditor from '@/components/item-form/AdHocAttributesEditor';
import ItemImagePicker from '@/components/item-form/ItemImagePicker';
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
  const [name, setName] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<CollectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const [activeTemplateFields, setActiveTemplateFields] = useState<FieldDefinition[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [adHocAttributes, setAdHocAttributes] = useState<{ key: string; value: string }[]>([]);

  // Media & Status
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------
     2.1 MODAL INITIALIZATION & ATTRIBUTE PARSING
     ------------------------------------------------------------------------ */
  useEffect(() => {
    async function initModal() {
      if (!item || !isOpen) return;

      setName(item.name || '');
      const rawAttrs = item.attributes || {};
      const imgUrl = rawAttrs['image_url'] ? String(rawAttrs['image_url']) : null;
      setExistingImageUrl(imgUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);

      // Fetch all templates
      const { data: tmpls } = await supabase
        .from('collection_templates')
        .select('*')
        .order('is_system_preset', { ascending: false });

      const { data: flds } = await supabase
        .from('template_fields')
        .select('*')
        .order('display_order', { ascending: true });

      const fullTemplates: CollectionTemplate[] = (tmpls || []).map((t) => ({
        ...t,
        fields: (flds || []).filter((f) => f.template_id === t.id),
      }));

      setAvailableTemplates(fullTemplates);

      // Extract existing attributes excluding image_url
      const loadedDynamicValues: Record<string, any> = {};

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
          tmpl.fields?.some((f) => keyInAttributes(f.name, loadedDynamicValues))
        );
      }

      if (matchedTemplate) {
        setSelectedTemplateId(matchedTemplate.id);
        setActiveTemplateFields(matchedTemplate.fields || []);
      } else {
        setSelectedTemplateId(null);
        setActiveTemplateFields([]);
      }
    }

    function keyInAttributes(key: string, attrs: Record<string, any>) {
      return Object.prototype.hasOwnProperty.call(attrs, key);
    }

    initModal();
  }, [item, isOpen]);

  /* ------------------------------------------------------------------------
     2.2 TEMPLATE SELECTION
     ------------------------------------------------------------------------ */
  const handleTemplateSelect = (tmplId: number | 'blank') => {
    if (tmplId === 'blank') {
      setSelectedTemplateId(null);
      setActiveTemplateFields([]);
      return;
    }

    const match = availableTemplates.find((t) => t.id === Number(tmplId));
    if (match) {
      setSelectedTemplateId(match.id);
      const fields = match.fields || [];
      setActiveTemplateFields(fields);

      const updatedValues: Record<string, any> = { ...dynamicValues };
      for (const f of fields) {
        if (updatedValues[f.name] === undefined) {
          if (f.field_type === 'boolean') updatedValues[f.name] = false;
          else if (f.field_type === 'select' && f.options && f.options.length > 0)
            updatedValues[f.name] = f.options[0];
          else updatedValues[f.name] = '';
        }
      }
      setDynamicValues(updatedValues);
    }
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

  if (!isOpen || !item) return null;

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
    setExistingImageUrl(null);
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

    setSaving(true);
    setError(null);

    try {
      let finalImageUrl: string | null = existingImageUrl;
      if (selectedFile) {
        finalImageUrl = await uploadItemImage(selectedFile);
      }

      const jsonAttributes: Record<string, any> = { ...dynamicValues };

      if (finalImageUrl) {
        jsonAttributes['image_url'] = finalImageUrl;
      }

      for (const attr of adHocAttributes) {
        if (attr.key.trim()) {
          jsonAttributes[attr.key.trim()] = attr.value.trim();
        }
      }

      const { error: updateError } = await supabase
        .from('items')
        .update({
          name: name.trim(),
          template_id: selectedTemplateId || null,
          attributes: jsonAttributes,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      onItemUpdated();
      onClose();
    } catch (err: any) {
      console.error('Update error on items table:', err);
      setError(err?.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const activeImageDisplay = previewUrl || existingImageUrl;

  const handleDynamicValueChange = (fieldName: string, value: unknown) => {
    setDynamicValues((previous) => ({ ...previous, [fieldName]: value }));
  };

  /* ------------------------------------------------------------------------
     2.6 RENDER
     ------------------------------------------------------------------------ */
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Edit Item</h2>
            <p className="text-[11px] text-slate-500 font-mono">ID: #{item.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Item Template Picker */}
          <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <span>📑</span>
                <span>Item Schema Template</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeTemplateFields.length} Defined Fields
              </span>
            </div>

            <select
              value={selectedTemplateId || 'blank'}
              onChange={(e) => handleTemplateSelect(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <div className="pt-1 text-[11px] space-y-1">
                {diffSummary.merged.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sky-300">
                    <span className="font-mono text-[10px] bg-sky-950/80 border border-sky-800/80 px-1 py-0.2 rounded">
                      🔵 PRESERVED / MERGED ({diffSummary.merged.length})
                    </span>
                    <span className="truncate">{diffSummary.merged.join(', ')}</span>
                  </div>
                )}
                {diffSummary.added.length > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <span className="font-mono text-[10px] bg-emerald-950/80 border border-emerald-800/80 px-1 py-0.2 rounded">
                      🟢 ADDED ({diffSummary.added.length})
                    </span>
                    <span className="truncate">{diffSummary.added.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Item Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <ItemImagePicker
            imageUrl={activeImageDisplay}
            onFileChange={handleFileChange}
            onRemove={handleRemoveImage}
            replaceLabel="Replace Photo"
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
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}