'use client';

import React from 'react';
import { FieldDefinition } from '@/types/field';
import { FlexComponentNode } from '@/types/layout';
import ContentValue from '@/components/template-canvas/ContentValue';
import { bindingOf, boxLookCss, contentNameOf } from '@/lib/layoutContent';
import { CloseIcon } from '@/components/icons/PanelIcons';
import { StarIcon } from '@/components/icons/GlyphIcons';
import { TableIcon, ImageIcon, CameraIcon, NoteIcon } from '@/components/icons/ContentIcons';

/* ==========================================================================
   FLEX COMPONENT RENDERER
   ========================================================================== */

/** The pre-content-model look: table / media / stat / divider blocks and unbound fields draw mock
    values (nothing real to show). They are replaced by pre-defined content in a later phase. */
function PlaceholderComponent({
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
              {!component.sizing || component.sizing.type === 'fill'
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
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Render Component Content by Type */}
      {component.componentType === 'table' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <TableIcon />
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
              <ImageIcon />
              <span>{label}</span>
            </span>
            <span className="text-[9.5px] font-mono text-amber-400">
              Media Gallery
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-center">
            <CameraIcon className="w-6 h-6 opacity-60" />
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
            <StarIcon className="inline w-2.5 h-2.5 align-baseline" /> Verified Rank
          </span>
        </div>
      ) : component.componentType === 'note' ? (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <NoteIcon />
            <span>{label}</span>
          </div>
          {typeof component.custom_props?.text === 'string' ? (
            // Real filler text (e.g. the Lorem Ipsum grabbable), not a mock placeholder -- shown
            // as-is in both modes so its actual wrapping/flow is visible.
            component.custom_props.text.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-[11px] text-amber-200/80 leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              {canvasMode === 'preview'
                ? 'Condition verified by official registry. Stored in temperature-controlled archive.'
                : 'Add curator remarks, notes, or grading certificates.'}
            </p>
          )}
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

/* --------------------------------------------------------------------------
   Bound content
   -------------------------------------------------------------------------- */

/**
 * One content element in the canvas. A bound element (a built-in item value, a template field or
 * static text) draws its real value through ContentValue; its container sizes and positions it, so
 * it has no width of its own (a layout saved before that rule still carries one, and keeps it). The
 * old placeholder blocks fall through to PlaceholderComponent.
 */
export default function FlexComponentRenderer(props: {
  component: FlexComponentNode;
  parentStacked?: boolean;
  selectedNodeId?: string | null;
  canvasMode: 'edit' | 'preview';
  fields: FieldDefinition[];
  onSelectNode?: (id: string | null) => void;
  onRemoveComponent?: (id: string) => void;
}) {
  const { component, parentStacked, selectedNodeId, canvasMode, fields, onSelectNode, onRemoveComponent } = props;
  const binding = bindingOf(component);
  if (!binding) return <PlaceholderComponent {...props} />;

  const isSelected = selectedNodeId === component.id;
  const hasBoxLook = Boolean(component.background || component.borderWidth);
  const legacySized = component.sizing?.type === 'fixed' && component.sizing.value;

  const style: React.CSSProperties = {
    // Content has no size of its own: it takes the room its content needs and shrinks before it
    // overflows. (Only a layout saved with an explicit width keeps it.)
    flex: legacySized ? `0 0 ${component.sizing?.value}` : '0 1 auto',
    ...(legacySized ? { width: component.sizing?.value } : null),
    minWidth: 0,
    ...(parentStacked ? { flex: '0 0 auto', width: '100%' } : null),
    // A background or border needs a little room around the text to read as a badge or a box.
    ...(hasBoxLook ? { padding: '0.25em 0.5em' } : null),
    ...boxLookCss(component),
  };

  return (
    <div
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (canvasMode === 'edit') onSelectNode?.(component.id);
      }}
      className={`relative ${
        canvasMode === 'preview'
          ? ''
          : isSelected
          ? 'outline-2 outline-[var(--primary-accent)] outline-offset-2 rounded-md cursor-pointer'
          : 'outline outline-1 outline-dashed outline-[var(--primary-border-subtle)] outline-offset-2 rounded-md cursor-pointer hover:outline-[color-mix(in_oklch,var(--primary-accent)_50%,var(--primary-border-subtle))]'
      }`}
    >
      {canvasMode === 'edit' && isSelected && (
        <div className="absolute -top-5 left-0 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--primary-accent)] text-[var(--pole-label)] text-[10px] font-semibold select-none">
          <span className="truncate max-w-[16ch]">{contentNameOf(component, fields)}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveComponent?.(component.id);
            }}
            className="cursor-pointer leading-none"
            title="Remove"
            aria-label="Remove content"
          >
            <CloseIcon className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
      <ContentValue component={component} binding={binding} fields={fields} />
    </div>
  );
}
