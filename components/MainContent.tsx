'use client';

import React from 'react';
import ItemDetailView from './ItemDetailView';
import TemplateEditorStage from './TemplateEditorStage';
import { ItemRecord } from '@/types/item';
import { ItemTemplate } from '@/types/template';
import { TemplateLayoutConfig, LayoutSection, LayoutBlock } from '@/types/layout';

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
  selectedFieldId?: number | null;
  onSelectField?: (fieldId: number | null) => void;
  onDoneEditingTemplate?: () => void;
  onAddFieldToTemplate?: () => void;
  // Layout Builder Props
  layoutConfig?: TemplateLayoutConfig | null;
  selectedBlockId?: string | null;
  canvasMode?: 'edit' | 'preview';
  onSelectBlock?: (blockId: string | null) => void;
  onAddSection?: (title?: string) => void;
  onRemoveSection?: (sectionId: string) => void;
  onUpdateSection?: (sectionId: string, partial: Partial<LayoutSection>) => void;
  onAddBlock?: (sectionId: string, block: Omit<LayoutBlock, 'id'>) => void;
  onUpdateBlock?: (sectionId: string, blockId: string, partial: Partial<LayoutBlock>) => void;
  onRemoveBlock?: (sectionId: string, blockId: string) => void;
  onMoveBlock?: (fromSectionId: string, toSectionId: string, blockId: string, toIndex?: number) => void;
  onResetLayout?: () => void;
  onToggleCanvasMode?: () => void;
  occupiedRightWidth?: number;
  occupiedLeftWidth?: number;
  rightPanelWidth?: number; // Backward compatibility alias
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
  selectedFieldId = null,
  onSelectField,
  onDoneEditingTemplate,
  onAddFieldToTemplate,
  layoutConfig = null,
  selectedBlockId = null,
  canvasMode = 'edit',
  onSelectBlock,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  onResetLayout,
  onToggleCanvasMode,
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
              <div className="w-full p-6 flex-1 pt-8 pb-10">
                <TemplateEditorStage
                  template={editingTemplate}
                  layoutConfig={layoutConfig}
                  selectedBlockId={selectedBlockId}
                  selectedFieldId={selectedFieldId}
                  canvasMode={canvasMode}
                  onSelectBlock={onSelectBlock || (() => {})}
                  onSelectField={onSelectField || (() => {})}
                  onDoneEditing={onDoneEditingTemplate || (() => {})}
                  onAddField={onAddFieldToTemplate || (() => {})}
                  onAddSection={onAddSection || (() => {})}
                  onRemoveSection={onRemoveSection || (() => {})}
                  onUpdateSection={onUpdateSection || (() => {})}
                  onAddBlock={onAddBlock || (() => {})}
                  onUpdateBlock={onUpdateBlock || (() => {})}
                  onRemoveBlock={onRemoveBlock || (() => {})}
                  onMoveBlock={onMoveBlock || (() => {})}
                  onResetLayout={onResetLayout || (() => {})}
                  onToggleCanvasMode={onToggleCanvasMode || (() => {})}
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
