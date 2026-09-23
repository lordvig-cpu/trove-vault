'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ItemTemplate } from '@/types/template';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  findFlexNode,
} from '@/types/layout';
import { useCanvasZoom } from '@/context/CanvasZoomContext';
import TemplateEditorBar from '@/components/TemplateEditorBar';
import ScaledCanvas from '@/components/template-canvas/ScaledCanvas';
import FlexContainerRenderer from '@/components/template-canvas/FlexContainerRenderer';

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
  onOverflowChange?: (containerId: string, isOverflowing: boolean) => void;

  canvasMode: 'edit' | 'preview';
  onDoneEditing: () => void;
  onToggleCanvasMode: () => void;
  /** Whether the Structure tree's side panel is currently visible, and how to open it unpinned
      when it isn't — passed through to the toolbar gear. */
  isStructurePanelOpen?: boolean;
  onOpenStructurePanel?: () => void;
  structurePanelSelector?: string;
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
  onUpdateFlexComponent,
  onRemoveFlexComponent,
  onPlaceField,
  onResetFlexLayout,
  onSplitContainer,
  onOverflowChange,

  canvasMode,
  onDoneEditing,
  onToggleCanvasMode,
  isStructurePanelOpen,
  onOpenStructurePanel,
  structurePanelSelector,
}: TemplateEditorStageProps) {
  const fields = template.fields || [];

  // Preview width and zoom are editor-only: every editing session starts at Fit / 100%.
  const { setPreviewWidth, resetZoom } = useCanvasZoom();
  useEffect(
    () => () => {
      setPreviewWidth('fit');
      resetZoom();
    },
    [setPreviewWidth, resetZoom]
  );

  const isFlexActive = Boolean(flexLayoutConfig?.root);

  // The editor bar (container tools, preview width, zoom) lives in the slot under the top header.
  const toolbarSlot =
    typeof document !== 'undefined' ? document.getElementById('template-toolbar-slot') : null;
  const selectedNode =
    flexLayoutConfig?.root && selectedNodeId ? findFlexNode(flexLayoutConfig.root, selectedNodeId) : null;
  const toolbarContainer = selectedNode?.nodeType === 'container' ? selectedNode : null;

  return (
    <div className="w-full mx-auto p-3 flex-1 flex flex-col gap-6 select-none min-h-0">
      {isFlexActive && toolbarSlot &&
        createPortal(
          <TemplateEditorBar
            container={toolbarContainer}
            isRoot={!!toolbarContainer && toolbarContainer.id === flexLayoutConfig?.root.id}
            showContainerTools={canvasMode === 'edit'}
            onUpdateContainer={onUpdateFlexContainer}
            onAddContainer={onAddFlexContainer}
            onInsertContainerSibling={onInsertContainerSibling}
            onSplitContainer={onSplitContainer}
            onRemoveContainer={onRemoveFlexContainer}
            onSelectNode={onSelectNode}
            isStructurePanelOpen={isStructurePanelOpen}
            onOpenStructurePanel={onOpenStructurePanel}
            structurePanelSelector={structurePanelSelector}
          />,
          toolbarSlot
        )}
      {/* --------------------------------------------------------------------
          1. BLUEPRINT HEADER BANNER & CANVAS TOOLBAR
          -------------------------------------------------------------------- */}
      <div className="tmpl-editor-stage-banner w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl">
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
                Auto-Layout Builder
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
        <ScaledCanvas>
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
            onOverflowChange={onOverflowChange}
          />
        </ScaledCanvas>
      ) : (
        <div className="w-full max-w-6xl mx-auto py-16 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <span className="text-sm font-bold text-slate-300">No layout yet</span>
          <p className="text-xs text-slate-500 max-w-sm">
            Generate a starter layout from this template&apos;s fields to begin designing.
          </p>
          <button
            type="button"
            onClick={onResetFlexLayout}
            className="mt-2 px-4 py-2 text-xs font-semibold bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white rounded-xl transition cursor-pointer"
          >
            Auto-Generate Layout
          </button>
        </div>
      )}
    </div>
  );
}
