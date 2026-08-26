'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FieldDefinition } from './FieldManagerModal';

export interface CollectionTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  is_system_preset: boolean;
  fields?: FieldDefinition[];
}

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

      // Fetch all templates
      const { data: tmpls, error: tmplError } = await supabase
        .from('collection_templates')
        .select('*')
        .order('is_system_preset', { ascending: false })
        .order('id', { ascending: true });

      if (tmplError) throw tmplError;

      // Fetch all template fields
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

  // Apply template to active collection (Copy on Apply)
  const handleApplyTemplate = async (mode: 'replace' | 'append') => {
    if (!selectedTemplate || !selectedTemplate.fields) return;

    setApplying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'replace') {
        // Remove existing fields from the active collection
        const { error: delError } = await supabase
          .from('collection_fields')
          .delete()
          .eq('collection_id', collectionId);

        if (delError) throw delError;
      }

      // Clone fields into collection_fields table
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

  // Save the current collection schema as a new Master Template
  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setSavingCustom(true);
    setError(null);

    try {
      // 1. Fetch current collection's fields
      const { data: currentFields, error: fieldFetchErr } = await supabase
        .from('collection_fields')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true });

      if (fieldFetchErr) throw fieldFetchErr;

      if (!currentFields || currentFields.length === 0) {
        throw new Error('This collection has no custom fields to save into a template.');
      }

      // 2. Create collection_templates record
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

      // 3. Create template_fields records
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📑</span>
              <h2 className="text-base font-bold text-white">Collection Schema Templates</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a pre-built template or apply saved schemas to <strong className="text-indigo-300">{collectionName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Save Current Collection Schema as Custom Template Drawer */}
          {showSaveAsCustom ? (
            <form onSubmit={handleSaveCurrentAsTemplate} className="bg-slate-950 border border-indigo-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Save Collection Schema as Reusable Template</span>
                <button
                  type="button"
                  onClick={() => setShowSaveAsCustom(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Custom Miniature Game Template"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Emoji Icon</label>
                  <input
                    type="text"
                    value={newTemplateIcon}
                    onChange={(e) => setNewTemplateIcon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSaveAsCustom(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
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
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-900/50 px-3 py-1.5 rounded-xl transition"
              >
                <span>💾</span>
                <span>Save Current Schema as New Template</span>
              </button>
            </div>
          )}

          {/* Master Templates Browser */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Templates List */}
            <div className="md:col-span-1 space-y-2 max-h-80 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Available Templates
              </span>

              {loading ? (
                <div className="p-4 text-xs text-slate-500 text-center animate-pulse">Loading templates...</div>
              ) : (
                templates.map((tmpl) => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-700 shadow-md shadow-indigo-950/50'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl shrink-0">{tmpl.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                            {tmpl.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {tmpl.is_system_preset ? 'System Preset' : 'Custom Template'} • {tmpl.fields?.length || 0} Fields
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Template Schema Inspection & Apply Panel */}
            <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedTemplate.icon}</span>
                        <h3 className="text-sm font-bold text-white">{selectedTemplate.name}</h3>
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded shrink-0">
                      {selectedTemplate.fields?.length || 0} Fields
                    </span>
                  </div>

                  {/* Field Specs Preview */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {(selectedTemplate.fields || []).map((f) => (
                      <div
                        key={f.id}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-medium">{f.label}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {f.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                            {f.field_type}
                          </span>
                          {f.is_required && (
                            <span className="text-[10px] text-rose-400 font-semibold bg-rose-950/40 border border-rose-800/60 px-1.5 py-0.5 rounded">
                              Req
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Apply Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Apply fields to active collection:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('replace')}
                        disabled={applying}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition disabled:opacity-50"
                        title="Replaces active collection fields with this template"
                      >
                        {applying ? 'Applying...' : 'Replace Schema'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('append')}
                        disabled={applying}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
                        title="Appends this template fields to existing collection fields"
                      >
                        {applying ? 'Applying...' : 'Apply / Merge'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Select a template on the left to preview its schema definition.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}