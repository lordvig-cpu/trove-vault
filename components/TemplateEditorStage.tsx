'use client';

import React, { useState } from 'react';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition } from '@/types/field';
import {
  TemplateLayoutConfig,
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  LayoutSection,
  LayoutBlock,
} from '@/types/layout';

/* ==========================================================================
   1. PROPS INTERFACE
   ========================================================================== */

interface TemplateEditorStageProps {
  template: ItemTemplate;
  // Modern Flexbox Layout Engine Props
  flexLayoutConfig?: TemplateFlexLayoutConfig | null;
  selectedNodeId?: string | null;
  activeContainerId?: string;
  onSelectNode?: (nodeId: string | null) => void;
  onAddPrimitive?: (
    primitiveType: 'row' | 'column' | 'split-2' | 'split-3' | 'card',
    targetContainerId?: string
  ) => string;
  onAddFlexContainer?: (
    targetContainerId: string,
    options?: Partial<FlexContainerNode>
  ) => string;
  onUpdateFlexContainer?: (
    containerId: string,
    partial: Partial<FlexContainerNode>
  ) => void;
  onRemoveFlexContainer?: (containerId: string) => void;
  onAddFlexComponent?: (
    targetContainerId: string,
    options: Omit<FlexComponentNode, 'id' | 'nodeType'>
  ) => string;
  onUpdateFlexComponent?: (
    componentId: string,
    partial: Partial<FlexComponentNode>
  ) => void;
  onRemoveFlexComponent?: (componentId: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  onResetFlexLayout?: () => void;

  // Legacy / fallback props
  layoutConfig?: TemplateLayoutConfig | null;
  selectedBlockId?: string | null;
  selectedFieldId?: number | null;
  canvasMode: 'edit' | 'preview';
  onSelectBlock?: (blockId: string | null) => void;
  onSelectField?: (fieldId: number | null) => void;
  onDoneEditing: () => void;
  onAddField?: () => void;
  onAddSection?: (title?: string) => void;
  onRemoveSection?: (sectionId: string) => void;
  onUpdateSection?: (sectionId: string, partial: Partial<LayoutSection>) => void;
  onAddBlock?: (sectionId: string, block: Omit<LayoutBlock, 'id'>) => void;
  onUpdateBlock?: (
    sectionId: string,
    blockId: string,
    partial: Partial<LayoutBlock>
  ) => void;
  onRemoveBlock?: (sectionId: string, blockId: string) => void;
  onMoveBlock?: (
    fromSectionId: string,
    toSectionId: string,
    blockId: string,
    toIndex?: number
  ) => void;
  onResetLayout?: () => void;
  onToggleCanvasMode: () => void;
}

/* ==========================================================================
   2. RECURSIVE FLEX CONTAINER RENDERER
   ========================================================================== */

function FlexContainerRenderer({
  container,
  isRoot,
  selectedNodeId,
  activeContainerId,
  canvasMode,
  fields,
  onSelectNode,
  onAddPrimitive,
  onUpdateContainer,
  onRemoveContainer,
  onUpdateComponent,
  onRemoveComponent,
}: {
  container: FlexContainerNode;
  isRoot?: boolean;
  selectedNodeId?: string | null;
  activeContainerId?: string;
  canvasMode: 'edit' | 'preview';
  fields: FieldDefinition[];
  onSelectNode?: (id: string | null) => void;
  onAddPrimitive?: (
    type: 'row' | 'column' | 'split-2' | 'split-3' | 'card',
    targetId?: string
  ) => void;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (id: string) => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (id: string) => void;
}) {
  const isSelected = selectedNodeId === container.id;
  const isActive = activeContainerId === container.id;

  const justifyStyle =
    container.justify === 'between'
      ? 'space-between'
      : container.justify === 'around'
      ? 'space-around'
      : container.justify === 'center'
      ? 'center'
      : container.justify === 'end'
      ? 'flex-end'
      : 'flex-start';

  const flexStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: container.direction,
    gap: `${container.gap}px`,
    flexWrap: container.wrap ? 'wrap' : 'nowrap',
    alignItems: container.align,
    justifyContent: justifyStyle,
    padding:
      container.padding !== undefined
        ? `${container.padding}px`
        : isRoot
        ? '0px'
        : '12px',
    flex:
      container.sizing?.type === 'fixed'
        ? `0 0 ${container.sizing.value || 'auto'}`
        : container.sizing?.type === 'auto'
        ? '0 0 auto'
        : '1 1 0%',
    width:
      container.sizing?.type === 'fixed' && container.sizing.value
        ? container.sizing.value
        : undefined,
    minWidth: 0,
  };

