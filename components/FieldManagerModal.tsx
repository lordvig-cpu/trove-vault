'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FieldDefinition } from '@/types/field';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface FieldManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: number | null;
  collectionName: string;
  onFieldsUpdated: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: FieldManagerModal
   Manages custom attribute definitions for a specific collection.
   ========================================================================== */

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
  const [optionsString, setOptionsString] = useState('');

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
    <div className="field-modal-backdrop">
      <div className="field-modal-dialog">
        {/* Header */}
        <div className="field-modal-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h2 className="text-base font-bold text-content-primary">Custom Field Templates</h2>
            </div>
            <p className="text-xs text-content-muted mt-0.5">
              Define reusable attribute schemas for <strong className="text-accent-secondary">{collectionName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-content-primary p-1 rounded-lg hover:bg-surface-hover transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 main-content-scroll">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* New Field Creator Panel */}
          <form onSubmit={handleAddField} className="field-modal-form">
            <h3 className="text-xs font-bold text-accent-secondary uppercase tracking-wider">
              + Add New Custom Field
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field Label */}
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-semibold text-content-secondary">Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Player Count"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="field-modal-input"
                />
              </div>

              {/* Field Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-content-secondary">Data Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldDefinition['field_type'])}
                  className="field-modal-input"
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
                <label className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-border-subtle bg-canvas text-accent-primary focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Mandatory Field</span>
                </label>
              </div>
            </div>

            {/* Dropdown Options Input if Type == 'select' */}
            {fieldType === 'select' && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-accent-secondary">
                  Dropdown Options (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mint, Near Mint, Light Play, Damaged"
                  value={optionsString}
                  onChange={(e) => setOptionsString(e.target.value)}
                  className="field-modal-input"
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="content-btn-primary"
              >
                {saving ? 'Adding...' : 'Add Field Template'}
              </button>
            </div>
          </form>

          {/* Configured Fields List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                Active Template Fields ({fields.length})
              </span>
              <span className="text-[11px] text-content-muted font-mono">Mapped to JSONB</span>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-content-muted animate-pulse">
                Loading fields schema...
              </div>
            ) : fields.length === 0 ? (
              <p className="text-xs text-content-muted italic py-4 text-center">
                No custom field templates defined yet. Add your first field above!
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div key={field.id} className="field-modal-row group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-content-primary">{field.label}</span>
                      <span className="field-modal-badge-key">
                        key: {field.name}
                      </span>
                      <span className="field-modal-badge-type">
                        {field.field_type}
                      </span>
                      {field.is_required && (
                        <span className="field-modal-badge-required">
                          Required
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="text-content-muted hover:text-rose-400 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
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
        <div className="field-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-content-secondary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}