'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderCollapseIcon,
  FolderExpandIcon,
  PlusIcon,
} from '@/components/icons/TreeIcons';
import {
  PanelFolderTabSvg,
  ItemsTabIcon,
  CollectionsTabIcon,
  TemplatesTabIcon,
  LayoutTabIcon,
  BlueprintTabIcon,
  ComponentsTabIcon,
} from '@/components/icons/PanelIcons';
import { DockContent, TabReorderInfo } from '@/hooks/usePanelDockDrag';
import { PrimarySidebarPosition } from '@/types/layout';
import VisibilityEyeIcon from '@/components/VisibilityEyeIcon';
import { activeIconColor } from '@/components/editorBarStyles';
import { CheckIcon } from '@/components/icons/GlyphIcons';
import { FieldTypeIcon } from '@/components/icons/ContentIcons';
import { BLUEPRINT_GROUPS } from '@/lib/blueprintGroups';
import type { FieldType } from '@/types/field';

/** The field types the Blueprint "+" adds, labelled as their Blueprint groups. */
const NEW_FIELD_TYPES = BLUEPRINT_GROUPS.filter((g) =>
  (['text', 'number', 'select', 'boolean', 'date'] as string[]).includes(g.type)
) as { type: FieldType; label: string }[];

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
  isContent: boolean;
  isComponents: boolean;
  isLayout: boolean;
  hierarchyNodeCount?: number;
  /** Layout only: the header eye that shows every row's visibility eye, and its toggle. */
  showAllEyes?: boolean;
  onToggleShowAllEyes?: () => void;
  /** Blueprint only: the header check that hides rows already placed in the layout, and its toggle. */
  showUnplacedOnly?: boolean;
  onToggleShowUnplacedOnly?: () => void;
  /** Blueprint: adds a field of the type picked from the "+" menu. */
  onAddNewField?: (type: FieldType) => void;
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
  isContent,
  isComponents,
  isLayout,
  hierarchyNodeCount,
  showAllEyes,
  onToggleShowAllEyes,
  showUnplacedOnly,
  onToggleShowUnplacedOnly,
  onAddNewField,
  onAddNewTemplate,
  onAddNewCollection,
  onAddNewItem,
  searchQuery,
  activeIsExpanded,
  activeToggleAll,
}: PanelViewTabsProps) {
  // The Blueprint "+" menu: drawn on the page body (the panel header clips what overflows it), under the button,
  // until a type is picked, Escape, or a click elsewhere.
  const [addFieldMenuAt, setAddFieldMenuAt] = useState<{ top: number; right: number } | null>(null);
  const addFieldButtonRef = useRef<HTMLButtonElement>(null);
  const addFieldMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addFieldMenuAt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddFieldMenuAt(null);
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (addFieldMenuRef.current?.contains(target) || addFieldButtonRef.current?.contains(target)) return;
      setAddFieldMenuAt(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [addFieldMenuAt]);
  const toggleAddFieldMenu = () => {
    if (addFieldMenuAt) return setAddFieldMenuAt(null);
    const rect = addFieldButtonRef.current?.getBoundingClientRect();
    if (rect) setAddFieldMenuAt({ top: Math.round(rect.bottom + 4), right: Math.round(window.innerWidth - rect.right) });
  };

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
            : isContent
            ? 'Browse Fields'
            : isComponents
            ? 'Component Palette'
            : isLayout
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
                ? 'Blueprint'
                : tab === 'template_builder'
                ? 'Components'
                : tab === 'template_hierarchy'
                ? 'Layout'
                : 'Grabbed Content';
            const TabIcon =
              tab === 'items'
                ? ItemsTabIcon
                : tab === 'collections'
                ? CollectionsTabIcon
                : tab === 'templates'
                ? TemplatesTabIcon
                : tab === 'template_hierarchy'
                ? LayoutTabIcon
                : tab === 'template_editor'
                ? BlueprintTabIcon
                : tab === 'template_builder'
                ? ComponentsTabIcon
                : null;
            const tabTitle =
              tab === 'items'
                ? 'Show Items organized by Category (drag to move tab)'
                : tab === 'collections'
                ? 'Show Collections hierarchy (drag to move tab)'
                : tab === 'templates'
                ? 'Show Templates blueprint tree (drag to move tab)'
                : tab === 'template_editor'
                ? 'Show Blueprint: the template’s fields (drag to move tab)'
                : tab === 'template_builder'
                ? 'Show Components (drag to move tab)'
                : tab === 'template_hierarchy'
                ? 'Show Layout (drag to move tab)'
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
                  aria-label={tabLabel}
                  title={tabTitle}
                  onClick={() => onTabChange?.(tab)}
                  onPointerDown={(e) => {
                    if (tab !== 'empty') onStartTabDrag?.(tab, e);
                  }}
                  className={`tree-folder-tab group/tab cursor-grab active:cursor-grabbing ${idx > 0 ? '-ml-[18px]' : ''} ${
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
                    {TabIcon ? <TabIcon className="w-[22.5px] h-[22.5px]" /> : <span>{tabLabel}</span>}
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
            {isContent ? (
              onAddNewField && (
                <div className="relative flex">
                  <button
                    ref={addFieldButtonRef}
                    type="button"
                    onClick={toggleAddFieldMenu}
                    aria-haspopup="menu"
                    aria-expanded={addFieldMenuAt !== null}
                    className="tree-tab-action-btn group"
                    title="Add a field"
                  >
                    <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon)] group-hover:text-[var(--text-strong)]" />
                  </button>
                  {/* The field types, each added into its own Blueprint group */}
                  {addFieldMenuAt && createPortal(
                    <div
                      ref={addFieldMenuRef}
                      role="menu"
                      aria-label="Add a field"
                      style={{ position: 'fixed', top: addFieldMenuAt.top, right: addFieldMenuAt.right, zIndex: 89 }}
                      className="w-40 bg-[var(--surface-panel)] border border-[var(--primary-border-strong)] rounded-xl shadow-2xl p-1 flex flex-col gap-0.5"
                    >
                      <div className="px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-subtle mb-1">
                        Add Field
                      </div>
                      {NEW_FIELD_TYPES.map(({ type, label }) => (
                        <button
                          key={type}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAddFieldMenuAt(null);
                            onAddNewField(type);
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-strong hover:bg-surface-hover transition cursor-pointer text-left"
                        >
                          <FieldTypeIcon type={type} className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>
              )
            ) : isTemplates ? (
              onAddNewTemplate && (
                <button
                  type="button"
                  onClick={onAddNewTemplate}
                  className="tree-tab-action-btn group"
                  title="Create New Item Template"
                >
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon)] group-hover:text-[var(--text-strong)]" />
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
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon)] group-hover:text-[var(--text-strong)]" />
                </button>
              )
            ) : isLayout ? (
              null
            ) : (
              onAddNewItem && (
                <button
                  type="button"
                  onClick={onAddNewItem}
                  className="tree-tab-action-btn group"
                  title="Create New Item"
                >
                  <PlusIcon className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--tree-action-icon)] group-hover:text-[var(--text-strong)]" />
                </button>
              )
            )}

            {/* Layout only: show every row's visibility eye (open eye, amber) or only on hover (slashed).
                A hidden node's own eye shows either way. Blinks when toggled, like a row's. */}
            {onToggleShowAllEyes && (
              <button
                type="button"
                onClick={onToggleShowAllEyes}
                aria-pressed={!!showAllEyes}
                className="tree-tab-action-btn group"
                title={showAllEyes ? 'Showing every visibility eye: click to show them only on hover' : 'Show every row’s visibility eye'}
              >
                {/* Colored here, not on the button: .tree-tab-action-btn's own color would win there. */}
                <span
                  className={`flex ${
                    showAllEyes ? activeIconColor : 'text-[var(--tree-action-icon)]'
                  } group-hover:text-[var(--text-strong)]`}
                >
                  <VisibilityEyeIcon hidden={!showAllEyes} className="w-3.5 h-3.5" />
                </span>
              </button>
            )}

            {/* Blueprint only: hide rows already placed in the layout, leaving what is still missing */}
            {onToggleShowUnplacedOnly && (
              <button
                type="button"
                onClick={onToggleShowUnplacedOnly}
                aria-pressed={!!showUnplacedOnly}
                className="tree-tab-action-btn group"
                title={showUnplacedOnly ? 'Showing only what is not placed yet: click to show everything' : 'Show only what is not placed in the layout yet'}
              >
                <span className={`flex ${showUnplacedOnly ? activeIconColor : 'text-[var(--tree-action-icon)]'} group-hover:text-[var(--text-strong)]`}>
                  <CheckIcon className="w-3 h-3" />
                </span>
              </button>
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
                  <FolderCollapseIcon className="w-3 h-3 text-[var(--tree-action-icon)] group-hover:text-[var(--text-strong)]" />
                ) : (
                  <FolderExpandIcon className="w-3 h-3 text-[var(--tree-action-icon)] group-hover:text-[var(--text-strong)]" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
