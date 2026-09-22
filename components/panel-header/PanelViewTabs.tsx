'use client';

import React from 'react';
import {
  FolderCollapseIcon,
  FolderExpandIcon,
  PlusIcon,
} from '@/components/icons/TreeIcons';
import { PanelFolderTabSvg } from '@/components/icons/PanelIcons';
import { DockContent, TabReorderInfo } from '@/hooks/usePanelDockDrag';
import { PrimarySidebarPosition } from '@/types/layout';

interface PanelViewTabsProps {
  headerId: string;
  position: PrimarySidebarPosition;
  displayedTabs: DockContent[];
  activeTab: DockContent;
  onTabChange?: (tab: DockContent) => void;
  onStartTabDrag?: (tab: Exclude<DockContent, 'empty'>, e: React.PointerEvent) => void;
  isDragging: boolean;
  reorderInfo: TabReorderInfo | null;
  panelName: string;
  isCollections: boolean;
  isTemplates: boolean;
  isGrabbed: boolean;
  isInspector: boolean;
  isBuilder: boolean;
  isProperties: boolean;
  isHierarchy: boolean;
  hierarchyNodeCount?: number;
  onAddNewField?: () => void;
  onAddNewTemplate?: () => void;
  onAddNewCollection?: () => void;
  onAddNewItem?: () => void;
  searchQuery: string;
  activeIsExpanded?: boolean;
  activeToggleAll?: () => void;
}

