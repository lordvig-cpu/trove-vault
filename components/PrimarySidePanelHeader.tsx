'use client';

import { useId, useRef } from 'react';
import { CollectionRecord } from '@/types/collection';
import { TreeTab } from '@/lib/filterTreeForest';
import { PrimarySidebarPosition } from '@/types/layout';
import { DockContent, TabReorderInfo } from '@/hooks/usePanelDockDrag';
import { FieldType } from '@/types/field';
import PanelToolbarRow from '@/components/panel-header/PanelToolbarRow';
import SearchAndFilterSection from '@/components/panel-header/SearchAndFilterSection';
import PanelViewTabs from '@/components/panel-header/PanelViewTabs';
import { HierarchyFilterCategory } from '@/lib/hierarchyFilterMetas';


/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface PrimarySidePanelHeaderProps {
  hasDockedContent?: boolean;
  title?: string;
  showSearchFilter?: boolean;
  variant: 'flyout' | 'sidebar';
  isPinned?: boolean;
  position?: PrimarySidebarPosition;
  onTogglePosition?: () => void;
  moveTooltip?: string;
  canMove?: boolean;
  onDock?: (position: 'left' | 'right') => void;
  /** Whether that side's panel has room for this content as a tab (false: its dock button is unavailable). */
  canDock?: (position: 'left' | 'right') => boolean;
  treeView?: TreeTab;
  activeTab?: TreeTab | DockContent;
  onTabChange?: (tab: DockContent) => void;
  tabs?: DockContent[];
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  isAnyCategoryExpanded?: boolean;
  onToggleAllCategories?: () => void;
  onTogglePin?: () => void;
  onClose: () => void;
  onAddNewItem?: () => void;
  onAddNewCollection?: () => void;
  onAddNewTemplate?: () => void;
  collections?: CollectionRecord[];

  // Multi-Select Array Props
  filterCollectionIds?: number[];
  onToggleFilterCollection?: (collectionId: number) => void;
  onClearCollectionFilters?: () => void;
  onSelectNoneCollectionFilter?: () => void;

  // Field Type Filter Props (Content tab mode)
  filterFieldTypes?: FieldType[];
  onToggleFilterFieldType?: (type: FieldType) => void;
  onClearFieldTypeFilters?: () => void;
  onSelectNoneFieldTypeFilter?: () => void;
  fieldTypeCounts?: Record<string, number>;
  onAddNewField?: () => void;

  // Layout tree Filter Props (Layout tab mode)
  filterHierarchyTypes?: HierarchyFilterCategory[];
  onToggleFilterHierarchyType?: (type: HierarchyFilterCategory) => void;
  onClearHierarchyTypeFilters?: () => void;
  onSelectNoneHierarchyTypeFilter?: () => void;
  hierarchyTypeCounts?: Record<string, number>;

  onHandlePointerDown?: (e: React.PointerEvent) => void;
  onStartTabDrag?: (tab: Exclude<DockContent, 'empty'>, e: React.PointerEvent) => void;
  isDragging?: boolean;
  reorderInfo?: TabReorderInfo | null;

  isAnyFolderExpanded?: boolean;
  onToggleAllFolders?: () => void;
  hierarchyNodeCount?: number;
  /** Layout only: the header eye that shows every row's visibility eye, and its toggle. */
  showAllEyes?: boolean;
  onToggleShowAllEyes?: () => void;
}

/** The header props a side panel only forwards (search, filters, add actions, tab drag, Layout eyes): both
 *  PrimarySidePanel and SecondarySidePanel take these and pass them straight through. */
export type PanelHeaderPassThroughProps = Pick<
  PrimarySidePanelHeaderProps,
  | 'searchQuery'
  | 'onSearchChange'
  | 'onAddNewItem'
  | 'onAddNewCollection'
  | 'onAddNewTemplate'
  | 'collections'
  | 'filterCollectionIds'
  | 'onToggleFilterCollection'
  | 'onClearCollectionFilters'
  | 'onSelectNoneCollectionFilter'
  | 'filterFieldTypes'
  | 'onToggleFilterFieldType'
  | 'onClearFieldTypeFilters'
  | 'onSelectNoneFieldTypeFilter'
  | 'fieldTypeCounts'
  | 'onAddNewField'
  | 'filterHierarchyTypes'
  | 'onToggleFilterHierarchyType'
  | 'onClearHierarchyTypeFilters'
  | 'onSelectNoneHierarchyTypeFilter'
  | 'hierarchyTypeCounts'
  | 'onHandlePointerDown'
  | 'onStartTabDrag'
  | 'reorderInfo'
  | 'hierarchyNodeCount'
  | 'showAllEyes'
  | 'onToggleShowAllEyes'
