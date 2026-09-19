'use client';

import React from 'react';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition } from '@/types/field';

interface TemplateEditorStageProps {
  template: ItemTemplate;
  selectedFieldId: number | null;
  onSelectField: (fieldId: number | null) => void;
  onDoneEditing: () => void;
  onAddField: () => void;
}

export default function TemplateEditorStage({
  template,
  selectedFieldId,
  onSelectField,
  onDoneEditing,
  onAddField,
}: TemplateEditorStageProps) {
  const fields = template.fields || [];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6 select-none">
      {/* --------------------------------------------------------------------
          1. BLUEPRINT MODE HEADER BANNER
          -------------------------------------------------------------------- */}
      <div className="tmpl-editor-stage-banner">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-3xl shadow-md shrink-0">
            {template.icon || '📦'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide truncate">
                {template.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                Blueprint Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {template.description || 'Custom template schema definition'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onAddField}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50 hover:border-slate-500 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <span>➕</span>
            <span>Add Field</span>
          </button>

          <button
            type="button"
            onClick={onDoneEditing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 transition hover:scale-[1.02] cursor-pointer"
            title="Complete template editing and restore previous tab workspace"
          >
            <span>✓</span>
            <span>Done Editing (Restore Tabs)</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. BLUEPRINT SCHEMA VISUAL PREVIEW
          -------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>📑</span>
              <span>Template Fields Blueprint ({fields.length} Attributes)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any field to inspect and modify its properties in the right inspector panel.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            {template.is_system_preset ? 'System Preset' : 'User Template'}
          </span>
        </div>

        {/* Fields Grid / Layout Preview */}
        {fields.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-slate-800 rounded-xl">
            <span className="text-3xl">📐</span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-300">No Fields Defined Yet</span>
              <p className="text-xs text-slate-500 max-w-sm">
                Add schema fields in the right Inspector panel or click the button below to start defining this blueprint.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddField}
              className="mt-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer"
            >
              ➕ Add First Field
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map((f: FieldDefinition) => {
              const isSelected = selectedFieldId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => onSelectField(f.id)}
                  className={`tmpl-canvas-slot-card cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/50'
                      : 'hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-100 truncate block">
                        {f.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate block">
                        {f.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {f.field_type}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                    <span className={f.is_required ? 'text-red-400 font-bold' : 'text-slate-500'}>
                      {f.is_required ? 'Required *' : 'Optional'}
                    </span>
                    {f.field_type === 'select' && (
                      <span className="text-amber-400 font-mono">
                        {f.options?.length || 0} Choices
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phase 2 Teaser Banner */}
        <div className="mt-4 p-4 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎨</span>
            <div>
              <span className="text-xs font-bold text-blue-200">
                Visual Drag & Drop Layout Canvas
              </span>
              <p className="text-[11px] text-blue-300/70">
                Phase 2 will introduce an interactive WYSIWYG canvas to position, resize, and group these components into custom layouts.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 shrink-0">
            Phase 2
          </span>
        </div>
      </div>
    </div>
  );
}

