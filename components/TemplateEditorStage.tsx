'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ItemTemplate } from '@/types/template';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  findFlexNode,
  type PlaceBuiltinHandler,
} from '@/types/layout';
import { useCanvasZoom } from '@/context/CanvasZoomContext';
import TemplateEditorBar from '@/components/TemplateEditorBar';
import TemplateEditorContainerBar from '@/components/TemplateEditorContainerBar';
import TemplateEditorContentBar from '@/components/TemplateEditorContentBar';
import ScaledCanvas from '@/components/template-canvas/ScaledCanvas';
import FlexContainerRenderer from '@/components/template-canvas/FlexContainerRenderer';
import { openNodeMenu } from '@/lib/layoutTreeMenu';
import FloatingNodeMenuHost from '@/components/FloatingNodeMenuHost';

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
    primitiveType: 'row' | 'column' | 'split-2' | 'split-3',
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
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
  onPlaceBuiltin?: PlaceBuiltinHandler;
  onResetFlexLayout?: () => void;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onOverflowChange?: (containerId: string, isOverflowing: boolean) => void;

  canvasMode: 'edit' | 'preview';
  /** Nodes hidden from the edit canvas by the Layout tree's eye. */
  hiddenNodeIds?: Set<string>;
  onToggleHidden?: (nodeId: string) => void;
  onDoneEditing: () => void;
  /** Saves the template's name / description / icon (the toolbar's rename and icon picker). */
  onUpdateTemplateMeta?: (name: string, description: string | null, icon: string) => void;
  onToggleCanvasMode: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Whether the Layout tree is on screen: a node's gear flyout slides out of its tree row then, and
      floats (at the cursor / under the toolbar gear) otherwise -- see lib/layoutTreeMenu.ts. */
  isLayoutPanelOpen?: boolean;
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
  onPlaceLoremIpsum,
  onPlaceBuiltin,
  onResetFlexLayout,
  onSplitContainer,
  onOverflowChange,

  canvasMode,
  hiddenNodeIds,
  onToggleHidden,
  onDoneEditing,
  onUpdateTemplateMeta,
  onToggleCanvasMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isLayoutPanelOpen,
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

  /** Right-click on the canvas (edit mode): the innermost container or content element under the pointer
   *  is selected and its gear flyout opens -- out of its Layout-tree row when the Layout tree is showing,
   *  otherwise as a floating menu right at the pointer. */
  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (canvasMode !== 'edit' || e.shiftKey) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-component-id], [data-container-id]');
    const nodeId = target?.dataset.componentId ?? target?.dataset.containerId;
    if (!nodeId) return;
    e.preventDefault();
    onSelectNode?.(nodeId);
    openNodeMenu(nodeId, { how: 'open', isLayoutPanelOpen, at: { x: e.clientX + 2, y: e.clientY + 2 } });
  };

  // The selected container's own toolbar (used more often) lives in the slot under the top header;
  // the template-wide toolbar lives in a matching slot at the workspace footer, above the bottom
  // panel. Each hangs over its edge of this stage, hence the extra top *and* bottom padding.
  const toolbarSlot =
    typeof document !== 'undefined' ? document.getElementById('template-toolbar-slot') : null;
  const bottomToolbarSlot =
    typeof document !== 'undefined' ? document.getElementById('template-toolbar-slot-bottom') : null;
  const selectedNode =
    flexLayoutConfig?.root && selectedNodeId ? findFlexNode(flexLayoutConfig.root, selectedNodeId) : null;
  const toolbarContainer = selectedNode?.nodeType === 'container' ? selectedNode : null;
  const showContainerTools = canvasMode === 'edit';

  return (
    <div className="w-full mx-auto p-3 pt-14 pb-14 flex-1 flex flex-col gap-6 select-none min-h-0">
      {toolbarSlot &&
        isFlexActive &&
        showContainerTools &&
        createPortal(
          <TemplateEditorContainerBar
            container={toolbarContainer}
            isRoot={!!toolbarContainer && toolbarContainer.id === flexLayoutConfig?.root.id}
            onUpdateContainer={onUpdateFlexContainer}
            onAddContainer={onAddFlexContainer}
            onInsertContainerSibling={onInsertContainerSibling}
            onSplitContainer={onSplitContainer}
            onRemoveContainer={onRemoveFlexContainer}
            onSelectNode={onSelectNode}
            isLayoutPanelOpen={isLayoutPanelOpen}
            isHidden={!!toolbarContainer && !!hiddenNodeIds?.has(toolbarContainer.id)}
            onToggleHidden={onToggleHidden}
          />,
          toolbarSlot
        )}
      {/* A selected content element gets its own toolbar in the same slot. */}
      {toolbarSlot &&
        isFlexActive &&
        showContainerTools &&
        selectedNode?.nodeType === 'component' &&
        createPortal(
          <TemplateEditorContentBar
            component={selectedNode}
            fields={fields}
            onUpdateComponent={onUpdateFlexComponent}
            onRemoveComponent={onRemoveFlexComponent}
            onSelectNode={onSelectNode}
            isLayoutPanelOpen={isLayoutPanelOpen}
            isHidden={!!hiddenNodeIds?.has(selectedNode.id)}
            onToggleHidden={onToggleHidden}
          />,
          toolbarSlot
        )}
      {bottomToolbarSlot &&
        createPortal(
          <TemplateEditorBar
            templateIcon={template.icon}
            templateName={template.name}
            onRenameTemplate={onUpdateTemplateMeta ? (name) => onUpdateTemplateMeta(name, template.description, template.icon) : undefined}
            onChangeTemplateIcon={onUpdateTemplateMeta ? (icon) => onUpdateTemplateMeta(template.name, template.description, icon) : undefined}
            canvasMode={canvasMode}
            onToggleCanvasMode={onToggleCanvasMode}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            onResetLayout={onResetFlexLayout}
            onSave={onDoneEditing}
            hasLayout={isFlexActive}
          />,
          bottomToolbarSlot
        )}
      {/* --------------------------------------------------------------------
          VISUAL CANVAS STAGE (Flexbox Engine or Legacy Grid Fallback)
          -------------------------------------------------------------------- */}
      {isFlexActive && flexLayoutConfig?.root ? (
        // Right-click a container or content element (edit mode) to open its Layout-tree gear flyout,
        // exactly as its tree row's right-click does; Shift+right-click keeps the browser's own menu.
        <div className="contents" onContextMenu={handleCanvasContextMenu}>
        <ScaledCanvas>
          <FlexContainerRenderer
            container={flexLayoutConfig.root}
            isRoot
            selectedNodeId={selectedNodeId}
            activeContainerId={activeContainerId}
            canvasMode={canvasMode}
            hiddenNodeIds={hiddenNodeIds}
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
            onPlaceLoremIpsum={onPlaceLoremIpsum}
            onPlaceBuiltin={onPlaceBuiltin}
            onOverflowChange={onOverflowChange}
          />
        </ScaledCanvas>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto py-16 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-surface-hover rounded-2xl bg-surface/20">
          <span className="text-sm font-bold text-content-secondary">No layout yet</span>
          <p className="text-xs text-content-muted max-w-sm">
            Generate a starter layout from this template&apos;s fields to begin designing.
          </p>
          <button
            type="button"
            onClick={onResetFlexLayout}
            className="mt-2 px-4 py-2 text-xs font-semibold bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-label rounded-xl transition cursor-pointer"
          >
            Auto-Generate Layout
          </button>
        </div>
      )}

      {/* A node's gear flyout as a floating window, when the Layout tree isn't showing (portaled; kept out of
          the canvas wrapper so events inside it never bubble into the canvas' handlers). */}
      {flexLayoutConfig?.root && (
        <FloatingNodeMenuHost
          root={flexLayoutConfig.root}
          fields={fields}
          onSelectNode={onSelectNode}
          onAddContainer={onAddFlexContainer}
          onInsertContainerSibling={onInsertContainerSibling}
          onSplitContainer={onSplitContainer}
          onUpdateContainer={onUpdateFlexContainer}
          onRemoveContainer={onRemoveFlexContainer}
          onUpdateComponent={onUpdateFlexComponent}
          onRemoveComponent={onRemoveFlexComponent}
        />
      )}
    </div>
  );
}