  const isCard = container.isCard;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (canvasMode === 'edit') onSelectNode?.(container.id);
      }}
      className={`transition-all duration-150 relative ${
        canvasMode === 'preview'
          ? isCard
            ? 'rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md backdrop-blur-sm'
            : ''
          : isSelected
          ? 'rounded-2xl ring-2 ring-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_12%,transparent)] shadow-xl shadow-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] border border-[var(--primary-accent)] p-1.5'
          : isActive
          ? 'rounded-2xl border border-[color-mix(in_oklch,var(--primary-accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_6%,transparent)] p-1.5'
          : isCard
          ? 'rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 p-1.5'
          : 'rounded-2xl border border-dashed border-slate-800/70 bg-slate-950/20 hover:border-slate-700/70 p-1.5'
      }`}
    >
      {/* Container Header Bar in Edit Mode */}
      {canvasMode === 'edit' && !isRoot && (
        <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-800/60 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs">📁</span>
            <span className="text-[11px] font-bold text-slate-200 tracking-wide truncate">
              {container.label || 'Container'}
            </span>
            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-[var(--primary-accent)] border border-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)]">
              {container.direction === 'row' ? '➡ Row' : '⬇ Col'}
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {container.gap}px gap
            </span>
            {isCard && (
              <span className="text-[9px] font-bold text-emerald-400 px-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                Card
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {container.id !== 'root-container' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveContainer?.(container.id);
                }}
                className="text-xs text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10 transition cursor-pointer"
                title="Delete Container"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}

      {/* Children or Empty State */}
      <div style={flexStyle} className="w-full">
        {container.children.length === 0 ? (
          canvasMode === 'edit' ? (
            <div className="w-full py-6 border border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center gap-2 select-none bg-slate-900/10">
              <span className="text-[11px] text-slate-400 italic">
                Empty container. Drop or add layout primitives or components from the bottom panel.
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPrimitive?.('row', container.id);
                  }}
                  className="px-2 py-0.5 text-[10.5px] font-semibold text-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] rounded-md transition cursor-pointer"
                >
                  + Row
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPrimitive?.('column', container.id);
                  }}
                  className="px-2 py-0.5 text-[10.5px] font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-md transition cursor-pointer"
                >
                  + Column
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPrimitive?.('card', container.id);
                  }}
                  className="px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition cursor-pointer"
                >
                  + Card Frame
                </button>
              </div>
            </div>
          ) : null
        ) : (
          container.children.map((child) => {
            if (child.nodeType === 'container') {
              return (
                <FlexContainerRenderer
                  key={child.id}
                  container={child}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  canvasMode={canvasMode}
                  fields={fields}
                  onSelectNode={onSelectNode}
                  onAddPrimitive={onAddPrimitive}
                  onUpdateContainer={onUpdateContainer}
                  onRemoveContainer={onRemoveContainer}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveComponent={onRemoveComponent}
                />
              );
            }
            return (
              <FlexComponentRenderer
                key={child.id}
                component={child}
                selectedNodeId={selectedNodeId}
                canvasMode={canvasMode}
                fields={fields}
                onSelectNode={onSelectNode}
                onRemoveComponent={onRemoveComponent}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   3. FLEX COMPONENT RENDERER
   ========================================================================== */

function FlexComponentRenderer({
  component,
  selectedNodeId,
  canvasMode,
  fields,
  onSelectNode,
  onRemoveComponent,
}: {
  component: FlexComponentNode;
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

/* ==========================================================================
   4. MAIN EXPORT: TemplateEditorStage
   ========================================================================== */

export default function TemplateEditorStage({
  template,
  flexLayoutConfig,
  selectedNodeId,
  activeContainerId,
  onSelectNode,
  onAddPrimitive,
  onAddFlexContainer,
  onUpdateFlexContainer,
  onRemoveFlexContainer,
  onAddFlexComponent,
  onUpdateFlexComponent,
  onRemoveFlexComponent,
  onPlaceField,
  onResetFlexLayout,

  // Legacy / fallback props
  layoutConfig,
  selectedBlockId,
  selectedFieldId,
  canvasMode,
  onSelectBlock,
  onSelectField,
  onDoneEditing,
  onAddField,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onResetLayout,
  onToggleCanvasMode,
}: TemplateEditorStageProps) {
  const fields = template.fields || [];
  const sections = layoutConfig?.sections || [];

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const getFieldForBlock = (block: LayoutBlock): FieldDefinition | undefined => {
    if (!block.field_id) return undefined;
    return fields.find((f) => f.id === block.field_id);
  };

  const isFlexActive = Boolean(flexLayoutConfig?.root);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-6 select-none">
      {/* --------------------------------------------------------------------
          1. BLUEPRINT HEADER BANNER & CANVAS TOOLBAR
          -------------------------------------------------------------------- */}
      <div className="tmpl-editor-stage-banner flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_40%,transparent)] flex items-center justify-center text-2xl shadow-md shrink-0">
            {template.icon || '📦'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide truncate">
                {template.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] text-[var(--primary-accent)] border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] shrink-0">
                {isFlexActive ? 'Auto-Layout Builder' : '12-Col Grid Builder'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {template.description || 'Custom visual layout schema'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canvas Mode Toggle: Edit vs Preview */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'edit') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'edit'
                  ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>✏️</span>
              <span>Builder Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'preview') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'preview'
                  ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>👁️</span>
              <span>Live Item Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onDoneEditing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white shadow-lg shadow-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] flex items-center gap-1.5 transition hover:scale-[1.02] cursor-pointer"
            title="Exit template editor and restore previous tab workspace"
          >
            <span>✓</span>
            <span>Done Editing</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. VISUAL CANVAS STAGE (Flexbox Engine or Legacy Grid Fallback)
          -------------------------------------------------------------------- */}
      {isFlexActive && flexLayoutConfig?.root ? (
        <div className="flex flex-col gap-6">
          <FlexContainerRenderer
            container={flexLayoutConfig.root}
            isRoot
            selectedNodeId={selectedNodeId}
            activeContainerId={activeContainerId}
            canvasMode={canvasMode}
            fields={fields}
            onSelectNode={onSelectNode}
            onAddPrimitive={onAddPrimitive}
            onUpdateContainer={onUpdateFlexContainer}
            onRemoveContainer={onRemoveFlexContainer}
            onUpdateComponent={onUpdateFlexComponent}
            onRemoveComponent={onRemoveFlexComponent}
          />
        </div>
      ) : sections.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <span className="text-4xl">📐</span>
          <span className="text-sm font-bold text-slate-300">
            No Layout Sections Created
          </span>
          <p className="text-xs text-slate-500 max-w-sm">
            Generate a starter layout based on template fields or add custom
            sections to begin visual design.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onResetFlexLayout || onResetLayout}
              className="px-4 py-2 text-xs font-semibold bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white rounded-xl transition cursor-pointer"
            >
              Auto-Generate Layout
            </button>
            {onAddSection && (
              <button
                type="button"
                onClick={() => onAddSection('General Information')}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-subtle transition cursor-pointer"
              >
                + Add First Section
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm"
            >
              {/* Section Header Row */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm select-none">📁</span>
                  {editingSectionId === sec.id &&
                  canvasMode === 'edit' &&
                  onUpdateSection ? (
                    <input
                      type="text"
                      autoFocus
                      defaultValue={sec.title}
                      onBlur={(e) => {
                        onUpdateSection(sec.id, {
                          title: e.target.value.trim() || sec.title,
                        });
                        setEditingSectionId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateSection(sec.id, {
                            title:
                              (e.target as HTMLInputElement).value.trim() ||
                              sec.title,
                          });
                          setEditingSectionId(null);
                        }
                      }}
                      className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-[var(--primary-accent)] focus:outline-none"
                    />
                  ) : (
                    <h2
                      onClick={() =>
                        canvasMode === 'edit' && setEditingSectionId(sec.id)
                      }
                      className={`text-xs font-bold text-slate-200 uppercase tracking-wider truncate ${
                        canvasMode === 'edit'
                          ? 'cursor-pointer hover:text-[var(--primary-accent)]'
                          : ''
                      }`}
                      title={
                        canvasMode === 'edit'
                          ? 'Click to rename section'
                          : undefined
                      }
                    >
                      {sec.title}
                    </h2>
                  )}

                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {sec.blocks.length} blocks
                  </span>
                </div>

                {/* Section Controls (Edit Mode Only) */}
                {canvasMode === 'edit' && onAddBlock && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onAddBlock(sec.id, {
                          type: 'table',
                          label: 'Specifications Table',
                          col_span: 12,
                          row_span: 4,
                          variant: 'table_row',
                        })
                      }
                      className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-subtle transition cursor-pointer flex items-center gap-1"
                      title="Add 4-row specifications table"
                    >
                      <span>📊</span>
                      <span>+ Table (4x)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAddBlock(sec.id, {
                          type: 'media',
                          label: 'Hero Artwork',
                          col_span: 6,
                          row_span: 4,
                          variant: 'hero',
                        })
                      }
                      className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-subtle transition cursor-pointer flex items-center gap-1"
                      title="Add 4-row hero media box"
                    >
                      <span>🖼️</span>
                      <span>+ Media Box (4x)</span>
                    </button>

                    {sections.length > 1 && onRemoveSection && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete section "${sec.title}" and its blocks?`
                            )
                          ) {
                            onRemoveSection(sec.id);
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer transition ml-1"
                        title="Delete Section"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 12-Column Grid Canvas */}
              {sec.blocks.length === 0 ? (
                <div className="py-8 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-xs text-slate-400 italic">
                    This section is empty.
                  </span>
                </div>
              ) : (
                <div className="tmpl-grid-canvas">
                  {sec.blocks.map((block) => {
                    const isBlockSelected = selectedBlockId === block.id;
                    const boundField = getFieldForBlock(block);
                    const blockLabel =
                      block.label || boundField?.label || block.type;

                    const blockStyle: React.CSSProperties = {
                      gridColumn: `span ${block.col_span}`,
                      gridRow: `span ${block.row_span}`,
                    };

                    return (
                      <div
                        key={block.id}
                        style={blockStyle}
                        onClick={() => {
                          onSelectBlock?.(block.id);
                          if (boundField) onSelectField?.(boundField.id);
                        }}
                        className={`tmpl-grid-block tmpl-block-variant-${
                          block.variant
                        } ${
                          isBlockSelected ? 'tmpl-grid-block-selected' : ''
                        } ${canvasMode === 'edit' ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex flex-col justify-between h-full min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-200 truncate block">
                              {blockLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
