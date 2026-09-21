'use client';

import React, { useState, useEffect } from 'react';
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
import {
  BodyIcon,
  FlexRowIcon,
  FlexColumnIcon,
  LayoutContainerIcon,
  SplitColumnsIcon,
  SplitRowsIcon,
  DashedSquareQuestionIcon,
  AddContainerBeforeIcon,
  AddChildContainerIcon,
  AddContainerAfterIcon,
} from '@/components/icons/LayoutIcons';
import { GearIcon } from '@/components/icons/ExplorerIcons';

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
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
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
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows') => void;

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
  parentContainer,
  selectedNodeId,
  activeContainerId,
  canvasMode,
  fields,
  onSelectNode,
  onAddPrimitive,
  onAddContainer,
  onInsertContainerSibling,
  onUpdateContainer,
  onRemoveContainer,
  onSplitContainer,
  onUpdateComponent,
  onRemoveComponent,
  onPlaceField,
}: {
  container: FlexContainerNode;
  isRoot?: boolean;
  parentContainer?: FlexContainerNode;
  selectedNodeId?: string | null;
  activeContainerId?: string;
  canvasMode: 'edit' | 'preview';
  fields: FieldDefinition[];
  onSelectNode?: (id: string | null) => void;
  onAddPrimitive?: (
    type: 'row' | 'column' | 'split-2' | 'split-3' | 'card',
    targetId?: string
  ) => void;
  onAddContainer?: (
    targetContainerId: string,
    options?: Partial<FlexContainerNode>
  ) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (id: string) => void;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows') => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (id: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedNodeId === container.id;
  const isActive = activeContainerId === container.id;
  const [isTreeMenuOpen, setIsTreeMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (
        typeof customEvent.detail === 'string' &&
        customEvent.detail.startsWith(`tree-container-${container.id}`)
      ) {
        setIsTreeMenuOpen(true);
      } else {
        setIsTreeMenuOpen(false);
      }
    };

    const handleClose = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (
        !customEvent.detail ||
        (typeof customEvent.detail === 'string' &&
          customEvent.detail.startsWith(`tree-container-${container.id}`))
      ) {
        setIsTreeMenuOpen(false);
      }
    };

    window.addEventListener('explorer-action-menu-open', handleOpen);
    window.addEventListener('explorer-action-menu-close', handleClose);
    return () => {
      window.removeEventListener('explorer-action-menu-open', handleOpen);
      window.removeEventListener('explorer-action-menu-close', handleClose);
    };
  }, [container.id]);

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

  const isUnsetDirection = container.direction === 'none' || !container.direction;

  const outerStyle: React.CSSProperties = {
    flex:
      container.sizing?.type === 'fixed'
        ? `0 0 ${container.sizing.value || 'auto'}`
        : container.sizing?.type === 'auto'
        ? '0 0 auto'
        : '1 1 0%',
    width:
      container.sizing?.type === 'fixed' && container.sizing.value
        ? container.sizing.value
        : container.width || undefined,
    height: container.height || container.sizing?.height || undefined,
    minHeight: container.minHeight || container.sizing?.minHeight || undefined,
    minWidth: 0,
  };

  const innerFlexStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection:
      container.direction === 'row'
        ? 'row'
        : container.direction === 'column'
        ? 'column'
        : isRoot
        ? 'column'
        : undefined,
    gap: `${container.gap}px`,
    flexWrap: container.wrap ? 'wrap' : 'nowrap',
    alignItems: container.align,
    justifyContent: justifyStyle,
    padding:
      container.padding !== undefined
        ? `${container.padding}px`
        : '0px',
  };

  const isCard = container.isCard;

  return (
    <div
      data-container-id={container.id}
      onClick={(e) => {
        e.stopPropagation();
        if (canvasMode === 'edit') onSelectNode?.(container.id);
      }}
      onDragOver={(e) => {
        if (canvasMode !== 'edit') return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        if (canvasMode !== 'edit') return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        if (canvasMode !== 'edit') return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const fieldIdStr =
          e.dataTransfer.getData('application/x-trove-field-id') ||
          e.dataTransfer.getData('text/plain');
        if (fieldIdStr) {
          const fieldId = parseInt(fieldIdStr, 10);
          if (!isNaN(fieldId)) {
            onPlaceField?.(fieldId, container.id);
            onSelectNode?.(container.id);
          }
        }
      }}
      style={!isRoot ? outerStyle : undefined}
      className={`transition-all duration-150 relative ${
        isSelected ? 'z-20' : 'z-10'
      } ${
        isRoot ? 'flex-1 flex flex-col min-h-0 w-full' : 'flex flex-col'
      } ${
        canvasMode === 'preview'
          ? isCard
            ? 'rounded-2xl bg-[var(--content-card-bg)] border border-[var(--content-card-border)] shadow-md backdrop-blur-sm'
            : ''
          : isDragOver
          ? 'rounded-2xl border-2 border-[var(--primary-accent)] ring-2 ring-[var(--primary-accent)] ring-offset-2 ring-offset-[var(--surface-panel)] bg-[color-mix(in_oklch,var(--primary-accent)_16%,transparent)] shadow-2xl shadow-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)]'
          : isSelected
          ? 'rounded-2xl border-2 border-white bg-[color-mix(in_oklch,var(--primary-accent)_8%,transparent)] shadow-xl shadow-white/10'
          : isActive
          ? 'rounded-2xl border border-[color-mix(in_oklch,var(--primary-accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_6%,transparent)]'
          : isCard
          ? 'rounded-2xl border border-[var(--primary-border-subtle)] bg-[color-mix(in_oklch,var(--panel-surface-bg)_60%,transparent)] hover:border-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
          : 'rounded-2xl border border-dashed border-[var(--primary-border-subtle)] bg-[color-mix(in_oklch,var(--panel-surface-bg)_25%,transparent)] hover:border-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
      }`}
    >
      {/* Floating Action Toolbar in Edit Mode - Connected to container border */}
      {canvasMode === 'edit' && isSelected && (
        <div
          className="tmpl-container-floating-toolbar absolute bottom-full left-3.5 z-30 select-none pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-2.5 py-1.5 min-w-0">
            {/* Quick Direction Toggle Buttons (3-Button Layout Suite) */}
            <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Container flex direction">
              <button
                type="button"
                disabled={isRoot}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) onUpdateContainer?.(container.id, { direction: 'none' });
                }}
                title={isRoot ? "Generic container layout (default for Root Body — cannot be changed)" : "Generic container layout (unset flow) — click to remove row/column distinction"}
                aria-label="Generic container layout"
                aria-pressed={isUnsetDirection}
                className={`p-1 rounded-md border transition flex items-center justify-center ${
                  isRoot
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-[var(--primary-accent)] opacity-80 cursor-not-allowed'
                    : isUnsetDirection
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-[var(--primary-accent)] shadow-sm cursor-pointer'
                    : 'bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white cursor-pointer'
                }`}
              >
                <LayoutContainerIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={isRoot}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) onUpdateContainer?.(container.id, { direction: 'row' });
                }}
                title={isRoot ? "Row layout is not available for Root Body" : "Row layout (horizontal flow) — click to switch"}
                aria-label="Row layout"
                aria-pressed={container.direction === 'row'}
                className={`p-1 rounded-md border transition flex items-center justify-center ${
                  isRoot
                    ? 'opacity-35 cursor-not-allowed bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)]'
                    : container.direction === 'row'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-[var(--primary-accent)] shadow-sm cursor-pointer'
                    : 'bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white cursor-pointer'
                }`}
              >
                <FlexRowIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={isRoot}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) onUpdateContainer?.(container.id, { direction: 'column' });
                }}
                title={isRoot ? "Column layout is not available for Root Body" : "Column layout (vertical flow) — click to switch"}
                aria-label="Column layout"
                aria-pressed={container.direction === 'column'}
                className={`p-1 rounded-md border transition flex items-center justify-center ${
                  isRoot
                    ? 'opacity-35 cursor-not-allowed bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)]'
                    : container.direction === 'column'
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-[var(--primary-accent)] shadow-sm cursor-pointer'
                    : 'bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white cursor-pointer'
                }`}
              >
                <FlexColumnIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-3.5 w-px bg-[color-mix(in_oklch,var(--primary-accent)_35%,var(--primary-border-subtle))] shrink-0" />

            <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[130px]">
              {isRoot ? 'Body' : container.label || 'Container'}
            </span>
            {!isRoot && isCard && (
              <span className="text-[9px] font-bold text-emerald-400 px-1 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                Card
              </span>
            )}

            {/* Sizing Mode Pill (Auto / Custom) */}
            <div
              className="flex items-center gap-0.5 bg-[color-mix(in_oklch,var(--panel-surface-bg)_80%,transparent)] p-0.5 rounded-md border border-[var(--primary-border-subtle)] shrink-0 text-[10px] font-semibold"
              role="group"
              aria-label="Container sizing mode"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) onUpdateContainer?.(container.id, { sizing: { type: 'fill' } });
                }}
                title={isRoot ? "Auto: Root Body stretches automatically with content" : "Auto: stretches container to fill available parent space"}
                className={`px-1.5 py-0.5 rounded transition ${
                  isRoot
                    ? 'bg-[var(--primary-accent)] text-white shadow-xs cursor-default'
                    : (container.sizing?.type || 'fill') === 'fill'
                    ? 'bg-[var(--primary-accent)] text-white shadow-xs cursor-pointer'
                    : 'text-[var(--text-muted)] hover:text-white cursor-pointer'
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                disabled={isRoot}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) {
                    onUpdateContainer?.(container.id, {
                      sizing: {
                        type: 'fixed',
                        value: container.sizing?.type === 'fixed' ? container.sizing.value || '50%' : '50%',
                      },
                    });
                  }
                }}
                title={isRoot ? "Custom fixed sizing is not available for Root Body (expands automatically with content)" : "Custom: user specifies custom width/height (e.g. 50%, 300px)"}
                className={`px-1.5 py-0.5 rounded transition ${
                  isRoot
                    ? 'opacity-35 cursor-not-allowed text-[var(--text-muted)]'
                    : container.sizing?.type === 'fixed'
                    ? 'bg-[var(--primary-accent)] text-white shadow-xs cursor-pointer'
                    : 'text-[var(--text-muted)] hover:text-white cursor-pointer'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Split Container Buttons (Middle) */}
            {isRoot ? (
              <>
                <div className="h-3.5 w-px bg-[color-mix(in_oklch,var(--primary-accent)_35%,var(--primary-border-subtle))] shrink-0" />
                <div
                  className="flex items-center justify-center gap-1 shrink-0"
                  role="group"
                  aria-label="Split container"
                >
                  <button
                    type="button"
                    disabled
                    title="Root Body cannot be split"
                    aria-label="Split into 2 Columns (Disabled for Body)"
                    className="p-1 rounded-md border flex items-center justify-center opacity-35 cursor-not-allowed bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)]"
                  >
                    <SplitColumnsIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Root Body cannot be split"
                    aria-label="Split into 2 Rows (Disabled for Body)"
                    className="p-1 rounded-md border flex items-center justify-center opacity-35 cursor-not-allowed bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)]"
                  >
                    <SplitRowsIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              (container.direction === 'row' || container.direction === 'column') && (
                <>
                  <div className="h-3.5 w-px bg-[color-mix(in_oklch,var(--primary-accent)_35%,var(--primary-border-subtle))] shrink-0" />
                  <div
                    className="flex items-center justify-center gap-1 shrink-0"
                    role="group"
                    aria-label="Split container"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitContainer?.(container.id, 'columns');
                      }}
                      title="Split into 2 Columns (side-by-side)"
                      aria-label="Split into 2 Columns"
                      className="p-1 rounded-md border transition cursor-pointer flex items-center justify-center bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white hover:bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)]"
                    >
                      <SplitColumnsIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitContainer?.(container.id, 'rows');
                      }}
                      title="Split into 2 Rows (stacked)"
                      aria-label="Split into 2 Rows"
                      className="p-1 rounded-md border transition cursor-pointer flex items-center justify-center bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white hover:bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)]"
                    >
                      <SplitRowsIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )
            )}

            <div className="h-3.5 w-px bg-[color-mix(in_oklch,var(--primary-accent)_35%,var(--primary-border-subtle))] shrink-0" />

            {/* Add Container Before, Child, and After Buttons */}
            <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Add container before, child, or after">
              {/* Add Container Before */}
              <button
                type="button"
                disabled={isRoot}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) {
                    onInsertContainerSibling?.(container.id, 'before', { label: 'New Container', direction: 'none', padding: 0, sizing: { type: 'fill' } });
                  }
                }}
                title={isRoot ? "Add Container Before is not available for Root Body" : "Add Container Before"}
                aria-label="Add Container Before"
                className={`p-1 rounded-md border transition flex items-center justify-center ${
                  isRoot
                    ? 'opacity-35 cursor-not-allowed bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)]'
                    : 'bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white hover:bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] cursor-pointer'
                }`}
              >
                <AddContainerBeforeIcon className="w-3.5 h-3.5" />
              </button>

              {/* Add Child Container (In the middle) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddContainer?.(container.id, { label: 'New Container', direction: 'none', padding: 0, sizing: { type: 'fill' } });
                }}
                title={isRoot ? "Add Child Container (Insert nested container into Body)" : "Add Child Container (Insert nested container inside)"}
                aria-label="Add Child Container"
                className="p-1 rounded-md border transition flex items-center justify-center bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white hover:bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] cursor-pointer"
              >
                <AddChildContainerIcon className="w-3.5 h-3.5" />
              </button>

              {/* Add Container After */}
              <button
                type="button"
                disabled={isRoot}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRoot) {
                    onInsertContainerSibling?.(container.id, 'after', { label: 'New Container', direction: 'none', padding: 0, sizing: { type: 'fill' } });
                  }
                }}
                title={isRoot ? "Add Container After is not available for Root Body" : "Add Container After"}
                aria-label="Add Container After"
                className={`p-1 rounded-md border transition flex items-center justify-center ${
                  isRoot
                    ? 'opacity-35 cursor-not-allowed bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)]'
                    : 'bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white hover:bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] cursor-pointer'
                }`}
              >
                <AddContainerAfterIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-3.5 w-px bg-[color-mix(in_oklch,var(--primary-accent)_35%,var(--primary-border-subtle))] shrink-0" />

            {/* Gear Button: Triggers connected side panel gear and action menu */}
            <button
              type="button"
              data-gear-trigger
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode?.(container.id);
                const treeGear = document.querySelector<HTMLElement>(`[data-tree-gear-id="${container.id}"]`);
                if (treeGear) {
                  treeGear.click();
                }
              }}
              title={isRoot ? 'Body Properties' : 'Container Properties'}
              aria-label={isRoot ? 'Body properties' : 'Container properties'}
              aria-expanded={isTreeMenuOpen}
              className={`p-1 rounded-md border transition cursor-pointer flex items-center justify-center shrink-0 ${
                isTreeMenuOpen
                  ? 'bg-[var(--primary-accent)] text-white border-[var(--primary-accent)] shadow-sm'
                  : 'bg-[color-mix(in_oklch,var(--panel-surface-bg)_70%,transparent)] border-[var(--primary-border-subtle)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-white'
              }`}
            >
              <GearIcon
                isActive={isTreeMenuOpen}
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isTreeMenuOpen ? 'rotate-90 text-white' : ''
                }`}
              />
            </button>

            {/* Trash Delete Button */}
            {isRoot ? (
              <button
                type="button"
                disabled
                title="Root Body container cannot be deleted"
                aria-label="Delete Container (Disabled for Body)"
                className="text-xs p-0.5 rounded opacity-35 cursor-not-allowed shrink-0"
              >
                🗑️
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveContainer?.(container.id);
                }}
                className="text-xs text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10 transition cursor-pointer shrink-0"
                title="Delete Container"
                aria-label="Delete Container"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}

      {/* Children or Empty State */}
      <div style={innerFlexStyle} className={`w-full flex-1 min-h-0 ${isRoot ? 'flex flex-col' : ''}`}>
        {container.children.length === 0 ? (
          canvasMode === 'edit' ? (
            <div
              title="Drag and drop to add content"
              className={`w-full ${isRoot ? 'flex-1 min-h-[220px]' : 'min-h-[140px]'} py-6 px-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-2.5 select-none transition-all group cursor-pointer ${
                isDragOver
                  ? 'border-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] shadow-lg shadow-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)]'
                  : 'border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_5%,transparent)] hover:border-[color-mix(in_oklch,var(--primary-accent)_65%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_9%,transparent)]'
              }`}
            >
              {/* Empty Container Icon Badge */}
              <div
                title="Drag and drop to add content"
                className="w-11 h-11 rounded-xl border border-[color-mix(in_oklch,var(--primary-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_12%,transparent)] text-[var(--primary-accent)] flex items-center justify-center shadow-lg shadow-black/25 group-hover:scale-105 transition-transform"
              >
                <DashedSquareQuestionIcon className="w-6 h-6" />
              </div>

              {/* Title / Drag Feedback */}
              <div className="flex flex-col items-center gap-0.5" title="Drag and drop to add content">
                {isDragOver ? (
                  <span className="text-xs font-bold text-[var(--primary-accent)] flex items-center gap-1.5 animate-pulse">
                    <span>📥</span> Drop field to insert into {container.label || (isRoot ? 'Body' : 'Container')}
                  </span>
                ) : (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    EMPTY
                  </h4>
                )}
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
                  parentContainer={container}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  canvasMode={canvasMode}
                  fields={fields}
                  onSelectNode={onSelectNode}
                  onAddPrimitive={onAddPrimitive}
                  onAddContainer={onAddContainer}
                  onInsertContainerSibling={onInsertContainerSibling}
                  onUpdateContainer={onUpdateContainer}
                  onRemoveContainer={onRemoveContainer}
                  onSplitContainer={onSplitContainer}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveComponent={onRemoveComponent}
                  onPlaceField={onPlaceField}
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
  onInsertContainerSibling,
  onUpdateFlexContainer,
  onRemoveFlexContainer,
  onAddFlexComponent,
  onUpdateFlexComponent,
  onRemoveFlexComponent,
  onPlaceField,
  onResetFlexLayout,
  onSplitContainer,

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
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex-1 flex flex-col gap-6 select-none min-h-0">
      {/* --------------------------------------------------------------------
          1. BLUEPRINT HEADER BANNER & CANVAS TOOLBAR
          -------------------------------------------------------------------- */}
      <div className="tmpl-editor-stage-banner flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl">
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
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
              {template.description || 'Custom visual layout schema'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canvas Mode Toggle: Edit vs Preview */}
          <div className="flex items-center bg-[color-mix(in_oklch,var(--panel-surface-bg)_80%,transparent)] p-0.5 rounded-xl border border-[color-mix(in_oklch,var(--primary-accent)_25%,var(--primary-border-subtle))]">
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'edit') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'edit'
                  ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
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
                  : 'text-[var(--text-muted)] hover:text-white'
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
        <div className="flex-1 flex flex-col min-h-0 gap-6 pt-8">
          <FlexContainerRenderer
            container={flexLayoutConfig.root}
            isRoot
            selectedNodeId={selectedNodeId}
            activeContainerId={activeContainerId}
            canvasMode={canvasMode}
            fields={fields}
            onSelectNode={onSelectNode}
            onAddPrimitive={onAddPrimitive}
            onAddContainer={onAddFlexContainer}
            onInsertContainerSibling={onInsertContainerSibling}
            onUpdateContainer={onUpdateFlexContainer}
            onRemoveContainer={onRemoveFlexContainer}
            onSplitContainer={onSplitContainer}
            onUpdateComponent={onUpdateFlexComponent}
            onRemoveComponent={onRemoveFlexComponent}
            onPlaceField={onPlaceField}
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
