'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadItemImage } from '@/lib/storage';
import { ItemRecord } from './TreeNode';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
  item: ItemRecord | null;
}

export default function EditItemModal({
  isOpen,
  onClose,
  onItemUpdated,
  item,
}: EditItemModalProps) {
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name || '');

      const rawAttrs = item.attributes || {};
      const imgUrl = rawAttrs['image_url'] ? String(rawAttrs['image_url']) : null;
      setExistingImageUrl(imgUrl);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Filter out image_url from the custom attributes list
      const initialAttrs = Object.entries(rawAttrs)
        .filter(([key]) => key !== 'image_url')
        .map(([key, value]) => ({
          key,
          value: String(value),
        }));

      setAttributes(initialAttrs.length > 0 ? initialAttrs : [{ key: '', value: '' }]);
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

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

    setSaving(true);
    setError(null);

    try {
      let finalImageUrl: string | null = existingImageUrl;

      // Upload new file if selected
      if (selectedFile) {
        finalImageUrl = await uploadItemImage(selectedFile);
      }

      const jsonAttributes: Record<string, string> = {};

      if (finalImageUrl) {
        jsonAttributes['image_url'] = finalImageUrl;
      }

      for (const attr of attributes) {
        if (attr.key.trim()) {
          jsonAttributes[attr.key.trim()] = attr.value.trim();
        }
      }

      const { error: updateError } = await supabase
        .from('items')
        .update({
          name: name.trim(),
          attributes: jsonAttributes,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      onItemUpdated();
      onClose();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err?.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const activeImageDisplay = previewUrl || existingImageUrl;

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Item Photo Manager */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Item Photo</label>
              {activeImageDisplay && (
                <label className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer">
                  Replace Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {activeImageDisplay ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
                <img
                  src={activeImageDisplay}
                  alt="Item"
                  className="h-full w-full object-contain"
                />
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

          {/* Footer Actions */}
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
              disabled={saving}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}