'use client';

import React from 'react';
import ItemDetailView from './ItemDetailView';
import TemplateEditorStage from './TemplateEditorStage';
import { ItemRecord } from '@/types/item';
import { ItemTemplate } from '@/types/template';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
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
  onDoneEditingTemplate?: () => void;
  // Modern Flexbox Layout Builder Props
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
  onResetFlexLayout?: () => void;
  onOverflowChange?: (containerId: string, isOverflowing: boolean) => void;
  onSplitFlexContainer?: (containerId: string, splitType: 'columns' | 'rows') => void;
  canvasMode?: 'edit' | 'preview';
  onToggleCanvasMode?: () => void;
  isStructurePanelOpen?: boolean;
  onOpenStructurePanel?: () => void;
  structurePanelSelector?: string;
  occupiedRightWidth?: number;
  occupiedLeftWidth?: number;
  rightPanelWidth?: number;
  bottomPanelHeight?: number;
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
  onResetFlexLayout,
  onOverflowChange,
  canvasMode = 'edit',
  onToggleCanvasMode,
  isStructurePanelOpen,
  onOpenStructurePanel,
  structurePanelSelector,
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
                  onResetFlexLayout={onResetFlexLayout}
                  onOverflowChange={onOverflowChange}
                  canvasMode={canvasMode}
                  onDoneEditing={onDoneEditingTemplate || (() => {})}
                  onToggleCanvasMode={onToggleCanvasMode || (() => {})}
                  isStructurePanelOpen={isStructurePanelOpen}
                  onOpenStructurePanel={onOpenStructurePanel}
                  structurePanelSelector={structurePanelSelector}
                />
              </div>
            ) : (
              <>
                {/* Sticky Upper Atmosphere Vignette */}
                {selectedItem && <div className="sticky-shadow-top" aria-hidden="true" />}

                {/* Main Stage Record Canvas (100% Full Width) */}
                <div className="w-full p-6 flex-1 pt-8 pb-10">
                  <ItemDetailView
                    item={selectedItem}
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
