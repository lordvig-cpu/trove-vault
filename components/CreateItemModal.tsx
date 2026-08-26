'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadItemImage } from '@/lib/storage';
import { ItemRecord } from './TreeNode';

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
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleAddAttributeRow = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', text: string) => {
    const updated = [...attributes];
    updated[index][field] = text;
    setAttributes(updated);
  };

  const handleRemoveAttributeRow = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
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

      const jsonAttributes: Record<string, string> = {};
      if (imageUrl) {
        jsonAttributes['image_url'] = imageUrl;
      }

      for (const attr of attributes) {
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
      setAttributes([{ key: '', value: '' }]);
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

          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Nemesis Core Box, Charizard 1st Edition..."
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

          {/* JSONB Custom Attributes */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Custom Attributes (JSONB)</label>
              <button
                type="button"
                onClick={handleAddAttributeRow}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Key (e.g. rarity)"
                    value={attr.key}
                    onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Mint)"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {attributes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttributeRow(idx)}
                      className="text-slate-500 hover:text-rose-400 text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
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
              {loading ? 'Uploading & Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}