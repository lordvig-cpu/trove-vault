'use client';

import React from 'react';
import { ItemTemplate } from '@/types/template';
import {
  FlexContainerNode,
  FlexComponentNode,
  FlexDirection,
  FlexGap,
  FlexAlign,
  FlexJustify,
  FlexSizingType,
  LayoutVariant,
  resolveDirection,
} from '@/types/layout';
import TemplateBodyDimensions from '@/components/TemplateBodyDimensions';
import TemplateContainerSizing from '@/components/TemplateContainerSizing';
import { FlexRowIcon, FlexColumnIcon, LayoutContainerIcon } from '@/components/icons/LayoutIcons';

interface TemplatePropertiesInspectorProps {
  template: ItemTemplate | null;
  selectedNode: FlexContainerNode | FlexComponentNode | null;
  parentNode: FlexContainerNode | null;
  onUpdateContainer: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent: (componentId: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string | null) => void;
}

const GAP_OPTIONS: { value: FlexGap; label: string }[] = [
  { value: 0, label: '0px' },
  { value: 4, label: '4px' },
  { value: 8, label: '8px' },
  { value: 12, label: '12px' },
  { value: 16, label: '16px' },
  { value: 24, label: '24px' },
  { value: 32, label: '32px' },
];

const VARIANT_OPTIONS: { variant: LayoutVariant; label: string; icon: string }[] = [
  { variant: 'standard', label: 'Standard Card', icon: '🗂️' },
  { variant: 'compact', label: 'Compact Pill', icon: '🏷️' },
  { variant: 'stat', label: 'Stat / Metric', icon: '📈' },
  { variant: 'table_row', label: 'Table Row', icon: '📊' },
  { variant: 'hero', label: 'Hero Display', icon: '🖼️' },
  { variant: 'callout', label: 'Callout Accent', icon: '💡' },
];

