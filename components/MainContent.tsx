'use client';

import React from 'react';
import ItemDetailView from './ItemDetailView';
import TemplateEditorStage from './TemplateEditorStage';
import { ContentDataProvider } from '@/context/ContentDataContext';
import type { ContentData } from '@/lib/layoutContent';
import { ItemRecord } from '@/types/item';
import { ItemTemplate } from '@/types/template';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  type PlaceBuiltinHandler,
} from '@/types/layout';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

interface MainContentProps {
  selectedItem: ItemRecord | null;
  activeCollectionId: number | null;
  isBlurred: boolean;
  onAddSubItem: (collectionId: number | null, parentItemId: number | null) => void;
  onEditItem: (item: ItemRecord, collectionId: number | null) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number | null) => void;
  editingTemplate?: ItemTemplate | null;
  /** The item the template editor draws content with (see ContentDataContext); none = sample values. */
  previewData?: ContentData;
  /** Every template, so an item can be drawn through its own template's layout. */
  templates?: ItemTemplate[];
  /** Collection names by id, for a layout's Collections element. */
  collectionNames?: Record<number, string>;
  onDoneEditingTemplate?: () => void;
  // Template editor (flex layout tree) props
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
  onInsertFlexContainerSibling?: (
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
  onOverflowChange?: (containerId: string, isOverflowing: boolean) => void;
  onSplitFlexContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  canvasMode?: 'edit' | 'preview';
  hiddenNodeIds?: Set<string>;
  onToggleHidden?: (nodeId: string) => void;
  onToggleCanvasMode?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  isLayoutPanelOpen?: boolean;
  onOpenLayoutPanel?: () => void;
  layoutPanelSelector?: string;
}

/* ==========================================================================
   2. MAIN COMPONENT: MainContent
   ========================================================================== */

export default function MainContent({
  selectedItem,
  activeCollectionId,
  isBlurred,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
  editingTemplate,
  previewData,
  templates = [],
  collectionNames,
  onDoneEditingTemplate,
  flexLayoutConfig = null,
  selectedNodeId = null,
  activeContainerId,
  onSelectNode,
  onAddPrimitive,
  onAddFlexContainer,
  onInsertFlexContainerSibling,
  onUpdateFlexContainer,
  onRemoveFlexContainer,
  onSplitFlexContainer,
  onAddFlexComponent,
  onUpdateFlexComponent,
  onRemoveFlexComponent,
  onPlaceField,
  onPlaceLoremIpsum,
  onPlaceBuiltin,
  onResetFlexLayout,
  onOverflowChange,
  canvasMode = 'edit',
  hiddenNodeIds,
  onToggleHidden,
  onToggleCanvasMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isLayoutPanelOpen,
  onOpenLayoutPanel,
  layoutPanelSelector,
}: MainContentProps) {

  return (
    <div className="flex-1 h-full min-h-0 relative z-20 flex flex-col">
      {/* --------------------------------------------------------------------
          2.1 PRIMARY VERTICAL SCROLL CHASSIS
          -------------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden main-content-scroll">
        {/* ------------------------------------------------------------------
            2.2 CENTER CANVAS WRAPPER
            ------------------------------------------------------------------ */}
        <div className="w-full min-h-full flex flex-col">
          {/* Main Stage Presentation Shell with Backdrop Filter Fades */}
          <main
            className={`flex-1 flex flex-col transition-[filter,brightness] duration-300 ease-out will-change-[filter] ${
              isBlurred
                ? 'filter blur-[var(--content-overlay-blur)] brightness-[var(--content-overlay-brightness-dim)] pointer-events-none select-none'
                : 'filter-none brightness-[var(--content-overlay-brightness-default)]'
            }`}
          >
            {editingTemplate ? (
              <div className="w-full px-0 flex-1 pt-8 pb-10 flex flex-col min-h-0">
                <ContentDataProvider value={previewData ?? {}}>
                <TemplateEditorStage
                  template={editingTemplate}
                  flexLayoutConfig={flexLayoutConfig}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  onSelectNode={onSelectNode}
                  onAddPrimitive={onAddPrimitive}
                  onAddFlexContainer={onAddFlexContainer}
                  onInsertContainerSibling={onInsertFlexContainerSibling}
                  onUpdateFlexContainer={onUpdateFlexContainer}
                  onRemoveFlexContainer={onRemoveFlexContainer}
                  onSplitContainer={onSplitFlexContainer}
                  onAddFlexComponent={onAddFlexComponent}
                  onUpdateFlexComponent={onUpdateFlexComponent}
                  onRemoveFlexComponent={onRemoveFlexComponent}
                  onPlaceField={onPlaceField}
                  onPlaceLoremIpsum={onPlaceLoremIpsum}
                  onPlaceBuiltin={onPlaceBuiltin}
                  onResetFlexLayout={onResetFlexLayout}
                  onOverflowChange={onOverflowChange}
                  canvasMode={canvasMode}
                  hiddenNodeIds={hiddenNodeIds}
                  onToggleHidden={onToggleHidden}
                  onDoneEditing={onDoneEditingTemplate || (() => {})}
                  onToggleCanvasMode={onToggleCanvasMode || (() => {})}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={onUndo}
                  onRedo={onRedo}
                  isLayoutPanelOpen={isLayoutPanelOpen}
                  onOpenLayoutPanel={onOpenLayoutPanel}
                  layoutPanelSelector={layoutPanelSelector}
                />
                </ContentDataProvider>
              </div>
            ) : (
              <>
                {/* Sticky Upper Atmosphere Vignette */}
                {selectedItem && <div className="sticky-shadow-top" aria-hidden="true" />}

                {/* Main Stage Record Canvas (100% Full Width) */}
                <div className="w-full p-6 flex-1 pt-8 pb-10">
                  <ItemDetailView
                    item={selectedItem}
                    template={selectedItem?.template_id != null ? templates.find((t) => t.id === selectedItem.template_id) ?? null : null}
                    collectionNames={collectionNames}
                    onAddSubItem={(parent) => {
                      onAddSubItem(activeCollectionId, parent.id);
                    }}
                    onEditItem={() => {
                      if (selectedItem) onEditItem(selectedItem, activeCollectionId);
                    }}
                    onDeleteItem={() => {
                      if (selectedItem) onDeleteItem(selectedItem, activeCollectionId);
                    }}
                  />
                </div>

                {/* Sticky Lower Atmosphere Vignette */}
                {selectedItem && <div className="sticky-shadow-bottom" aria-hidden="true" />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