>;

/* ==========================================================================
   2. MAIN COMPONENT: PrimarySidePanelHeader
   Composes the toolbar row, the search-and-filter section and the view tabs row (each in
   components/panel-header/) around the derived state every row needs (which panel this is,
   the docked tabs to display, and the panel's display name).
   ========================================================================== */

export default function PrimarySidePanelHeader({
  hasDockedContent = false,
  title,
  showSearchFilter = true,
  variant,
  isPinned,
  position = 'left',
  onTogglePosition,
  moveTooltip,
  canMove = true,
  onDock,
  canDock,
  treeView,
  activeTab = 'items',
  onTabChange,
  tabs,
  searchQuery = '',
  onSearchChange = () => {},
  isAnyCategoryExpanded,
  onToggleAllCategories,
  isAnyFolderExpanded = false,
  onToggleAllFolders,
  hierarchyNodeCount,
  showAllEyes,
  onToggleShowAllEyes,
  onTogglePin,
  onClose,
  onAddNewItem,
  onAddNewCollection,
  onAddNewTemplate,
  collections = [],
  filterCollectionIds = [],
  onToggleFilterCollection = () => {},
  onClearCollectionFilters = () => {},
  onSelectNoneCollectionFilter = () => {},
  filterFieldTypes = [],
  onToggleFilterFieldType = () => {},
  onClearFieldTypeFilters = () => {},
  onSelectNoneFieldTypeFilter = () => {},
  fieldTypeCounts = {},
  onAddNewField,
  filterHierarchyTypes = [],
  onToggleFilterHierarchyType = () => {},
  onClearHierarchyTypeFilters = () => {},
  onSelectNoneHierarchyTypeFilter = () => {},
  hierarchyTypeCounts = {},
  onHandlePointerDown,
  onStartTabDrag,
  isDragging = false,
  reorderInfo = null,
}: PrimarySidePanelHeaderProps) {
  const headerId = useId();
  const isCollections = treeView === 'collections' || activeTab === 'collections' || title === 'COLLECTIONS';
  const isTemplates = treeView === 'templates' || activeTab === 'templates' || title === 'TEMPLATES';
  const isGrabbed = activeTab === 'grabbed_content' || title === 'GRABBED CONTENT';
  const isContent = activeTab === 'template_editor' || title === 'CONTENT';
  const isComponents = activeTab === 'template_builder' || title === 'COMPONENTS';
  const isLayout = activeTab === 'template_hierarchy' || title === 'LAYOUT';
  const panelName = isCollections
    ? 'Collections'
    : isTemplates
    ? 'Templates'
    : isGrabbed
    ? 'Grabbed Content'
    : isContent
    ? 'Content'
    : isComponents
    ? 'Components'
    : isLayout
    ? 'Layout'
    : 'Items';
  const isRight = position === 'right';
  const shortcutKey = isRight ? 'Ctrl-L' : 'Ctrl-K';
  const shortcutAria = isRight ? 'Control+L Meta+L' : 'Control+K Meta+K';
  const searchInputTitle = isContent
    ? `Search Template Fields [shortcut: ${shortcutKey}]`
    : isLayout
    ? `Search Layout & Content [shortcut: ${shortcutKey}]`
    : isTemplates
    ? `Search Templates & Items [shortcut: ${shortcutKey}]`
    : isCollections
    ? `Search Collections & Items [shortcut: ${shortcutKey}]`
    : `Search Items [shortcut: ${shortcutKey}]`;

  const displayedTabs: DockContent[] =
    tabs !== undefined
      ? tabs
      : variant === 'sidebar' && !hasDockedContent
      ? []
      : activeTab === 'empty'
      ? []
      : activeTab === 'template_hierarchy'
      ? ['template_hierarchy']
      : activeTab === 'template_editor'
      ? ['template_editor']
      : activeTab === 'template_builder'
      ? ['template_builder']
      : treeView === 'collections'
      ? ['collections']
      : treeView === 'templates'
      ? ['templates']
      : treeView === 'items'
      ? ['items']
      : variant === 'flyout'
      ? ['items', 'collections']
      : [];

  const headerContainerRef = useRef<HTMLDivElement>(null);
  const activeIsExpanded = isAnyCategoryExpanded ?? isAnyFolderExpanded;
  const activeToggleAll = onToggleAllCategories ?? onToggleAllFolders;

  return (
    <div
      ref={headerContainerRef}
      className={`primary-side-panel-header px-2.5 pt-2 pb-0 flex flex-col gap-3 [--tree-header-gap:0.75rem] shrink-0 ${
        hasDockedContent ? 'tree-header-occupied' : 'tree-header-empty'
      }`}
    >
      <PanelToolbarRow
        hasDockedContent={hasDockedContent}
        title={title}
        variant={variant}
        isPinned={isPinned}
        position={position}
        onTogglePosition={onTogglePosition}
        moveTooltip={moveTooltip}
        canMove={canMove}
        onDock={onDock}
        canDock={canDock}
        panelName={panelName}
        onTogglePin={onTogglePin}
        onClose={onClose}
        onHandlePointerDown={onHandlePointerDown}
      />

      {/* Divider */}
      <hr className="tree-header-divider" />

      {/* ------------------------------------------------------------------
          Search Bar, Category Filters & Menus (Tree Only)
          ------------------------------------------------------------------ */}
      {showSearchFilter && !isGrabbed && (
        <SearchAndFilterSection
          variant={variant}
          position={position}
          isPinned={isPinned}
          headerId={headerId}
          headerContainerRef={headerContainerRef}
          isContent={isContent}
          isLayout={isLayout}
          isCollections={isCollections}
          isTemplates={isTemplates}
          dataTreeSearchValue={treeView ?? activeTab}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchInputTitle={searchInputTitle}
          shortcutAria={shortcutAria}
          filterFieldTypes={filterFieldTypes}
          onToggleFilterFieldType={onToggleFilterFieldType}
          onClearFieldTypeFilters={onClearFieldTypeFilters}
          onSelectNoneFieldTypeFilter={onSelectNoneFieldTypeFilter}
          fieldTypeCounts={fieldTypeCounts}
          filterHierarchyTypes={filterHierarchyTypes}
          onToggleFilterHierarchyType={onToggleFilterHierarchyType}
          onClearHierarchyTypeFilters={onClearHierarchyTypeFilters}
          onSelectNoneHierarchyTypeFilter={onSelectNoneHierarchyTypeFilter}
          hierarchyTypeCounts={hierarchyTypeCounts}
          collections={collections}
          filterCollectionIds={filterCollectionIds}
          onToggleFilterCollection={onToggleFilterCollection}
          onClearCollectionFilters={onClearCollectionFilters}
          onSelectNoneCollectionFilter={onSelectNoneCollectionFilter}
        />
      )}

      {/* ------------------------------------------------------------------
          View Tabs & Contextual Create Action (Seated on baseline)
          ------------------------------------------------------------------ */}
      <PanelViewTabs
        headerId={headerId}
        position={position}
        displayedTabs={displayedTabs}
        activeTab={activeTab as DockContent}
        onTabChange={onTabChange}
        onStartTabDrag={onStartTabDrag}
        isDragging={isDragging}
        reorderInfo={reorderInfo}
        panelName={panelName}
        isCollections={isCollections}
        isTemplates={isTemplates}
        isGrabbed={isGrabbed}
        isContent={isContent}
        isComponents={isComponents}
        isLayout={isLayout}
        hierarchyNodeCount={hierarchyNodeCount}
        showAllEyes={showAllEyes}
        onToggleShowAllEyes={onToggleShowAllEyes}
        onAddNewField={onAddNewField}
        onAddNewTemplate={onAddNewTemplate}
        onAddNewCollection={onAddNewCollection}
        onAddNewItem={onAddNewItem}
        searchQuery={searchQuery}
        activeIsExpanded={activeIsExpanded}
        activeToggleAll={activeToggleAll}
      />
    </div>
  );
}
