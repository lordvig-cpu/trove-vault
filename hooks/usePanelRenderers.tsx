'use client';

import { useMemo } from 'react';
import { ItemRecord } from '@/types/item';
import { DEFAULT_TEMPLATE_ICON } from '@/types/template';
import { DockContent } from '@/hooks/usePanelDockDrag';
import { TreeTab } from '@/lib/filterTreeForest';
import { itemMatchesQuery } from '@/lib/treeUtils';
import { PackageIcon } from '@/components/icons/GlyphIcons';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useTreePanels } from '@/hooks/useTreePanels';
import { useHierarchyState } from '@/hooks/useHierarchyState';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
import TreeContent from '@/components/TreeContent';
import { TreePanelContext } from '@/context/TreePanelContext';
import TemplateBlueprintTree from '@/components/TemplateBlueprintTree';
import { BLUEPRINT_GROUPS, blueprintGroupCounts, blueprintGroupOf } from '@/lib/blueprintGroups';
import { layoutNodeName } from '@/lib/layoutNavigation';
import { resolveContentTarget } from '@/lib/layoutTree';
import TemplateLayoutPalette from '@/components/TemplateLayoutPalette';
import TemplateHierarchyTree from '@/components/TemplateHierarchyTree';
import { FlexContainerNode, FlexComponentNode, findFlexNode } from '@/types/layout';
import type { FieldType } from '@/types/field';
import { hierarchyNodeCategory } from '@/lib/hierarchyFilterMetas';

type CollectionsApi = ReturnType<typeof useCollections>;
type ModalsApi = ReturnType<typeof useModals>;
type TreePanelsApi = ReturnType<typeof useTreePanels>;
type HierarchyApi = ReturnType<typeof useHierarchyState>;
type TemplateEditorApi = ReturnType<typeof useTemplateEditor>;

interface UsePanelRenderersOptions {
  collections: CollectionsApi;
  modals: ModalsApi;
  treePanels: TreePanelsApi;
  hierarchy: HierarchyApi;
  templateEditor: TemplateEditorApi;
  isPinned: boolean;
  isSecondaryPinned: boolean;
  setIsPrimaryFlyoutOpen: (open: boolean) => void;
  setIsCollectionsFlyoutOpen: (open: boolean) => void;
  setIsTemplatesFlyoutOpen: (open: boolean) => void;
  /** Runs `next` after leaving the template editor, asking about unsaved layout changes first
      (useLeaveTemplateEditorGuard); just runs it when the editor isn't open. */
  leaveEditorThen: (next: () => void, options?: { closeEditor?: boolean }) => void;
  /** Deletes a container, first confirming when it holds anything (useConfirmRemoveContainer). */
  requestRemoveContainer: (containerId: string) => void;
}

/**
 * The workspace's tree/template panel renderers: how a docked or flyout panel's body is chosen
 * and wired up (`renderTreePanel`, `renderPanelBody`), and the header props every panel variant
 * needs (`treeHeaderProps`). Split out of app/page.tsx, which only composes the result.
 */
