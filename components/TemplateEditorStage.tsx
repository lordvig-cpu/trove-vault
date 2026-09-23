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
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
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

  // The editor bar (template name, mode toggle, save, container tools, preview width, zoom) lives
  // in the slot under the top header. It hangs over the top of this stage, hence the extra top padding.
  const toolbarSlot =
    typeof document !== 'undefined' ? document.getElementById('template-toolbar-slot') : null;
  const selectedNode =
    flexLayoutConfig?.root && selectedNodeId ? findFlexNode(flexLayoutConfig.root, selectedNodeId) : null;
  const toolbarContainer = selectedNode?.nodeType === 'container' ? selectedNode : null;

  return (
    <div className="w-full mx-auto p-3 pt-14 flex-1 flex flex-col gap-6 select-none min-h-0">
      {toolbarSlot &&
        createPortal(
          <TemplateEditorBar
            templateIcon={template.icon}
            templateName={template.name}
            canvasMode={canvasMode}
            onToggleCanvasMode={onToggleCanvasMode}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            onSave={onDoneEditing}
            hasLayout={isFlexActive}
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
          VISUAL CANVAS STAGE (Flexbox Engine or Legacy Grid Fallback)
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