export default function TemplatePropertiesInspector({
  template,
  selectedNode,
  parentNode,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveNode,
  onSelectNode,
}: TemplatePropertiesInspectorProps) {
  const isContainer = selectedNode?.nodeType === 'container';
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center gap-3 h-full min-h-[300px] select-none">
        <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_oklch,var(--primary-accent)_12%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] text-[var(--primary-accent)] flex items-center justify-center text-2xl shadow-sm">
          ⚙️
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold uppercase tracking-wider text-strong">
            No Element Selected
          </div>
          <p className="text-[11px] text-muted max-w-[220px] leading-relaxed">
            Click any container box or component on the canvas to inspect and configure its Flexbox layout properties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-y-auto primary-panel-scroll p-3 gap-4 select-none">
      {/* --------------------------------------------------------------------
          1. HEADER SUMMARY CARD
          -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] shrink-0">
            {isContainer ? (
              resolveDirection(selectedNode as FlexContainerNode, selectedNode.id === 'root-container') === 'row' ? (
                <FlexRowIcon className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
              ) : resolveDirection(selectedNode as FlexContainerNode, selectedNode.id === 'root-container') === 'column' ? (
                <FlexColumnIcon className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
              ) : (
                <LayoutContainerIcon className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
              )
            ) : (
              '🧩'
            )}
          </span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-strong truncate block">
              {selectedNode.label || (isContainer ? 'Flex Container' : selectedNode.componentType)}
            </span>
            <span className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
              {isContainer ? `Container • ${resolveDirection(selectedNode as FlexContainerNode, selectedNode.id === 'root-container').toUpperCase()}` : `Block • ${selectedNode.componentType}`}
            </span>
          </div>
        </div>

        {selectedNode.id !== 'root-container' && (
          <button
            type="button"
            onClick={() => onRemoveNode(selectedNode.id)}
            className="p-1 px-2 text-[10.5px] font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded border border-rose-500/30 transition cursor-pointer"
            title="Remove from layout"
          >
            ✕ Remove
          </button>
        )}
      </div>

      {/* --------------------------------------------------------------------
          2. CONTAINER CONFIGURATION CONTROLS
          -------------------------------------------------------------------- */}
      {isContainer && (
        <>
          {/* Container Label */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Container Name
            </label>
            <input
              type="text"
              value={selectedNode.label || ''}
              onChange={(e) => onUpdateContainer(selectedNode.id, { label: e.target.value })}
              placeholder="e.g. Header Section, Sidebar, Card Row"
              className="px-2.5 py-1.5 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)] font-medium"
            />
          </div>

          {/* Direction Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Flex Flow Direction
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateContainer(selectedNode.id, { direction: 'row' })}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  resolveDirection(selectedNode as FlexContainerNode, selectedNode.id === 'root-container') === 'row'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-white shadow-sm'
                    : 'bg-surface-secondary border-subtle text-muted hover:text-white'
                }`}
                title="Row (Horizontal)"
              >
                <FlexRowIcon className="w-4 h-4" />
                <span>Row</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateContainer(selectedNode.id, { direction: 'column' })}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  resolveDirection(selectedNode as FlexContainerNode, selectedNode.id === 'root-container') === 'column'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-white shadow-sm'
                    : 'bg-surface-secondary border-subtle text-muted hover:text-white'
                }`}
                title="Column (Vertical)"
              >
                <FlexColumnIcon className="w-4 h-4" />
                <span>Column</span>
              </button>
            </div>
          </div>

          {/* Gap / Spacing */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Child Item Gap
              </label>
              <span className="text-[10px] font-mono text-[var(--primary-accent)] font-semibold">
                {selectedNode.gap}px
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {GAP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateContainer(selectedNode.id, { gap: opt.value })}
                  className={`flex-1 min-w-[36px] py-1 text-[11px] font-semibold rounded border transition cursor-pointer ${
                    selectedNode.gap === opt.value
                      ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)]'
                      : 'bg-surface-secondary text-muted border-subtle hover:text-strong'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wrap Toggle (Row mode only) */}
          {resolveDirection(selectedNode as FlexContainerNode, selectedNode.id === 'root-container') === 'row' && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary border border-subtle">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-strong">Wrap Children</span>
                <span className="text-[10px] text-muted">Allow multi-line wrapping on narrow screens</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateContainer(selectedNode.id, { wrap: !selectedNode.wrap })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  selectedNode.wrap ? 'bg-[var(--primary-accent)]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    selectedNode.wrap ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Alignment & Justify */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Align Items
              </label>
              <select
                value={selectedNode.align}
                onChange={(e) => onUpdateContainer(selectedNode.id, { align: e.target.value as FlexAlign })}
                className="px-2 py-1.5 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)]"
              >
                <option value="stretch">Stretch (Full cross)</option>
                <option value="start">Start (Top / Left)</option>
                <option value="center">Center</option>
                <option value="end">End (Bottom / Right)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Justify Content
              </label>
              <select
                value={selectedNode.justify}
                onChange={(e) => onUpdateContainer(selectedNode.id, { justify: e.target.value as FlexJustify })}
                className="px-2 py-1.5 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)]"
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="between">Space Between</option>
                <option value="around">Space Around</option>
                <option value="end">End</option>
              </select>
            </div>
          </div>

          {/* Card Wrapper Frame */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary border border-subtle">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-strong">Card Frame Style</span>
              <span className="text-[10px] text-muted">Surround with surface border & card background</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateContainer(selectedNode.id, { isCard: !selectedNode.isCard })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                selectedNode.isCard ? 'bg-[var(--primary-accent)]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  selectedNode.isCard ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Container Padding */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Padding
              </label>
              <span className="text-[10px] font-mono text-[var(--primary-accent)] font-semibold">
                {(selectedNode.padding ?? 0)}px
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 8, 16, 24].map((pad) => (
                <button
                  key={pad}
                  type="button"
                  onClick={() => onUpdateContainer(selectedNode.id, { padding: pad })}
                  className={`py-1 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                    (selectedNode.padding ?? 0) === pad
                      ? 'bg-[var(--primary-accent)] text-white border-[var(--primary-accent)] shadow-xs'
                      : 'bg-surface-secondary text-muted border-subtle hover:text-white hover:border-[var(--primary-accent)]'
                  }`}
                >
                  {pad}px
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="48"
              step="4"
              value={selectedNode.padding ?? 0}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdateContainer(selectedNode.id, { padding: isNaN(val) ? 0 : val });
              }}
              className="w-full accent-[var(--primary-accent)] cursor-pointer h-1.5 bg-surface-secondary rounded-lg mt-0.5"
              title={`Adjust padding: ${selectedNode.padding ?? 0}px`}
            />
          </div>

          {/* Container Sizing (Width / Min / Max, Height / Min / Max, Stack) */}
          {selectedNode.id !== 'root-container' && (
            <TemplateContainerSizing
              container={selectedNode as FlexContainerNode}
              onUpdate={(partial) => onUpdateContainer(selectedNode.id, partial)}
            />
          )}

          {/* Body Width & Height */}
          {selectedNode.id === 'root-container' && (
            <div className="rounded-xl bg-slate-900/50 border border-subtle overflow-hidden">
              <TemplateBodyDimensions
                root={selectedNode as FlexContainerNode}
                onUpdate={(partial) => onUpdateContainer(selectedNode.id, partial)}
              />
            </div>
          )}
        </>
      )}

      {/* --------------------------------------------------------------------
          3. COMPONENT CONFIGURATION CONTROLS
          -------------------------------------------------------------------- */}
      {!isContainer && (
        <>
          {/* Component Label */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Display Label Override
            </label>
            <input
              type="text"
              value={selectedNode.label || ''}
              onChange={(e) => onUpdateComponent(selectedNode.id, { label: e.target.value })}
              placeholder="Custom label..."
              className="px-2.5 py-1.5 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)] font-medium"
            />
          </div>

          {/* Flex Sizing Behavior */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Flex Sizing Behavior
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => onUpdateComponent(selectedNode.id, { sizing: { type: 'fill' } })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer text-center ${
                  selectedNode.sizing.type === 'fill'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)]'
                    : 'bg-surface-secondary text-muted border-subtle hover:text-white'
                }`}
                title="Expands to fill available row or column space"
              >
                Fill Space
              </button>

              <button
                type="button"
                onClick={() => onUpdateComponent(selectedNode.id, { sizing: { type: 'fixed', value: '300px' } })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer text-center ${
                  selectedNode.sizing.type === 'fixed'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)]'
                    : 'bg-surface-secondary text-muted border-subtle hover:text-white'
                }`}
                title="Fixed width (e.g. 300px for sidebar or media)"
              >
                Fixed Width
              </button>

              <button
                type="button"
                onClick={() => onUpdateComponent(selectedNode.id, { sizing: { type: 'auto' } })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer text-center ${
                  selectedNode.sizing.type === 'auto'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)]'
                    : 'bg-surface-secondary text-muted border-subtle hover:text-white'
                }`}
                title="Sizes naturally to content"
              >
                Auto / Fit
              </button>
            </div>

            {selectedNode.sizing.type === 'fixed' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={selectedNode.sizing.value || '300px'}
                  onChange={(e) =>
                    onUpdateComponent(selectedNode.id, {
                      sizing: { type: 'fixed', value: e.target.value },
                    })
                  }
                  placeholder="e.g. 320px or 50%"
                  className="flex-1 px-2.5 py-1 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong font-mono focus:outline-none focus:border-[var(--primary-accent)]"
                />
                <span className="text-[10px] text-muted">e.g. 300px, 50%</span>
              </div>
            )}
          </div>

          {/* Style Presentation Variant */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Visual Presentation Variant
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {VARIANT_OPTIONS.map((opt) => (
                <button
                  key={opt.variant}
                  type="button"
                  onClick={() => onUpdateComponent(selectedNode.id, { variant: opt.variant })}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition cursor-pointer text-left ${
                    selectedNode.variant === opt.variant
                      ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-white'
                      : 'bg-surface-secondary border-subtle text-muted hover:text-white'
                  }`}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bound Field Selector (for field components) */}
          {selectedNode.componentType === 'field' && template?.fields && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Bound Schema Field
              </label>
              <select
                value={selectedNode.field_id || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const f = template.fields?.find((item) => item.id === val);
                  onUpdateComponent(selectedNode.id, {
                    field_id: val || null,
                    label: f ? f.label : selectedNode.label,
                  });
                }}
                className="px-2.5 py-1.5 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)]"
              >
                <option value="">-- Select Field --</option>
                {template.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.field_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* Parent Navigation Breadcrumb */}
      {parentNode && (
        <div className="pt-2 border-t border-subtle flex items-center justify-between">
          <span className="text-[10px] text-muted">Parent Container:</span>
          <button
            type="button"
            onClick={() => onSelectNode(parentNode.id)}
            className="text-xs font-semibold text-[var(--primary-accent)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>⬆</span>
            <span>{parentNode.label || 'Parent Container'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

