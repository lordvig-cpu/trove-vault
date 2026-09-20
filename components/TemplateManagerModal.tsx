'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ItemTemplate } from '@/types/template';
import { fetchTemplateCatalog } from '@/lib/templateCatalog';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId?: number | null;
  collectionName?: string;
  initialTemplateId?: number | null;
  onTemplateApplied?: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: TemplateManagerModal
   Allows users to inspect schema definitions, browse item blueprints,
   and register custom templates.
   ========================================================================== */

export default function TemplateManagerModal({
  isOpen,
  onClose,
  collectionName,
  initialTemplateId,
  onTemplateApplied,
}: TemplateManagerModalProps) {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialTemplateId || null);
  const [loading, setLoading] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('📦');
  const [showSaveAsCustom, setShowSaveAsCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ------------------------------------------------------------------------
     2.1 DATA FETCHING
     Loads item templates and nested field schemas from Supabase.
     ------------------------------------------------------------------------ */
  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);

      const fullTemplates = await fetchTemplateCatalog();

      setTemplates(fullTemplates);
      if (initialTemplateId && fullTemplates.some((t) => t.id === initialTemplateId)) {
        setSelectedTemplateId(initialTemplateId);
      } else if (fullTemplates.length > 0 && !selectedTemplateId) {
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

  if (!isOpen) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  /* ------------------------------------------------------------------------
     2.2 CREATE CUSTOM MASTER ITEM TEMPLATE
     ------------------------------------------------------------------------ */
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setSavingCustom(true);
    setError(null);

    try {
      const { data: createdTemplate, error: tmplCreateErr } = await supabase
        .from('item_templates')
        .insert({
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim() || 'Custom item blueprint',
          icon: newTemplateIcon || '📦',
          is_system_preset: false,
        })
        .select()
        .single();

      if (tmplCreateErr) throw tmplCreateErr;

      setSuccessMsg(`Template "${createdTemplate.name}" created successfully!`);
      setShowSaveAsCustom(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      await fetchTemplates();
      setSelectedTemplateId(createdTemplate.id);
      if (onTemplateApplied) onTemplateApplied();
    } catch (err: any) {
      console.error('Save template error:', err);
      setError(err?.message || 'Failed to save template');
    } finally {
      setSavingCustom(false);
    }
  };

  /* ------------------------------------------------------------------------
     2.3 COMPONENT RENDER
     ------------------------------------------------------------------------ */
  return (
    <div className="field-modal-backdrop">
      <div className="field-modal-dialog !max-w-3xl">
        {/* Header */}
        <div className="field-modal-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📑</span>
              <h2 className="text-base font-bold ui-primary">Item Schema Templates</h2>
            </div>
            <p className="text-xs ui-muted mt-0.5">
              Browse pre-built item blueprints and dynamic attribute definitions
              {collectionName ? <> for <strong className="ui-accent">{collectionName}</strong></> : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ui-muted ui-hover-primary p-1 rounded-lg ui-hover-surface transition cursor-pointer"
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
              <button onClick={() => setSuccessMsg(null)} className="ui-hover-primary cursor-pointer">✕</button>
            </div>
          )}

          {/* Create Custom Item Template Form */}
          {showSaveAsCustom ? (
            <form onSubmit={handleCreateTemplate} className="field-modal-form">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold ui-accent">Add New Item Template</span>
                <button
                  type="button"
                  onClick={() => setShowSaveAsCustom(false)}
                  className="text-xs ui-muted ui-hover-primary cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1">
                  <label className="text-[11px] font-semibold ui-secondary">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vinyl Records & Audio Media"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="field-modal-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold ui-secondary">Emoji Icon</label>
                  <input
                    type="text"
                    value={newTemplateIcon}
                    onChange={(e) => setNewTemplateIcon(e.target.value)}
                    className="field-modal-input text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold ui-secondary">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Albums, LPs, singles, pressing editions, and matrices"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="field-modal-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSaveAsCustom(false)}
                  className="px-3 py-1.5 text-xs ui-muted ui-hover-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="content-btn-primary"
                >
                  {savingCustom ? 'Saving...' : 'Create Template'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSaveAsCustom(true)}
                className="text-xs font-semibold ui-accent ui-hover-primary flex items-center gap-1.5 ui-surface-hover ui-border-subtle px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <span>✨</span>
                <span>Add Custom Item Template</span>
              </button>
            </div>
          )}

          {/* Master Templates Browser */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Templates List */}
            <div className="md:col-span-1 space-y-2 max-h-80 overflow-y-auto pr-1 main-content-scroll">
              <span className="text-[11px] font-bold ui-muted uppercase tracking-wider block mb-2">
                Available Item Templates
              </span>

              {loading ? (
                <div className="p-4 text-xs ui-muted text-center animate-pulse">Loading templates...</div>
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
                        <span className={`text-xs font-semibold truncate block ${isSelected ? 'ui-primary font-bold' : 'ui-secondary'}`}>
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] ui-muted block truncate">
                          {tmpl.is_system_preset ? 'System Preset' : 'Custom Template'} • {tmpl.fields?.length || 0} Fields
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Inspection Panel */}
            <div className="md:col-span-2 field-modal-form justify-between">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between ui-border-bottom-subtle border-b pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedTemplate.icon}</span>
                        <h3 className="text-sm font-bold ui-primary">{selectedTemplate.name}</h3>
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-xs ui-muted mt-1">{selectedTemplate.description}</p>
                      )}
                    </div>
                    <span className="tmpl-badge-count">
                      {selectedTemplate.fields?.length || 0} Fields
                    </span>
                  </div>

                  {/* Field Specs Preview */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 main-content-scroll">
                    {(selectedTemplate.fields || []).length === 0 ? (
                      <div className="p-4 text-xs ui-muted text-center italic">
                        No specific schema fields defined for this blueprint yet.
                      </div>
                    ) : (
                      (selectedTemplate.fields || []).map((f) => (
                        <div
                          key={f.id}
                          className="ui-input rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="ui-primary font-medium">{f.label}</span>
                            <span className="text-[10px] font-mono ui-muted ui-surface px-1.5 py-0.5 rounded ui-border-subtle border">
                              {f.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono ui-accent ui-surface px-1.5 py-0.5 rounded ui-border-subtle border">
                              {f.field_type}
                            </span>
                            {f.is_required && (
                              <span className="field-modal-badge-required">
                                Req
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Schema Context Info */}
                  <div className="pt-3 ui-border-top-subtle border-t flex items-center justify-between">
                    <span className="text-[11px] ui-muted">
                      Assigned to items directly during creation or editing.
                    </span>
                    <span className="text-[10px] font-semibold ui-accent px-2 py-1 rounded bg-[color-mix(in_oklch,var(--primary-accent)_12%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)]">
                      Item Blueprint
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs ui-muted">
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
            className="px-4 py-1.5 text-xs font-medium ui-secondary ui-surface-hover rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}