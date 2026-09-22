'use client';

import { ItemRecord } from '@/types/item';
import { DockContent } from '@/hooks/usePanelDockDrag';
import { TreeTab } from '@/lib/filterTreeForest';
import { itemMatchesQuery } from '@/lib/treeUtils';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useTreePanels } from '@/hooks/useTreePanels';
import { useHierarchyState } from '@/hooks/useHierarchyState';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
import TreeContent from '@/components/TreeContent';
import { TreePanelContext } from '@/context/TreePanelContext';
import TemplateFieldInspector from '@/components/TemplateFieldInspector';
import TemplateLayoutPalette from '@/components/TemplateLayoutPalette';
import TemplatePropertiesInspector from '@/components/TemplatePropertiesInspector';
import TemplateHierarchyTree from '@/components/TemplateHierarchyTree';

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
}: UsePanelRenderersOptions) {
  const {
    activeCollectionId,
    setActiveCollectionId,
    selectedItem,
    selectItemWithChildren,
    renameCollection,
    renameItem,
    renameTemplate,
    deleteTemplate,
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
    handleToggleCollectionsFilter,
    handleToggleTemplatesFilter,
  } = treePanels;
  const {
    hierarchyExpandedIds,
    hierarchyNodeCount,
    isAllHierarchyExpanded,
    toggleAllHierarchy,
    toggleHierarchyExpand,
    handleOpenProperties,
    handlePlaceField,
    handleAddContainer,
  } = hierarchy;

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
            if (content === 'collections' || content === 'templates') {
              selectItemWithChildren(item, collectionId);
              closeTreeFlyout(content);
            } else handleTreeSelectItem(item, collectionId);
          }}
          onSelectSearchResult={activeSearchPanel === content ? selectItemWithChildren : undefined}
          onAddSubItem={openCreateItem}
          onAddSubCollection={openCreateCollection}
          onEditTemplate={(templateId: number) => {
            setIsTemplatesFlyoutOpen(false);
            setIsCollectionsFlyoutOpen(false);
            setIsPrimaryFlyoutOpen(false);
            const validId = Math.abs(templateId);
            if (validId && validId !== 999) {
              templateEditor.startEditing(validId);
            }
          }}
          onEditCollection={(col) => openTemplateManager(col.id, col.name)}
          onDeleteCollection={openDeleteCollection}
          onDeleteTemplate={deleteTemplate}
          onEditItem={handleTriggerEditItem}
          onDeleteItem={handleTriggerDeleteItem}
          onRenameCollection={renameCollection}
          onRenameTemplate={renameTemplate}
          onRenameItem={renameItem}
          position={pos}
        />
      </TreePanelContext.Provider>
    );
  };

  // Renders whatever a docked tab holds, tree views included: the template editor's inspector,
  // properties panel, layout palette and structure tree, or the grabbed-content placeholder.
  const renderPanelBody = (content: DockContent, pos: 'left' | 'right' | 'bottom') => {
    if (content === 'items' || content === 'collections' || content === 'templates') {
      return renderTreePanel(pos === 'bottom' ? 'left' : pos, content);
    }
    if (content === 'template_editor') {
      return (
        <TemplateFieldInspector
          template={templateEditor.activeTemplate}
          selectedFieldId={templateEditor.selectedFieldId}
          isRootSelected={templateEditor.isRootSelected}
          searchQuery={templateEditor.fieldSearchQuery}
          filterFieldTypes={templateEditor.filterFieldTypes}
          placedFieldIds={templateEditor.placedFieldIds}
          onPlaceField={templateEditor.placeField}
          onSelectField={templateEditor.setSelectedFieldId}
          onSelectRoot={templateEditor.selectRoot}
          onUpdateField={templateEditor.updateField}
          onAddField={templateEditor.addField}
          onDeleteField={templateEditor.deleteField}
          onReorderFields={templateEditor.reorderFields}
          onUpdateTemplateMeta={templateEditor.updateTemplateMetadata}
          onCloseEditor={templateEditor.stopEditing}
          isLoading={templateEditor.isLoading}
          isSaving={templateEditor.isSaving}
          error={templateEditor.error}
          successMsg={templateEditor.successMsg}
          position={pos === 'bottom' ? 'right' : pos}
        />
      );
    }
    if (content === 'template_properties') {
      return (
        <TemplatePropertiesInspector
          template={templateEditor.activeTemplate}
          selectedNode={templateEditor.selectedNode}
          parentNode={templateEditor.selectedContainer}
          onUpdateContainer={templateEditor.updateFlexContainer}
          onUpdateComponent={templateEditor.updateFlexComponent}
          onRemoveNode={(id) => {
            if (templateEditor.selectedNode?.nodeType === 'container') {
              templateEditor.removeFlexContainer(id);
            } else {
              templateEditor.removeFlexComponent(id);
            }
          }}
          onSelectNode={templateEditor.selectNode}
        />
      );
    }
    if (content === 'template_builder') {
      return (
        <TemplateLayoutPalette
          selectedContainer={templateEditor.selectedContainer}
          onAddContainer={(preset) => {
            const mapped =
              preset === '2-col' ? 'split-2' : preset === '3-col' ? 'split-3' : preset;
            templateEditor.addFlexPrimitive(mapped);
          }}
          onAddComponent={(comp) => {
            templateEditor.addFlexComponent(templateEditor.activeContainerId, comp);
          }}
          onResetLayout={templateEditor.resetFlexLayoutToDefault}
        />
      );
    }
    if (content === 'template_hierarchy') {
      return (
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
          onUpdateContainer={templateEditor.updateFlexContainer}
          onUpdateComponent={templateEditor.updateFlexComponent}
          onRemoveContainer={templateEditor.removeFlexContainer}
          onRemoveComponent={templateEditor.removeFlexComponent}
          onPlaceField={handlePlaceField}
          position={pos === 'bottom' ? 'right' : pos}
        />
      );
    }
    if (content === 'grabbed_content') {
      return (
        <div className="p-4 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[220px] select-none">
          <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_oklch,var(--brand-primary)_15%,transparent)] border border-[color-mix(in_oklch,var(--brand-primary)_35%,transparent)] flex items-center justify-center text-2xl shadow-sm">
            📦
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold text-[var(--content-primary,rgba(226,232,240,1))] uppercase tracking-wider">
              Grabbed Content
            </div>
            <p className="text-xs text-[var(--text-muted,rgba(148,163,184,1))] max-w-[200px] leading-relaxed">
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
  // Templates and the template field inspector each keep their own), and the expand-all state.
  // Spread onto the header with {...treeHeaderProps(content)}.
  const treeHeaderProps = (content: DockContent) => {
    const isCollections = content === 'collections';
    const isTemplates = content === 'templates';
    const isInspector = content === 'template_editor';
    const isBuilder = content === 'template_builder';
    const isHierarchy = content === 'template_hierarchy';
    const isProperties = content === 'template_properties';

    // Calculate field type counts for template editor
    const fieldTypeCounts: Record<string, number> = {};
    if (templateEditor.activeTemplate?.fields) {
      for (const f of templateEditor.activeTemplate.fields) {
        fieldTypeCounts[f.field_type] = (fieldTypeCounts[f.field_type] || 0) + 1;
      }
    }

    const isEmpty = content === 'empty';

    return {
      treeView: (isEmpty ? undefined : isCollections ? 'collections' : isTemplates ? 'templates' : 'items') as TreeTab,
      activeTab: (isEmpty
        ? 'empty'
        : isInspector
        ? 'template_editor'
        : isBuilder
        ? 'template_builder'
        : isProperties
        ? 'template_properties'
        : isHierarchy
        ? 'template_hierarchy'
        : isCollections
        ? 'collections'
        : isTemplates
        ? 'templates'
        : content) as TreeTab | DockContent,
      searchQuery: isInspector
        ? templateEditor.fieldSearchQuery
        : isCollections
        ? collectionsTree.searchQuery
        : isTemplates
        ? templatesTree.searchQuery
        : searchQuery,
      onSearchChange: (query: string) => {
        if (isInspector) {
          templateEditor.setFieldSearchQuery(query);
        } else {
          setActiveSearchPanel(isCollections ? 'collections' : isTemplates ? 'templates' : 'items');
          if (isCollections) collectionsTree.setSearchQuery(query);
          else if (isTemplates) templatesTree.setSearchQuery(query);
          else setSearchQuery(query);
        }
      },
      isAnyCategoryExpanded: isHierarchy
        ? isAllHierarchyExpanded
        : isCollections
        ? collectionsTree.isAnyCategoryExpanded
        : isTemplates
        ? templatesTree.isAnyCategoryExpanded
        : isAnyCategoryExpanded,
      onToggleAllCategories: isHierarchy
        ? toggleAllHierarchy
        : isCollections
        ? collectionsTree.handleToggleAllCategories
        : isTemplates
        ? templatesTree.handleToggleAllCategories
        : handleToggleAllCategories,
      hierarchyNodeCount: isHierarchy ? hierarchyNodeCount : undefined,
      filterCollectionIds: isCollections ? collectionsFilterIds : isTemplates ? templatesFilterIds : filterCollectionIds,
      onToggleFilterCollection: isCollections ? handleToggleCollectionsFilter : isTemplates ? handleToggleTemplatesFilter : handleToggleFilterCollection,
      onClearCollectionFilters: isCollections ? () => setCollectionsFilterIds([]) : isTemplates ? () => setTemplatesFilterIds([]) : handleClearCollectionFilters,
      filterFieldTypes: templateEditor.filterFieldTypes,
      onToggleFilterFieldType: templateEditor.toggleFieldTypeFilter,
      onClearFieldTypeFilters: templateEditor.clearFieldTypeFilters,
      fieldTypeCounts,
      onAddNewField: () => templateEditor.addField('text'),
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
