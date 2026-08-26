'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface FieldDefinition {
  id: number;
  collection_id: number;
  name: string;
  label: string;
  field_type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  options: string[] | null;
  is_required: boolean;
  display_order: number;
}

interface FieldManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: number | null;
  collectionName: string;
  onFieldsUpdated: () => void;
}

export default function FieldManagerModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  onFieldsUpdated,
}: FieldManagerModalProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New field form state
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<FieldDefinition['field_type']>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [optionsString, setOptionsString] = useState(''); // Comma separated for 'select'

  async function fetchFields() {
    if (!collectionId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('collection_fields')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });

      if (fetchError) throw fetchError;
      setFields((data as FieldDefinition[]) || []);
    } catch (err: any) {
      console.error('Error fetching fields:', err);
      setError(err?.message || 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && collectionId) {
      fetchFields();
    }
  }, [isOpen, collectionId]);

  if (!isOpen || !collectionId) return null;

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    // Convert Label -> machine_name (e.g., "Player Count" -> "player_count")
    const machineName = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const parsedOptions =
      fieldType === 'select'
        ? optionsString
            .split(',')
            .map((opt) => opt.trim())
            .filter(Boolean)
        : [];

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('collection_fields').insert({
        collection_id: collectionId,
        name: machineName,
        label: label.trim(),
        field_type: fieldType,
        options: parsedOptions,
        is_required: isRequired,
        display_order: fields.length + 1,
      });

      if (insertError) throw insertError;

      // Reset form
      setLabel('');
      setFieldType('text');
      setIsRequired(false);
      setOptionsString('');

      await fetchFields();
      onFieldsUpdated();
    } catch (err: any) {
      console.error('Error adding field:', err);
      setError(err?.message || 'Failed to add field');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('collection_fields')
        .delete()
        .eq('id', fieldId);

      if (deleteError) throw deleteError;

      await fetchFields();
      onFieldsUpdated();
    } catch (err: any) {
      console.error('Error deleting field:', err);
      setError(err?.message || 'Failed to delete field');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h2 className="text-base font-bold text-white">Custom Field Templates</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Define reusable attribute schemas for <strong className="text-indigo-300">{collectionName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* New Field Creator Panel */}
          <form onSubmit={handleAddField} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 shadow-inner">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              + Add New Custom Field
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field Label */}
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Player Count"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Field Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Data Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldDefinition['field_type'])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="text">🔤 Text String</option>
                  <option value="number">🔢 Number</option>
                  <option value="select">📋 Dropdown Select</option>
                  <option value="boolean">☑️ Checkbox / Boolean</option>
                  <option value="date">📅 Date</option>
                </select>
              </div>

              {/* Options or Required */}
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Mandatory Field</span>
                </label>
              </div>
            </div>

            {/* Dropdown Options Input if Type == 'select' */}
            {fieldType === 'select' && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-indigo-300">
                  Dropdown Options (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mint, Near Mint, Light Play, Damaged"
                  value={optionsString}
                  onChange={(e) => setOptionsString(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Field Template'}
              </button>
            </div>
          </form>

          {/* Configured Fields List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Template Fields ({fields.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Mapped to JSONB</span>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
                Loading fields schema...
              </div>
            ) : fields.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No custom field templates defined yet. Add your first field above!
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between group hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white">{field.label}</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                        key: {field.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                        {field.field_type}
                      </span>
                      {field.is_required && (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition"
                      title="Delete Field"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}