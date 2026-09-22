'use client';

import React from 'react';
import { FieldDefinition } from '@/types/field';
import { FlexComponentNode } from '@/types/layout';

/* ==========================================================================
   FLEX COMPONENT RENDERER
   ========================================================================== */

export default function FlexComponentRenderer({
  component,
  selectedNodeId,
  canvasMode,
  fields,
  onSelectNode,
  onRemoveComponent,
  parentStacked,
}: {
  component: FlexComponentNode;
  parentStacked?: boolean;
  selectedNodeId?: string | null;
  canvasMode: 'edit' | 'preview';
  fields: FieldDefinition[];
  onSelectNode?: (id: string | null) => void;
  onRemoveComponent?: (id: string) => void;
}) {
  const isSelected = selectedNodeId === component.id;
  const boundField = component.field_id
    ? fields.find((f) => f.id === component.field_id)
    : undefined;
  const label = component.label || boundField?.label || component.componentType;

  const componentStyle: React.CSSProperties = {
    flex:
      component.sizing?.type === 'fixed'
        ? `0 0 ${component.sizing.value || 'auto'}`
        : component.sizing?.type === 'auto'
        ? '0 0 auto'
        : '1 1 0%',
    width:
      component.sizing?.type === 'fixed' && component.sizing.value
        ? component.sizing.value
        : undefined,
    minWidth: 0,
    ...(parentStacked ? { flex: '0 0 auto', width: '100%' } : null),
  };

  return (
    <div
      style={componentStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (canvasMode === 'edit') onSelectNode?.(component.id);
      }}
      className={`transition-all duration-150 relative ${
        canvasMode === 'preview'
          ? 'rounded-xl bg-slate-900/40 border border-slate-800/80 p-3'
          : isSelected
          ? 'rounded-xl ring-2 ring-amber-500/90 bg-amber-950/20 shadow-lg shadow-amber-500/10 border border-amber-500/60 p-3 cursor-pointer'
          : 'rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 p-3 cursor-pointer'
      }`}
    >
      {/* Component Header / Chip in Edit Mode */}
      {canvasMode === 'edit' && (
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/60 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9.5px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700/50">
              {component.componentType}
            </span>
            <span className="text-xs font-semibold text-slate-300 truncate">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-slate-400">
              {component.sizing.type === 'fill'
                ? 'Fill'
                : component.sizing.value || 'Fixed'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveComponent?.(component.id);
              }}
              className="text-[11px] text-red-400 hover:text-red-200 ml-1 p-0.5 cursor-pointer leading-none"
              title="Remove Component"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Render Component Content by Type */}
      {component.componentType === 'table' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>📊</span>
              <span>{label}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--primary-accent)]">
              Specifications Table
            </span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Rating:</span>
              <span className="font-semibold text-slate-200">4.8 / 5.0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Target Audience:</span>
              <span className="font-semibold text-slate-200">
                Collectors & Enthusiasts
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Condition Grade:</span>
              <span className="font-semibold text-slate-200">
                Mint / Near Mint
              </span>
            </div>
          </div>
        </div>
      ) : component.componentType === 'media' ? (
        <div className="flex flex-col gap-2 h-full min-h-[140px] justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>🖼️</span>
              <span>{label}</span>
            </span>
            <span className="text-[9.5px] font-mono text-amber-400">
              Media Gallery
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-center">
            <span className="text-2xl opacity-60">📷</span>
            <span className="text-[11px] text-slate-400 mt-1">
              High-Resolution Photo
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Aspect: 16:9 Banner</span>
            <span className="font-mono">Fill Box</span>
          </div>
        </div>
      ) : component.componentType === 'stat' ? (
        <div className="flex flex-col items-center justify-center p-3 gap-1 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {label}
          </span>
          <span className="text-2xl font-extrabold text-[var(--primary-accent)] font-mono tracking-tight">
            98.5%
          </span>
          <span className="text-[9.5px] text-emerald-400 font-medium">
            ★ Verified Rank
          </span>
        </div>
      ) : component.componentType === 'note' ? (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <span>📝</span>
            <span>{label}</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            {canvasMode === 'preview'
              ? 'Condition verified by official registry. Stored in temperature-controlled archive.'
              : 'Add curator remarks, notes, or grading certificates.'}
          </p>
        </div>
      ) : (
        /* Field Attribute Component */
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-200 truncate">
              {label}
            </span>
            {boundField && (
              <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.5 rounded bg-slate-800 text-[var(--primary-accent)] border border-slate-700/60 shrink-0">
                {boundField.field_type}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 truncate">
            {canvasMode === 'preview'
              ? boundField?.options?.[0] || 'Sample attribute value'
              : boundField?.is_required
              ? 'Required Field *'
              : 'Value placeholder...'}
          </div>
        </div>
      )}
    </div>
  );
}