/** The panel header's view-mode paper folder tabs, section heading, and add/expand-all actions. */
export default function PanelViewTabs({
  headerId,
  position,
  displayedTabs,
  activeTab,
  onTabChange,
  onStartTabDrag,
  isDragging,
  reorderInfo,
  panelName,
  isCollections,
  isTemplates,
  isGrabbed,
  isInspector,
  isBuilder,
  isProperties,
  isHierarchy,
  hierarchyNodeCount,
  onAddNewField,
  onAddNewTemplate,
  onAddNewCollection,
  onAddNewItem,
  searchQuery,
  activeIsExpanded,
  activeToggleAll,
}: PanelViewTabsProps) {
  if (displayedTabs.length === 0) return null;

  return (
    <>
      <div className="tree-section-heading">
        <hr aria-hidden="true" />
        <h3>
          {isCollections
            ? 'Browse Collections'
            : isTemplates
            ? 'Browse Templates'
            : isGrabbed
            ? 'Grabbed Content'
            : isInspector
            ? 'Field Schema Hierarchy'
            : isBuilder
            ? 'Layout & Palette'
            : isProperties
            ? 'Properties'
            : isHierarchy
            ? (hierarchyNodeCount !== undefined ? `Layout & Content (${hierarchyNodeCount})` : 'Layout & Content')
            : 'Browse Items'}
        </h3>
      </div>
      <div className="flex items-end justify-between gap-1 w-full shrink-0 -mb-[1px]">
        {/* Left: View Mode Paper Folder Tabs */}
        <div role="tablist" aria-label={`${panelName} views`} className="flex items-center relative">
          {displayedTabs.map((tab, idx) => {
            const isTabActive = activeTab === tab;
            const tabLabel =
              tab === 'items'
                ? 'Items'
                : tab === 'collections'
                ? 'Collections'
                : tab === 'templates'
                ? 'Templates'
                : tab === 'template_editor'
                ? 'Inspector'
                : tab === 'template_builder'
                ? 'Builder'
                : tab === 'template_properties'
                ? 'Properties'
                : tab === 'template_hierarchy'
                ? 'Structure'
                : 'Grabbed Content';
            const tabTitle =
              tab === 'items'
                ? 'Show Items organized by Category (drag to move tab)'
                : tab === 'collections'
                ? 'Show Collections hierarchy (drag to move tab)'
                : tab === 'templates'
                ? 'Show Templates blueprint tree (drag to move tab)'
                : tab === 'template_editor'
                ? 'Show Template Field Inspector (drag to move tab)'
                : tab === 'template_builder'
                ? 'Show Template Layout Builder (drag to move tab)'
                : tab === 'template_properties'
                ? 'Show Element Properties (drag to move tab)'
                : tab === 'template_hierarchy'
                ? 'Show Layout Structure (drag to move tab)'
                : 'Show Grabbed Content (drag to move tab)';

            const isThisTabDragging = isDragging && reorderInfo?.draggingTab === tab && reorderInfo?.side === position;
            const isThisTabTarget = isDragging && reorderInfo?.side === position && reorderInfo?.targetIndex === idx;
            const showInsertBefore = isThisTabTarget && !reorderInfo?.isAfter;
            const showInsertAfter = isThisTabTarget && reorderInfo?.isAfter;

            return (
              <div key={tab} className="relative flex items-center">
                {showInsertBefore && (
                  <div className="tree-tab-insert-marker tree-tab-insert-marker-left" />
                )}
                <button
                  data-tab-name={tab}
                  data-tab-index={idx}
                  data-panel-side={position}
                  type="button"
                  role="tab"
                  aria-selected={isTabActive}
                  title={tabTitle}
                  onClick={() => onTabChange?.(tab)}
                  onPointerDown={(e) => {
                    if (tab !== 'empty') onStartTabDrag?.(tab, e);
                  }}
                  className={`tree-folder-tab group/tab cursor-grab active:cursor-grabbing ${idx > 0 ? '-ml-3.5' : ''} ${
                    isThisTabTarget
                      ? 'tree-folder-tab-reorder-target z-30'
                      : isTabActive
                      ? 'tree-folder-tab-active z-20'
                      : 'tree-folder-tab-idle z-10'
                  } ${isThisTabDragging ? 'tree-folder-tab-dragging' : ''}`}
                >
                  <PanelFolderTabSvg
                    gradientId={`${headerId}-${tab}`}
                    isActive={isTabActive}
                    isTarget={isThisTabTarget}
                    variant="curved"
                  />
                  <span className="relative z-10 flex items-center gap-1 px-0.5 select-none">
                    <span
                      className="text-[9px] opacity-40 group-hover/tab:opacity-90 transition-opacity tracking-tighter"
                      aria-hidden="true"
                    >
                      ⋮⋮
                    </span>
                    <span>{tabLabel}</span>
                  </span>
                </button>
                {showInsertAfter && (
                  <div className="tree-tab-insert-marker tree-tab-insert-marker-right" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Contextual Add Action & Folder Toggle */}
        {activeTab !== 'empty' && (
          <div className="flex items-center gap-1.5 shrink-0 pr-1 pb-1">
            {isInspector ? (
              onAddNewField && (
                <button
                  type="button"
                  onClick={onAddNewField}
                  className="tree-tab-action-btn group"
                  title="Add New Field Definition"
                >
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                </button>
              )
            ) : isTemplates ? (
              onAddNewTemplate && (
                <button
                  type="button"
                  onClick={onAddNewTemplate}
                  className="tree-tab-action-btn group"
                  title="Create New Item Template"
                >
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                </button>
              )
            ) : isCollections ? (
              onAddNewCollection && (
                <button
                  type="button"
                  onClick={onAddNewCollection}
                  className="tree-tab-action-btn group"
                  title="Create New Collection"
                >
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                </button>
              )
            ) : isHierarchy || isProperties ? (
              null
            ) : (
              onAddNewItem && (
                <button
                  type="button"
                  onClick={onAddNewItem}
                  className="tree-tab-action-btn group"
                  title="Create New Item"
                >
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                </button>
              )
            )}

            {activeToggleAll && (
              <button
                type="button"
                onClick={activeToggleAll}
                disabled={searchQuery.trim().length > 0}
                className="tree-tab-action-btn tree-panel-disabled group disabled:pointer-events-none disabled:cursor-not-allowed"
                title={
                  searchQuery.trim().length > 0
                    ? 'Tree expansion disabled during search'
                    : activeIsExpanded
                    ? 'Collapse all'
                    : 'Expand all'
                }
              >
                {activeIsExpanded ? (
                  <FolderCollapseIcon className="w-3 h-3 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                ) : (
                  <FolderExpandIcon className="w-3 h-3 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
