'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FieldDefinition } from '@/types/field';
import { CollectionTemplate } from '@/types/template';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: number | null;
  collectionName: string;
  onTemplateApplied: () => void;
}

export default function TemplateManagerModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  onTemplateApplied,
}: TemplateManagerModalProps) {
  const [templates, setTemplates] = useState<CollectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('📦');
  const [showSaveAsCustom, setShowSaveAsCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);

      const { data: tmpls, error: tmplError } = await supabase
        .from('collection_templates')
        .select('*')
        .order('is_system_preset', { ascending: false })
        .order('id', { ascending: true });

      if (tmplError) throw tmplError;

      const { data: flds, error: fldError } = await supabase
        .from('template_fields')
        .select('*')
        .order('display_order', { ascending: true });

      if (fldError) throw fldError;

      const fullTemplates = (tmpls || []).map((t) => ({
        ...t,
        fields: (flds || []).filter((f) => f.template_id === t.id),
      }));

      setTemplates(fullTemplates);
      if (fullTemplates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(fullTemplates[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSuccessMsg(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !collectionId) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  const handleApplyTemplate = async (mode: 'replace' | 'append') => {
    if (!selectedTemplate || !selectedTemplate.fields) return;

    setApplying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'replace') {
        const { error: delError } = await supabase
          .from('collection_fields')
          .delete()
          .eq('collection_id', collectionId);

        if (delError) throw delError;
      }

      const fieldsToInsert = selectedTemplate.fields.map((f, idx) => ({
        collection_id: collectionId,
        name: f.name,
        label: f.label,
        field_type: f.field_type,
        options: f.options || [],
        is_required: f.is_required,
        display_order: idx + 1,
      }));

      if (fieldsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('collection_fields')
          .insert(fieldsToInsert);

        if (insertError) throw insertError;
      }

      setSuccessMsg(`Successfully applied "${selectedTemplate.name}" template!`);
      onTemplateApplied();
    } catch (err: any) {
      console.error('Apply template error:', err);
      setError(err?.message || 'Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setSavingCustom(true);
    setError(null);

    try {
      const { data: currentFields, error: fieldFetchErr } = await supabase
        .from('collection_fields')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true });

      if (fieldFetchErr) throw fieldFetchErr;

      if (!currentFields || currentFields.length === 0) {
        throw new Error('This collection has no custom fields to save into a template.');
      }

      const { data: createdTemplate, error: tmplCreateErr } = await supabase
        .from('collection_templates')
        .insert({
          name: newTemplateName.trim(),
          description: `Custom template exported from "${collectionName}"`,
          icon: newTemplateIcon || '📦',
          is_system_preset: false,
        })
        .select()
        .single();

      if (tmplCreateErr) throw tmplCreateErr;

      const templateFieldsToInsert = currentFields.map((f, idx) => ({
        template_id: createdTemplate.id,
        name: f.name,
        label: f.label,
        field_type: f.field_type,
        options: f.options || [],
        is_required: f.is_required,
        display_order: idx + 1,
      }));

      const { error: tmplFieldsErr } = await supabase
        .from('template_fields')
        .insert(templateFieldsToInsert);

      if (tmplFieldsErr) throw tmplFieldsErr;

      setSuccessMsg(`Template "${createdTemplate.name}" created successfully!`);
      setShowSaveAsCustom(false);
      setNewTemplateName('');
      await fetchTemplates();
      setSelectedTemplateId(createdTemplate.id);
    } catch (err: any) {
      console.error('Save template error:', err);
      setError(err?.message || 'Failed to save template');
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <div className="field-modal-backdrop">
      <div className="field-modal-dialog !max-w-3xl">
        {/* Header */}
        <div className="field-modal-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📑</span>
              <h2 className="text-base font-bold text-content-primary">Collection Schema Templates</h2>
            </div>
            <p className="text-xs text-content-muted mt-0.5">
              Select a pre-built template or apply saved schemas to <strong className="text-accent-secondary">{collectionName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-primary p-1 rounded-lg hover:bg-surface-hover transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 main-content-scroll">
          {error && <div className="tmpl-alert-error">{error}</div>}

          {successMsg && (
            <div className="tmpl-alert-success">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="hover:text-white cursor-pointer">✕</button>
            </div>
          )}

          {/* Save Custom Schema Form */}
          {showSaveAsCustom ? (
            <form onSubmit={handleSaveCurrentAsTemplate} className="field-modal-form">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-secondary">Save Collection Schema as Reusable Template</span>
                <button
                  type="button"
                  onClick={() => setShowSaveAsCustom(false)}
                  className="text-xs text-content-muted hover:text-content-primary cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Custom Miniature Game Template"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="field-modal-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Emoji Icon</label>
                  <input
                    type="text"
                    value={newTemplateIcon}
                    onChange={(e) => setNewTemplateIcon(e.target.value)}
                    className="field-modal-input text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSaveAsCustom(false)}
                  className="px-3 py-1.5 text-xs text-content-muted hover:text-content-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="content-btn-primary"
                >
                  {savingCustom ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSaveAsCustom(true)}
                className="text-xs font-semibold text-accent-secondary hover:text-accent-primary flex items-center gap-1.5 bg-surface-hover/60 border border-border-subtle px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <span>💾</span>
                <span>Save Current Schema as New Template</span>
              </button>
            </div>
          )}

          {/* Master Templates Browser */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Templates List */}
            <div className="md:col-span-1 space-y-2 max-h-80 overflow-y-auto pr-1 main-content-scroll">
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block mb-2">
                Available Templates
              </span>

              {loading ? (
                <div className="p-4 text-xs text-content-muted text-center animate-pulse">Loading templates...</div>
              ) : (
                templates.map((tmpl) => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`tmpl-card ${isSelected ? 'tmpl-card-selected' : ''}`}
                    >
                      <span className="text-xl shrink-0">{tmpl.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-semibold truncate block ${isSelected ? 'text-content-primary font-bold' : 'text-content-secondary'}`}>
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] text-content-muted block truncate">
                          {tmpl.is_system_preset ? 'System Preset' : 'Custom Template'} • {tmpl.fields?.length || 0} Fields
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Inspection & Apply Panel */}
            <div className="md:col-span-2 field-modal-form justify-between">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-border-subtle pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedTemplate.icon}</span>
                        <h3 className="text-sm font-bold text-content-primary">{selectedTemplate.name}</h3>
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-xs text-content-muted mt-1">{selectedTemplate.description}</p>
                      )}
                    </div>
                    <span className="tmpl-badge-count">
                      {selectedTemplate.fields?.length || 0} Fields
                    </span>
                  </div>

                  {/* Field Specs Preview */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 main-content-scroll">
                    {(selectedTemplate.fields || []).map((f) => (
                      <div
                        key={f.id}
                        className="bg-canvas/50 border border-border-subtle rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-content-primary font-medium">{f.label}</span>
                          <span className="text-[10px] font-mono text-content-muted bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
                            {f.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-accent-secondary bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
                            {f.field_type}
                          </span>
                          {f.is_required && (
                            <span className="field-modal-badge-required">
                              Req
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Apply Actions */}
                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-[11px] text-content-muted">Apply fields to active collection:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('replace')}
                        disabled={applying}
                        className="content-btn-danger"
                        title="Replaces active collection fields with this template"
                      >
                        {applying ? 'Applying...' : 'Replace Schema'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('append')}
                        disabled={applying}
                        className="content-btn-primary"
                        title="Appends this template fields to existing collection fields"
                      >
                        {applying ? 'Applying...' : 'Apply / Merge'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-content-muted">
                  Select a template on the left to preview its schema definition.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="field-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-content-secondary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}