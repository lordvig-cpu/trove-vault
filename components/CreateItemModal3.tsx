'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadItemImage } from '@/lib/storage';
import { ItemRecord } from '@/types/item';
import { FieldDefinition } from './FieldManagerModal';
import { CollectionTemplate } from './TemplateManagerModal';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: () => void;
  collectionId: number;
  availableParents: ItemRecord[];
  initialParentId?: number | null;
}

export default function CreateItemModal({
  isOpen,
  onClose,
  onItemCreated,
  collectionId,
  availableParents,
  initialParentId = null,
}: CreateItemModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | null>(initialParentId);
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

  // Fetch all templates and their field definitions
  useEffect(() => {
    async function loadTemplatesAndFields() {
      if (!isOpen) return;

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

      // Default to the first template if none selected
      if (fullTemplates.length > 0 && selectedTemplateId === null) {
        applyTemplateFields(fullTemplates[0]);
      }
    }

    loadTemplatesAndFields();
  }, [isOpen]);

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

  // Live Diff calculation
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

      const { error: insertError } = await supabase.from('items').insert({
        collection_id: collectionId,
        parent_id: effectiveParentId || null,
        name: name.trim(),
        attributes: jsonAttributes,
      });

      if (insertError) throw insertError;

      // Reset
      setName('');
      setAdHocAttributes([]);
      setSelectedFile(null);
      setPreviewUrl(null);
      onItemCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create item:', err);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">
              {initialParentId ? 'Add Sub-Item' : 'Create New Item'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialParentId ? `Adding child directly under Parent #${initialParentId}` : 'Add a new record to the collection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
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
                {activeTemplateFields.length} Template Fields
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
                      🔵 FILLED ({diffSummary.merged.length})
                    </span>
                    <span className="truncate">{diffSummary.merged.join(', ')}</span>
                  </div>
                )}
                {diffSummary.added.length > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <span className="font-mono text-[10px] bg-emerald-950/80 border border-emerald-800/80 px-1 py-0.2 rounded">
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
            <label className="text-xs font-semibold text-slate-300">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. The Amazing Spider-Man #300..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Parent Item Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Parent Item</label>
              {Boolean(initialParentId) && (
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                  Locked to Parent
                </span>
              )}
            </div>
            <select
              value={initialParentId || parentId || ''}
              disabled={Boolean(initialParentId)}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition ${
                initialParentId
                  ? 'opacity-60 cursor-not-allowed bg-slate-900 border-slate-800/60 text-slate-400'
                  : 'focus:border-indigo-500'
              }`}
            >
              <option value="">None (Top-Level Root Item)</option>
              {flatItemList.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Item Photo</label>
            {previewUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg transition"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition group">
                <span className="text-2xl mb-1 group-hover:scale-110 transition">📷</span>
                <span className="text-xs text-slate-400 font-medium">Click to upload photo</span>
                <span className="text-[10px] text-slate-600 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Template Input Fields */}
          {activeTemplateFields.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Template Properties
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTemplateFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {field.label} {field.is_required && <span className="text-rose-400">*</span>}
                    </label>

                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        required={field.is_required}
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) =>
                          setDynamicValues({ ...dynamicValues, [field.name]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {field.field_type === 'number' && (
                      <input
                        type="number"
                        required={field.is_required}
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) =>
                          setDynamicValues({
                            ...dynamicValues,
                            [field.name]: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {field.field_type === 'select' && (
                      <select
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) =>
                          setDynamicValues({ ...dynamicValues, [field.name]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.field_type === 'boolean' && (
                      <label className="flex items-center gap-2 pt-1 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dynamicValues[field.name])}
                          onChange={(e) =>
                            setDynamicValues({ ...dynamicValues, [field.name]: e.target.checked })
                          }
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4"
                        />
                        <span>Yes / True</span>
                      </label>
                    )}

                    {field.field_type === 'date' && (
                      <input
                        type="date"
                        required={field.is_required}
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) =>
                          setDynamicValues({ ...dynamicValues, [field.name]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ad-Hoc Freeform Fields */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400">Additional Custom Fields</label>
              <button
                type="button"
                onClick={handleAddAdHocRow}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
              >
                + Add Custom Field
              </button>
            </div>

            <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
              {adHocAttributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Key (e.g. signature)"
                    value={attr.key}
                    onChange={(e) => handleAdHocChange(idx, 'key', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Stan Lee)"
                    value={attr.value}
                    onChange={(e) => handleAdHocChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAdHocRow(idx)}
                    className="text-slate-500 hover:text-rose-400 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}