export function usePanelRenderers({
  collections,
  modals,
  treePanels,
  hierarchy,
  templateEditor,
  isPinned,
  isSecondaryPinned,
  setIsPrimaryFlyoutOpen,
  setIsCollectionsFlyoutOpen,
  setIsTemplatesFlyoutOpen,
  leaveEditorThen,
  requestRemoveContainer,
}: UsePanelRenderersOptions) {
  const {
    activeCollectionId,
    setActiveCollectionId,
    selectedItem,
    selectItemWithChildren,
    renameCollection,
    renameTemplate,
    deleteTemplate,
    fetchAllData,
  } = collections;
  const { openCreateItem, openCreateCollection, openTemplateManager, openDeleteCollection, openEditItem, openDeleteItem } = modals;
  const {
    activeSearchPanel,
    setActiveSearchPanel,
    filteredForest,
    collectionsForest,
    collectionsTree,
    templatesForest,
    templatesTree,
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    handleToggleCategory,
    isAnyCategoryExpanded,
    handleToggleAllCategories,
    collectionsFilterIds,
    setCollectionsFilterIds,
    templatesFilterIds,
    setTemplatesFilterIds,
    filterCollectionIds,
    handleToggleFilterCollection,
    handleClearCollectionFilters,
    handleSelectNoneFilterCollection,
    handleToggleCollectionsFilter,
    handleSelectNoneCollectionsFilter,
    handleToggleTemplatesFilter,
    handleSelectNoneTemplatesFilter,
  } = treePanels;
  const {
    hierarchyExpandedIds,
    hierarchyNodeCount,
    isAllHierarchyExpanded,
    toggleAllHierarchy,
    toggleHierarchyExpand,
    showAllEyes,
    toggleShowAllEyes,
    handleOpenProperties,
    handlePlaceField,
    handlePlaceBuiltin,
    handleAddContainer,
  } = hierarchy;

  const templateIcons = useMemo(
    () => new Map(collections.templates.map((t) => [t.id, t.icon || DEFAULT_TEMPLATE_ICON])),
    [collections.templates]
  );

  const handleTreeSelectItem = (item: ItemRecord, collectionId: number | null) => {
    // Clear the search in the same update so its sole match cannot override this click.
    const pattern = searchQuery.trim();
    if (pattern && !itemMatchesQuery(item, pattern)) {
      setSearchQuery('');
    }
    selectItemWithChildren(item, collectionId);
    setIsPrimaryFlyoutOpen(false);
  };

  const handleTriggerEditItem = (item: ItemRecord, collectionId: number | null) => {
    setActiveCollectionId(collectionId);
    openEditItem(item, collectionId);
  };

  const handleTriggerDeleteItem = (item: ItemRecord, collectionId: number | null) => {
    setActiveCollectionId(collectionId);
    openDeleteItem(item, collectionId);
  };

  const closeTreeFlyout = (content: 'items' | 'collections' | 'templates') => {
    if (content === 'collections') setIsCollectionsFlyoutOpen(false);
    else if (content === 'templates') setIsTemplatesFlyoutOpen(false);
    else setIsPrimaryFlyoutOpen(false);
  };

  // Renders one of the three tree views (Items, Collections, Templates) wired up for wherever it's
  // docked: its own forest/search/expansion state, and the selection/CRUD handlers every tree needs.
  const renderTreePanel = (pos: 'left' | 'right', content: 'items' | 'collections' | 'templates' = 'items', isFlyout = false) => {
    const tree = content === 'collections' ? collectionsTree : content === 'templates' ? templatesTree : { searchQuery, expandedCategoryIds, handleToggleCategory };
    const forest = content === 'collections' ? collectionsForest : content === 'templates' ? templatesForest : filteredForest;
    return (
      <TreePanelContext.Provider value={{ isFlyout, isPinned: !isFlyout && (pos === 'left' ? isPinned : isSecondaryPinned) }}>
        <TreeContent
          templateIcons={templateIcons}
          treeView={content === 'collections' ? 'collections' : content === 'templates' ? 'templates' : 'items'}
          unifiedForest={forest}
          searchQuery={tree.searchQuery}
          activeCollectionId={activeCollectionId}
          selectedItemId={selectedItem?.id || null}
          expandedCategoryIds={tree.expandedCategoryIds}
          onToggleCategory={tree.handleToggleCategory}
          onSelectCollection={(colId) => {
            setActiveSearchPanel(content);
            if (content !== 'templates') {
              setActiveCollectionId(colId);
            }
            closeTreeFlyout(content);
          }}
          onSelectItem={(item, collectionId) => {
            setActiveSearchPanel(content);
            leaveEditorThen(() => {
              if (content === 'collections' || content === 'templates') {
                selectItemWithChildren(item, collectionId);
                closeTreeFlyout(content);
              } else handleTreeSelectItem(item, collectionId);
            });
          }}
          // A search narrowed to one item loads it by itself (TreeContent's effect) -- but never while the
          // template editor is open: only a deliberate click leaves the editor (through leaveEditorThen). Passed
          // as the stable selectItemWithChildren, not a fresh closure, so that effect doesn't re-run every render.
          onSelectSearchResult={
            activeSearchPanel === content && !templateEditor.isEditing ? selectItemWithChildren : undefined
          }
          onAddSubItem={openCreateItem}
          onAddSubCollection={openCreateCollection}
          onEditTemplate={(templateId: number) => {
            setIsTemplatesFlyoutOpen(false);
            setIsCollectionsFlyoutOpen(false);
            setIsPrimaryFlyoutOpen(false);
            const validId = Math.abs(templateId);
            if (!validId || validId === templateEditor.editingTemplateId) return;
            // Another template takes over the open editor, so the editor stays open for it
            leaveEditorThen(() => void templateEditor.startEditing(validId), { closeEditor: false });
          }}
          onEditCollection={(col) => openTemplateManager(col.id, col.name)}
          onDeleteCollection={openDeleteCollection}
          onDeleteTemplate={deleteTemplate}
          onItemSaved={(collectionId) => void fetchAllData(collectionId)}
          onDeleteItem={handleTriggerDeleteItem}
          onRenameCollection={renameCollection}
          onRenameTemplate={renameTemplate}
          position={pos}
        />
      </TreePanelContext.Provider>
    );
  };

  // The container a Blueprint row's Place: action puts things into (the editor's active container), by name
  const placeTargetName = () => {
    const root = templateEditor.flexLayoutConfig?.root;
    // where it really lands: a split wrapper passes content on to its first half
    const node = root ? findFlexNode(root, resolveContentTarget(root, templateEditor.activeContainerId)) : null;
    return node ? layoutNodeName(node, templateEditor.activeTemplate?.fields ?? [], node.id === root?.id) : 'Body';
  };

  // Renders whatever a docked tab holds, tree views included: the template editor's Blueprint tab,
  // properties panel, layout palette and Layout tree, or the grabbed-content placeholder.
  const renderPanelBody = (content: DockContent, pos: 'left' | 'right' | 'bottom') => {
    if (content === 'items' || content === 'collections' || content === 'templates') {
      return renderTreePanel(pos === 'bottom' ? 'left' : pos, content);
    }
    // These tabs never appear in a flyout (only items/collections/templates get a dedicated one
    // above), but they do live in the sidebar's pinned vs. unpinned-open states, which their own
    // gear/action menus (useTreeActionMenu) need to know to pick a z-index above the panel's.
    const panelContext = {
      isFlyout: false,
      isPinned: pos === 'right' ? isSecondaryPinned : isPinned,
    };
    if (content === 'template_editor') {
      return (
        <TreePanelContext.Provider value={panelContext}>
          <TemplateBlueprintTree
            template={templateEditor.activeTemplate}
            selectedFieldId={templateEditor.selectedFieldId}
            searchQuery={templateEditor.fieldSearchQuery}
            filterGroups={templateEditor.filterFieldTypes}
            unplacedOnly={templateEditor.showUnplacedOnly}
            collapsedGroups={templateEditor.collapsedBlueprintGroups}
            onToggleGroup={templateEditor.toggleBlueprintGroup}
            placedFieldIds={templateEditor.placedFieldIds}
            placedBuiltins={templateEditor.placedBuiltins}
            placeTarget={placeTargetName()}
            onPlaceField={(fieldId) => templateEditor.placeField(fieldId)}
            onPlaceBuiltin={(key) => templateEditor.placeBuiltin(key)}
            onSelectField={templateEditor.setSelectedFieldId}
            onUpdateField={templateEditor.updateField}
            onDeleteField={templateEditor.deleteField}
            onReorderFields={templateEditor.reorderFields}
            isLoading={templateEditor.isLoading}
            position={pos === 'bottom' ? 'right' : pos}
          />
        </TreePanelContext.Provider>
      );
    }
    if (content === 'template_builder') {
      return (
        <TreePanelContext.Provider value={panelContext}>
          <TemplateLayoutPalette
            selectedContainer={templateEditor.selectedContainer}
            onAddContainer={(preset) => {
              const mapped =
                preset === '2-col' ? 'split-2' : preset === '3-col' ? 'split-3' : preset;
              templateEditor.addFlexPrimitive(mapped);
            }}
            fields={templateEditor.activeTemplate?.fields ?? []}
            onPlacePreset={(request) => templateEditor.placePreset(request)}
            onApplyRecipe={(id) => templateEditor.applyRecipe(id)}
          />
        </TreePanelContext.Provider>
      );
    }
    if (content === 'template_hierarchy') {
      return (
        <TreePanelContext.Provider value={panelContext}>
          <TemplateHierarchyTree
            flexLayoutConfig={templateEditor.flexLayoutConfig}
            selectedNodeId={templateEditor.selectedNodeId}
            activeContainerId={templateEditor.activeContainerId}
            fields={templateEditor.activeTemplate?.fields || []}
            expandedIds={hierarchyExpandedIds}
            onToggleExpand={toggleHierarchyExpand}
            onSelectNode={templateEditor.selectNode}
            onOpenProperties={handleOpenProperties}
            onAddContainer={handleAddContainer}
            onInsertContainerSibling={templateEditor.insertFlexContainerSibling}
            onSplitContainer={templateEditor.splitFlexContainer}
            onUpdateContainer={templateEditor.updateFlexContainer}
            onUpdateComponent={templateEditor.updateFlexComponent}
            onRemoveContainer={requestRemoveContainer}
            onRemoveComponent={templateEditor.removeFlexComponent}
            onMoveNode={templateEditor.moveFlexNode}
            hiddenNodeIds={templateEditor.hiddenNodeIds}
            onToggleHidden={templateEditor.toggleNodeHidden}
            showAllEyes={showAllEyes}
            onPlaceField={handlePlaceField}
            onPlaceBuiltin={handlePlaceBuiltin}
            position={pos === 'bottom' ? 'right' : pos}
            overflowingContainerIds={templateEditor.overflowingContainerIds}
            searchQuery={templateEditor.hierarchySearchQuery}
            filterHierarchyTypes={templateEditor.filterHierarchyTypes}
          />
        </TreePanelContext.Provider>
      );
    }
    if (content === 'grabbed_content') {
      return (
        <div className="p-4 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[220px] select-none">
          <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_oklch,var(--brand-primary)_15%,transparent)] border border-[color-mix(in_oklch,var(--brand-primary)_35%,transparent)] flex items-center justify-center text-2xl shadow-sm">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold text-[var(--content-primary)] uppercase tracking-wider">
              Grabbed Content
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-[200px] leading-relaxed">
              This is docked content.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // The props PrimarySidePanelHeader/SecondarySidePanelHeader need for whatever content a docked
  // tab holds: which search/filter state to read and write (per-tab-type: Items, Collections,
  // Templates and the Blueprint tab's own field tree each keep their own), and the expand-all state.
  // Spread onto the header with {...treeHeaderProps(content)}.
  const treeHeaderProps = (content: DockContent) => {
    const isCollections = content === 'collections';
    const isTemplates = content === 'templates';
    const isContent = content === 'template_editor';
    const isComponents = content === 'template_builder';
    const isLayout = content === 'template_hierarchy';

    // How many values each Blueprint group holds (its filter menu's counts)
    const fieldTypeCounts = blueprintGroupCounts(templateEditor.activeTemplate?.fields ?? []);

    // Calculate layout-tree node-category counts (Layout items / Content items / Pre-defined Content)
    const hierarchyTypeCounts: Record<string, number> = {};
    const hierarchyRoot = templateEditor.flexLayoutConfig?.root;
    if (hierarchyRoot) {
      const walk = (node: FlexContainerNode | FlexComponentNode) => {
        const category = hierarchyNodeCategory(node);
        hierarchyTypeCounts[category] = (hierarchyTypeCounts[category] || 0) + 1;
        if (node.nodeType === 'container') {
          for (const child of node.children) walk(child);
        }
      };
      walk(hierarchyRoot);
    }

    const isEmpty = content === 'empty';

    return {
      treeView: (isEmpty ? undefined : isCollections ? 'collections' : isTemplates ? 'templates' : 'items') as TreeTab,
      activeTab: (isEmpty
        ? 'empty'
        : isContent
        ? 'template_editor'
        : isComponents
        ? 'template_builder'
        : isLayout
        ? 'template_hierarchy'
        : isCollections
        ? 'collections'
        : isTemplates
        ? 'templates'
        : content) as TreeTab | DockContent,
      searchQuery: isContent
        ? templateEditor.fieldSearchQuery
        : isLayout
        ? templateEditor.hierarchySearchQuery
        : isCollections
        ? collectionsTree.searchQuery
        : isTemplates
        ? templatesTree.searchQuery
        : searchQuery,
      onSearchChange: (query: string) => {
        if (isContent) {
          templateEditor.setFieldSearchQuery(query);
        } else if (isLayout) {
          templateEditor.setHierarchySearchQuery(query);
        } else {
          setActiveSearchPanel(isCollections ? 'collections' : isTemplates ? 'templates' : 'items');
          if (isCollections) collectionsTree.setSearchQuery(query);
          else if (isTemplates) templatesTree.setSearchQuery(query);
          else setSearchQuery(query);
        }
      },
      isAnyCategoryExpanded: isContent
        ? templateEditor.collapsedBlueprintGroups.size < BLUEPRINT_GROUPS.length
        : isLayout
        ? isAllHierarchyExpanded
        : isCollections
        ? collectionsTree.isAnyCategoryExpanded
        : isTemplates
        ? templatesTree.isAnyCategoryExpanded
        : isAnyCategoryExpanded,
      onToggleAllCategories: isContent
        ? templateEditor.toggleAllBlueprintGroups
        : isLayout
        ? toggleAllHierarchy
        : isCollections
        ? collectionsTree.handleToggleAllCategories
        : isTemplates
        ? templatesTree.handleToggleAllCategories
        : handleToggleAllCategories,
      hierarchyNodeCount: isLayout ? hierarchyNodeCount : undefined,
      // Layout only: the header eye that shows every row's visibility eye.
      showAllEyes: isLayout ? showAllEyes : undefined,
      onToggleShowAllEyes: isLayout ? toggleShowAllEyes : undefined,
      // Blueprint only: the header check that hides what is already placed
      showUnplacedOnly: isContent ? templateEditor.showUnplacedOnly : undefined,
      onToggleShowUnplacedOnly: isContent ? templateEditor.toggleShowUnplacedOnly : undefined,
      filterCollectionIds: isCollections ? collectionsFilterIds : isTemplates ? templatesFilterIds : filterCollectionIds,
      onToggleFilterCollection: isCollections ? handleToggleCollectionsFilter : isTemplates ? handleToggleTemplatesFilter : handleToggleFilterCollection,
      onClearCollectionFilters: isCollections ? () => setCollectionsFilterIds([]) : isTemplates ? () => setTemplatesFilterIds([]) : handleClearCollectionFilters,
      onSelectNoneCollectionFilter: isCollections ? handleSelectNoneCollectionsFilter : isTemplates ? handleSelectNoneTemplatesFilter : handleSelectNoneFilterCollection,
      filterFieldTypes: templateEditor.filterFieldTypes,
      onToggleFilterFieldType: templateEditor.toggleFieldTypeFilter,
      onClearFieldTypeFilters: templateEditor.clearFieldTypeFilters,
      onSelectNoneFieldTypeFilter: templateEditor.selectNoneFieldTypeFilter,
      fieldTypeCounts,
      // A new field lands in its own group, opened if it was collapsed
      onAddNewField: (type: FieldType) => {
        if (templateEditor.collapsedBlueprintGroups.has(blueprintGroupOf(type))) templateEditor.toggleBlueprintGroup(blueprintGroupOf(type));
        void templateEditor.addField(type);
      },
      filterHierarchyTypes: templateEditor.filterHierarchyTypes,
      onToggleFilterHierarchyType: templateEditor.toggleHierarchyTypeFilter,
      onClearHierarchyTypeFilters: templateEditor.clearHierarchyTypeFilters,
      onSelectNoneHierarchyTypeFilter: templateEditor.selectNoneHierarchyTypeFilter,
      hierarchyTypeCounts,
    };
  };

  return {
    handleTreeSelectItem,
    handleTriggerEditItem,
    handleTriggerDeleteItem,
    renderTreePanel,
    renderPanelBody,
    treeHeaderProps,
  };
}
