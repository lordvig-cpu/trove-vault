'use client';

import { useState, useEffect, useRef } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DockContent } from '@/hooks/usePanelDockDrag';
import NavigationHeader from '@/components/NavigationHeader';
import NavigationFooter from '@/components/NavigationFooter';
import MainContent from '@/components/MainContent';
import PrimarySidePanel from '@/components/PrimarySidePanel';
import PrimarySidePanelHeader from '@/components/PrimarySidePanelHeader';
import SecondarySidePanel from '@/components/SecondarySidePanel';
import BottomPanel from '@/components/BottomPanel';
import PanelDockDropZones from '@/components/PanelDockDropZones';
import { TreePanelContext } from '@/context/TreePanelContext';
import TreeContent from '@/components/TreeContent';
import ModalContainers from '@/components/ModalContainers';
import DynamicWatermark from '@/components/DynamicWatermark';
import TemplateFieldInspector from '@/components/TemplateFieldInspector';
import TemplateLayoutPalette from '@/components/TemplateLayoutPalette';
import TemplatePropertiesInspector from '@/components/TemplatePropertiesInspector';
import TemplateHierarchyTree from '@/components/TemplateHierarchyTree';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
import { useWorkspaceDock } from '@/hooks/useWorkspaceDock';
import { useHierarchyState } from '@/hooks/useHierarchyState';
import { useTreePanels } from '@/hooks/useTreePanels';
import { TreeTab } from '@/lib/filterTreeForest';
import { itemMatchesQuery } from '@/lib/treeUtils';

/**
 * Whether Edit Template opens and pins the left, right and bottom panels. Off while the editor is
 * still being built: their template content is still loaded into the docks, but they stay as the
 * user left them (open them from the footer dock buttons).
 */
const AUTO_OPEN_TEMPLATE_PANELS = false;

export default function Home() {
  /* ------------------------------------------------------------------------
     1. DATA LAYER (Supabase Records, Trees & CRUD Mutations)
     ------------------------------------------------------------------------ */
  const {
    allCollections,
    allItems,
    templates,
    activeCollectionId,
    setActiveCollectionId,
    activeCollection,
    selectedItem,
    setSelectedItem,
    selectItemWithChildren,
    unifiedForest,
    loading,
    error,
    fetchAllData,
    renameCollection,
    renameItem,
    renameTemplate,
    deleteTemplate,
  } = useCollections();

  /* ------------------------------------------------------------------------
     2. MODAL DIALOG STATE
     ------------------------------------------------------------------------ */
  const {
    activeModal,
    closeModal,
    openTemplateManager,
    openDeleteCollection,
    openCreateCollection,
    openCreateItem,
    openEditItem,
    openDeleteItem,
  } = useModals();

  /* ------------------------------------------------------------------------
     3. TREE TABS, FILTERS & TREE STATE
     ------------------------------------------------------------------------ */
  const {
    activeSearchPanel,
    setActiveSearchPanel,
    collectionsFilterIds,
    setCollectionsFilterIds,
    templatesFilterIds,
    setTemplatesFilterIds,
    filterCollectionIds,
    handleToggleFilterCollection,
    handleClearCollectionFilters,
    filteredForest,
    collectionsForest,
    collectionsTree,
    handleToggleCollectionsFilter,
    templatesForest,
    templatesTree,
    handleToggleTemplatesFilter,
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,
  } = useTreePanels({ unifiedForest, allItems, allCollections, templates });

  /* ------------------------------------------------------------------------
     4. GLOBAL UI & LAYOUT PREFERENCES
     ------------------------------------------------------------------------ */
  const {
    isPinned,
    setIsPinned,
    isSecondaryPinned,
    setIsSecondaryPinned,
    isBottomPinned,
    setIsBottomPinned,
    isAudioEnabled,
    animationsEnabled,
    isHydrated,
  } = useUIPreferences();

  /* ------------------------------------------------------------------------
     5. LOCAL VIEWPORT & INTERACTION STATES
     ------------------------------------------------------------------------ */
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const {
    isCollectionsFlyoutOpen,
    setIsCollectionsFlyoutOpen,
    isTemplatesFlyoutOpen,
    setIsTemplatesFlyoutOpen,
    isPrimaryFlyoutOpen,
    setIsPrimaryFlyoutOpen,
    isPrimarySidePanelOpen,
    setIsPrimarySidePanelOpen,
    isSecondaryOpen,
    setIsSecondaryOpen,
    isBottomPanelOpen,
    setIsBottomPanelOpen,
    bottomPanelContent,
    setBottomPanelContent,
    primaryPanelWidth,
    setPrimaryPanelWidth,
    secondaryPanelWidth,
    setSecondaryPanelWidth,
    bottomPanelHeight,
    setBottomPanelHeight,
    primaryTabs,
    setPrimaryTabs,
    primaryActiveTab,
    setPrimaryActiveTab,
    secondaryTabs,
    setSecondaryTabs,
    secondaryActiveTab,
    setSecondaryActiveTab,
    slidingState,
    isBottomActive,
    isPrimaryActive,
    isSecondaryActive,
    handlePrimaryTabChange,
    handleSecondaryTabChange,
    leftOccupiedWidth,
    rightOccupiedWidth,
    handleMovePrimaryContent,
    handleMoveSecondaryContent,
    canMoveBottomLeft,
    canMoveBottomRight,
    handleDropPanel,
    isDraggingPanel,
    draggingPanel,
    hoveredZone,
    cursorPos,
    tabReorderInfo,
    isTabReorder,
    startDockDrag,
    cancelDrag,
  } = useWorkspaceDock();

  /* ------------------------------------------------------------------------
     5.1 TEMPLATE BLUEPRINT EDITOR & TAB PRESERVATION
     ------------------------------------------------------------------------ */
  const templateEditor = useTemplateEditor({
    onRefreshData: fetchAllData,
    getTabSnapshot: () => ({
      primaryTabs,
      primaryActiveTab,
      secondaryTabs,
      secondaryActiveTab,
      isPrimarySidePanelOpen,
      isSecondaryOpen,
      isPinned,
      isSecondaryPinned,
      bottomPanelContent,
      isBottomPanelOpen,
      isBottomPinned,
    }),
    onRestoreTabs: (snapshot) => {
      setPrimaryTabs(snapshot.primaryTabs);
      setPrimaryActiveTab(snapshot.primaryActiveTab);
      setSecondaryTabs(snapshot.secondaryTabs);
      setSecondaryActiveTab(snapshot.secondaryActiveTab);
      setIsPrimarySidePanelOpen(snapshot.isPrimarySidePanelOpen);
      setIsSecondaryOpen(snapshot.isSecondaryOpen);
      setIsPinned(snapshot.isPinned);
      setIsSecondaryPinned(snapshot.isSecondaryPinned);
      setBottomPanelContent(snapshot.bottomPanelContent);
      setIsBottomPanelOpen(snapshot.isBottomPanelOpen);
      setIsBottomPinned(snapshot.isBottomPinned);
    },
    onOpenPrimaryPanel: (tabs, activeTab) => {
      setPrimaryTabs(tabs);
      setPrimaryActiveTab(activeTab);
      if (AUTO_OPEN_TEMPLATE_PANELS) {
        setIsPrimarySidePanelOpen(true);
        setIsPinned(true);
      }
    },
    onOpenSecondaryPanel: (tabs, activeTab) => {
      setSecondaryTabs(tabs);
      setSecondaryActiveTab(activeTab);
      if (AUTO_OPEN_TEMPLATE_PANELS) {
        setIsSecondaryOpen(true);
        setIsSecondaryPinned(true);
      }
    },
    onOpenBottomPanel: (content) => {
      setBottomPanelContent(content);
      if (AUTO_OPEN_TEMPLATE_PANELS) {
        setIsBottomPanelOpen(true);
        setIsBottomPinned(true);
      }
    },
  });

  const {
    hierarchyExpandedIds,
    hierarchyNodeCount,
    isAllHierarchyExpanded,
    toggleAllHierarchy,
    toggleHierarchyExpand,
    handleOpenProperties,
    handlePlaceField,
    handleAddContainer,
  } = useHierarchyState(templateEditor);

  /* ------------------------------------------------------------------------
     8. GLOBAL KEYBOARD SHORTCUTS
     ------------------------------------------------------------------------ */
  const searchFocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (searchFocusTimer.current) clearTimeout(searchFocusTimer.current);
  }, []);

  const focusSidePanelSearch = (side: 'left' | 'right') => {
    if (activeModal) return;
    if (searchFocusTimer.current) clearTimeout(searchFocusTimer.current);

    if (side === 'left') {
      const activeLeftContent = isTemplatesFlyoutOpen
        ? 'templates'
        : isCollectionsFlyoutOpen
        ? 'collections'
        : isPrimaryFlyoutOpen
        ? 'items'
        : primaryActiveTab;
      if (activeLeftContent === 'items' || activeLeftContent === 'collections' || activeLeftContent === 'templates') {
        setActiveSearchPanel(activeLeftContent);
      }
      if (!isPrimarySidePanelOpen && !isPrimaryFlyoutOpen && !isCollectionsFlyoutOpen && !isTemplatesFlyoutOpen) {
        setIsPrimarySidePanelOpen(true);
      }
    } else {
      if (secondaryActiveTab === 'items' || secondaryActiveTab === 'collections' || secondaryActiveTab === 'templates') {
        setActiveSearchPanel(secondaryActiveTab);
      }
      if (!isSecondaryOpen) {
        setIsSecondaryOpen(true);
      }
    }

    const attemptFocus = (remaining: number) => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        `[data-search-position="${side}"]`
      );
      const input = Array.from(inputs).find(
        (element) => !element.closest('[inert]') && element.getClientRects().length > 0
      );
      if (input) {
        input.focus();
        input.select();
      } else if (remaining > 0) {
        searchFocusTimer.current = setTimeout(() => attemptFocus(remaining - 1), 50);
      }
    };
    attemptFocus(10);
  };

  useKeyboardShortcuts([
    {
      key: 'Escape',
      allowInInputs: true,
      action: () => {
        if (isDraggingPanel) {
          cancelDrag();
          return;
        }

        if (activeModal) {
          closeModal();
          return;
        }

        if (isCollectionsFlyoutOpen) {
          setIsCollectionsFlyoutOpen(false);
          return;
        }

        if (isTemplatesFlyoutOpen) {
          setIsTemplatesFlyoutOpen(false);
          return;
        }

        if (searchQuery.trim().length > 0) {
          setSearchQuery('');
          return;
        }

        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }

        if (isPrimaryFlyoutOpen) {
          setIsPrimaryFlyoutOpen(false);
          return;
        }

        if (isPrimarySidePanelOpen && !isPinned) {
          setIsPrimarySidePanelOpen(false);
          return;
        }

        if (isSecondaryOpen && !isSecondaryPinned) {
          setIsSecondaryOpen(false);
          return;
        }

        if (isPinned) {
          setIsPinned(false);
          setIsPrimarySidePanelOpen(false);
          return;
        }

        if (isSecondaryPinned) {
          setIsSecondaryPinned(false);
          setIsSecondaryOpen(false);
          return;
        }
      },
    },
    {
      key: 'k',
      ctrl: true,
      allowInInputs: true,
      action: () => focusSidePanelSearch('left'),
    },
    {
      key: 'l',
      ctrl: true,
      allowInInputs: true,
      action: () => focusSidePanelSearch('right'),
    },
  ]);

  /* ------------------------------------------------------------------------
     9. EVENT HANDLERS & DELEGATION
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     10. MEMOIZED TREE SUB-COMPONENTS & PANEL CONTENT RENDERERS
     ------------------------------------------------------------------------ */
  const closeTreeFlyout = (content: 'items' | 'collections' | 'templates') => {
    if (content === 'collections') setIsCollectionsFlyoutOpen(false);
    else if (content === 'templates') setIsTemplatesFlyoutOpen(false);
    else setIsPrimaryFlyoutOpen(false);
  };

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

  const getPanelTitle = (tabs: DockContent[], activeTab: DockContent, defaultTitle: string) => {
    if (tabs.length === 0) return defaultTitle;
    if (tabs.length === 1) {
      if (tabs[0] === 'items') return 'ITEMS';
      if (tabs[0] === 'collections') return 'COLLECTIONS';
      if (tabs[0] === 'templates') return 'TEMPLATES';
      if (tabs[0] === 'template_editor') return 'TEMPLATE INSPECTOR';
      if (tabs[0] === 'template_properties') return 'PROPERTIES';
      if (tabs[0] === 'template_builder') return 'LAYOUT BUILDER';
      if (tabs[0] === 'template_hierarchy') return 'STRUCTURE';
      if (tabs[0] === 'grabbed_content') return 'GRABBED CONTENT';
    }
    if (activeTab === 'items') return 'ITEMS';
    if (activeTab === 'collections') return 'COLLECTIONS';
    if (activeTab === 'templates') return 'TEMPLATES';
    if (activeTab === 'template_editor') return 'TEMPLATE INSPECTOR';
    if (activeTab === 'template_properties') return 'PROPERTIES';
    if (activeTab === 'template_builder') return 'LAYOUT BUILDER';
    if (activeTab === 'template_hierarchy') return 'STRUCTURE';
    if (activeTab === 'grabbed_content') return 'GRABBED CONTENT';
    return defaultTitle;
  };

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

  const itemsFlyoutPanel = (
    <PrimarySidePanel
      title="ITEMS"
      {...treeHeaderProps('items')}
      hasDockedContent
      variant="flyout"
      position="left"
      isOpen={isPrimaryFlyoutOpen}
      onClose={() => setIsPrimaryFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('items', position)}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('items', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
    >
      {renderTreePanel('left', 'items', true)}
    </PrimarySidePanel>
  );

  const collectionsFlyoutPanel = (
    <PrimarySidePanel
      title="COLLECTIONS"
      {...treeHeaderProps('collections')}
      hasDockedContent
      variant="flyout"
      position="left"
      isOpen={isCollectionsFlyoutOpen}
      onClose={() => setIsCollectionsFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('collections', position)}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('collections', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
    >
      {renderTreePanel('left', 'collections', true)}
    </PrimarySidePanel>
  );

  const templatesFlyoutPanel = (
    <PrimarySidePanel
      title="TEMPLATES"
      {...treeHeaderProps('templates')}
      hasDockedContent
      variant="flyout"
      position="left"
      isOpen={isTemplatesFlyoutOpen}
      onClose={() => setIsTemplatesFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('templates', position)}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('templates', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
    >
      {renderTreePanel('left', 'templates', true)}
    </PrimarySidePanel>
  );

  const primaryMoveTooltip =
    primaryTabs.length === 0
      ? 'Content must be docked first'
      : isBottomActive && bottomPanelContent === 'empty' && primaryTabs.length === 1 && primaryTabs[0] === 'grabbed_content'
      ? 'Move Grabbed Content to Bottom Panel'
      : secondaryTabs.length > 0
      ? `Swap ${getPanelTitle(primaryTabs, primaryActiveTab, 'Primary')} and ${getPanelTitle(secondaryTabs, secondaryActiveTab, 'Secondary')}`
      : `Move ${getPanelTitle(primaryTabs, primaryActiveTab, 'Side Bar')} to Secondary Side Bar`;

  const secondaryMoveTooltip =
    secondaryTabs.length === 0
      ? 'Content must be docked first'
      : isBottomActive && bottomPanelContent === 'empty' && secondaryTabs.length === 1 && secondaryTabs[0] === 'grabbed_content'
      ? 'Move Grabbed Content to Bottom Panel'
      : primaryTabs.length > 0
      ? `Swap ${getPanelTitle(secondaryTabs, secondaryActiveTab, 'Secondary')} and ${getPanelTitle(primaryTabs, primaryActiveTab, 'Primary')}`
      : `Move ${getPanelTitle(secondaryTabs, secondaryActiveTab, 'Side Bar')} to Primary Side Bar`;

  const canMovePrimary = primaryTabs.length > 0 && !slidingState;
  const canMoveSecondary = secondaryTabs.length > 0 && !slidingState;

  const itemsSidebarPanel = (
    <PrimarySidePanel
      title={getPanelTitle(primaryTabs, primaryActiveTab, 'PRIMARY SIDE PANEL')}
      {...treeHeaderProps(primaryActiveTab)}
      tabs={primaryTabs}
      activeTab={primaryActiveTab}
      onTabChange={handlePrimaryTabChange}
      hasDockedContent={primaryTabs.length > 0}
      isContentSliding={slidingState !== null && !(slidingState.incomingContent && slidingState.from === 'left' && slidingState.isMoving)}
      showSearchFilter={primaryActiveTab === 'items' || primaryActiveTab === 'collections' || primaryActiveTab === 'templates' || primaryActiveTab === 'template_editor'}
      hierarchyNodeCount={hierarchyNodeCount}
      variant="sidebar"
      position="left"
      onTogglePosition={primaryTabs.length > 0 ? handleMovePrimaryContent : undefined}
      moveTooltip={primaryMoveTooltip}
      canMove={canMovePrimary}
      isOpen={isPrimaryActive}
      isPinned={isPinned}
      onOpen={() => setIsPrimarySidePanelOpen(true)}
      onClose={() => {
        setIsPrimarySidePanelOpen(false);
        setIsPinned(false);
      }}
      onTogglePin={() => {
        if (!isPinned) {
          setIsPinned(true);
          setIsPrimarySidePanelOpen(true);
        } else {
          setIsPinned(false);
          setIsPrimarySidePanelOpen(true);
        }
      }}
      reservedWidth={isSecondaryActive ? secondaryPanelWidth : 0}
      onWidthChange={setPrimaryPanelWidth}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('primary', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
      isDragging={isDraggingPanel}
      reorderInfo={tabReorderInfo}
    >
      {renderPanelBody(primaryActiveTab, 'left')}
    </PrimarySidePanel>
  );

  /* ------------------------------------------------------------------------
     12. VIEWPORT COMPOSITION & PRESENTATION SHELL
     ------------------------------------------------------------------------ */
  return (
    <div
      className={[
        'relative flex flex-col h-full w-full overflow-hidden',
        'bg-canvas text-content-primary studio-grid-canvas',
      ].join(' ')}
    >
      {/* Dynamic Watermark Background & Video Trigger */}
      {!templateEditor.isEditing && (
        <DynamicWatermark
          isHovered={isLogoHovered}
          onHoverChange={setIsLogoHovered}
          isAudioEnabled={isAudioEnabled}
        />
      )}

      {/* Primary Application Shell */}
      <div className="flex flex-col h-full w-full">
        {/* Tier 1: Top Navigation Header */}
        <div className="shrink-0 relative z-[80]">
          <NavigationHeader
            activeCollectionName={activeCollection ? activeCollection.name : 'Select Collection'}
            onOpenTemplateManager={() => {
              if (activeCollection) {
                openTemplateManager(activeCollection.id, activeCollection.name);
              } else {
                openTemplateManager(null, undefined);
              }
            }}
            isPrimarySidePanelOpen={isPrimaryFlyoutOpen}
            onTogglePrimarySidePanel={() => { setIsCollectionsFlyoutOpen(false); setIsTemplatesFlyoutOpen(false); setIsPrimaryFlyoutOpen(!isPrimaryFlyoutOpen); }}
            unpinnedPrimaryPanel={itemsFlyoutPanel}
            collectionsFlyoutPanel={collectionsFlyoutPanel}
            isCollectionsOpen={isCollectionsFlyoutOpen}
            onToggleCollections={() => { setIsPrimaryFlyoutOpen(false); setIsTemplatesFlyoutOpen(false); setIsCollectionsFlyoutOpen(!isCollectionsFlyoutOpen); }}
            collectionsDockedSide={primaryTabs.includes('collections') ? 'left' : secondaryTabs.includes('collections') ? 'right' : null}
            onStartCollectionsDrag={e => startDockDrag('collections', e)}
            templatesFlyoutPanel={templatesFlyoutPanel}
            isTemplatesOpen={isTemplatesFlyoutOpen}
            onToggleTemplates={() => { setIsPrimaryFlyoutOpen(false); setIsCollectionsFlyoutOpen(false); setIsTemplatesFlyoutOpen(!isTemplatesFlyoutOpen); }}
            templatesDockedSide={primaryTabs.includes('templates') ? 'left' : secondaryTabs.includes('templates') ? 'right' : null}
            onStartTemplatesDrag={e => startDockDrag('templates', e)}
            itemsDockedSide={primaryTabs.includes('items') ? 'left' : secondaryTabs.includes('items') ? 'right' : null}
            onStartItemsDrag={(e) => startDockDrag('items', e)}
            onStartGrabbedContentDrag={(e) => startDockDrag('grabbed_content', e)}
            onAddNewItem={() => {
              openCreateItem(activeCollectionId, null);
            }}
          />
        </div>

        {/* Tier 2: Center Workspace (Sidebars, Canvas, and Bottom Panel) */}
        <div
          className={[
            'flex flex-1 min-h-0 relative overflow-hidden',
            'transition-opacity duration-500 ease-in-out',
            isLogoHovered && animationsEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
        >
          {/* Visual Dock Drop Targets (OKLCH Dynamic Palette) */}
          <div className="navigation-workspace-shadow" aria-hidden="true" />
          <PanelDockDropZones
            isDragging={isDraggingPanel}
            draggingPanel={draggingPanel}
            hoveredZone={hoveredZone}
            cursorPos={cursorPos}
            isTabReorder={isTabReorder}
            primaryPanelContent={primaryActiveTab}
            secondaryPanelContent={secondaryActiveTab}
            bottomPanelContent={bottomPanelContent}
            primaryTabs={primaryTabs}
            secondaryTabs={secondaryTabs}
            primaryActiveTab={primaryActiveTab}
            secondaryActiveTab={secondaryActiveTab}
          />

          {/* Primary Side Panel (Tree / Grabbed Content) - Sits Above Main Content (z-50) */}
          {itemsSidebarPanel}

          {/* Center Main Stage / Detail Canvas (Full-Width Base Layer z-10) */}
          <div
            style={{
              marginLeft: `${leftOccupiedWidth}px`,
              marginRight: `${rightOccupiedWidth}px`,
              height: isBottomPinned && isBottomActive ? `calc(100% - ${bottomPanelHeight}px)` : '100%',
            }}
            className={[
              'w-full h-full flex-1 min-w-0 relative z-10',
              animationsEnabled && isHydrated ? 'transition-[margin,height] duration-500 ease-in-out' : 'transition-none',
            ].join(' ')}
          >
            <MainContent
              selectedItem={selectedItem}
              activeCollectionId={activeCollectionId}
              isBlurred={isPrimaryFlyoutOpen}
              onAddSubItem={openCreateItem}
              onEditItem={handleTriggerEditItem}
              onDeleteItem={handleTriggerDeleteItem}
              editingTemplate={templateEditor.isEditing ? templateEditor.activeTemplate : null}
              onDoneEditingTemplate={templateEditor.stopEditing}
              flexLayoutConfig={templateEditor.flexLayoutConfig}
              selectedNodeId={templateEditor.selectedNodeId}
              activeContainerId={templateEditor.activeContainerId}
              onSelectNode={handleOpenProperties}
              onAddPrimitive={templateEditor.addFlexPrimitive}
              onAddFlexContainer={handleAddContainer}
              onInsertFlexContainerSibling={templateEditor.insertFlexContainerSibling}
              onUpdateFlexContainer={templateEditor.updateFlexContainer}
              onRemoveFlexContainer={templateEditor.removeFlexContainer}
              onSplitFlexContainer={templateEditor.splitFlexContainer}
              onAddFlexComponent={templateEditor.addFlexComponent}
              onUpdateFlexComponent={templateEditor.updateFlexComponent}
              onRemoveFlexComponent={templateEditor.removeFlexComponent}
              onPlaceField={handlePlaceField}
              onResetFlexLayout={templateEditor.resetFlexLayoutToDefault}
              canvasMode={templateEditor.canvasMode}
              onToggleCanvasMode={templateEditor.toggleCanvasMode}
            />
          </div>

          {/* Dockable Bottom Panel */}
          <BottomPanel
            isOpen={isBottomActive}
            isPinned={isBottomPinned}
            title={
              bottomPanelContent === 'template_builder'
                ? 'LAYOUT BUILDER'
                : bottomPanelContent === 'grabbed_content'
                ? 'GRABBED CONTENT'
                : 'BOTTOM PANEL'
            }
            tabLabel={
              bottomPanelContent === 'template_builder'
                ? 'Builder'
                : bottomPanelContent === 'grabbed_content'
                ? 'Grabbed Content'
                : undefined
            }
            tabTitle={
              bottomPanelContent === 'template_builder'
                ? 'Template Layout Builder (drag to move tab)'
                : bottomPanelContent === 'grabbed_content'
                ? 'Grabbed Content (drag to move tab)'
                : undefined
            }
            onStartTabDrag={(e) => {
              if (bottomPanelContent !== 'empty') {
                startDockDrag(bottomPanelContent, e);
              }
            }}
            onClose={() => {
              setIsBottomPanelOpen(false);
              setIsBottomPinned(false);
            }}
            onTogglePin={() => {
              setIsBottomPinned(!isBottomPinned);
              setIsBottomPanelOpen(true);
            }}
            reservedLeft={leftOccupiedWidth}
            reservedRight={rightOccupiedWidth}
            canMoveLeft={canMoveBottomLeft}
            canMoveRight={canMoveBottomRight}
            onMoveLeft={() => handleDropPanel('bottom', 'left')}
            onMoveRight={() => handleDropPanel('bottom', 'right')}
            onHandlePointerDown={(e) => startDockDrag('bottom', e)}
            onHeightChange={setBottomPanelHeight}
          >
            {bottomPanelContent !== 'empty' ? renderPanelBody(bottomPanelContent, 'bottom') : null}
          </BottomPanel>

          {/* Secondary Side Panel (Details / Inspector Drawer / Grabbed Content) - Sits Above Main Content (z-40) */}
          <SecondarySidePanel
            title={getPanelTitle(secondaryTabs, secondaryActiveTab, 'SECONDARY SIDE PANEL')}
            {...treeHeaderProps(secondaryActiveTab)}
            tabs={secondaryTabs}
            activeTab={secondaryActiveTab}
            onTabChange={handleSecondaryTabChange}
            hasDockedContent={secondaryTabs.length > 0}
            isContentSliding={slidingState !== null && !(slidingState.incomingContent && slidingState.from === 'right' && slidingState.isMoving)}
            showSearchFilter={secondaryActiveTab === 'items' || secondaryActiveTab === 'collections' || secondaryActiveTab === 'templates' || secondaryActiveTab === 'template_editor'}
            hierarchyNodeCount={hierarchyNodeCount}
            isOpen={isSecondaryActive}
            isPinned={isSecondaryPinned}
            position="right"
            onTogglePosition={secondaryTabs.length > 0 ? handleMoveSecondaryContent : undefined}
            moveTooltip={secondaryMoveTooltip}
            canMove={canMoveSecondary}
            onOpen={() => setIsSecondaryOpen(true)}
            onClose={() => {
              setIsSecondaryOpen(false);
              setIsSecondaryPinned(false);
            }}
            onTogglePin={() => {
              if (!isSecondaryPinned) {
                setIsSecondaryPinned(true);
                setIsSecondaryOpen(true);
              } else {
                setIsSecondaryPinned(false);
                setIsSecondaryOpen(true);
              }
            }}
            reservedWidth={isPrimaryActive ? primaryPanelWidth : 0}
            onWidthChange={setSecondaryPanelWidth}
            onAddNewItem={() => openCreateItem(null, null)}
            onAddNewCollection={() => openCreateCollection(null)}
            onAddNewTemplate={() => openTemplateManager(null, undefined)}
            collections={allCollections}
            onHandlePointerDown={(e) => startDockDrag('secondary', e)}
            onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
            isDragging={isDraggingPanel}
            reorderInfo={tabReorderInfo}
          >
            {renderPanelBody(secondaryActiveTab, 'right')}
          </SecondarySidePanel>

          {/* Smooth Sliding Content Transition Layer */}
          {slidingState && (
            <aside
              style={{
                width: `${slidingState.width}px`,
                left: slidingState.isMoving
                  ? slidingState.to === 'right'
                    ? `calc(100% - ${slidingState.width}px)`
                    : '0px'
                  : slidingState.from === 'left'
                  ? '0px'
                  : `calc(100% - ${slidingState.width}px)`,
                zIndex: 55,
              }}
              className={[
                'primary-side-panel absolute top-0 bottom-0 flex flex-col pointer-events-none shadow-2xl',
                slidingState.to === 'right' ? 'primary-side-panel-docked-right' : 'primary-side-panel-docked-left',
                animationsEnabled
                  ? 'transition-[left,transform] duration-500 ease-in-out'
                  : 'transition-none',
              ].join(' ')}
            >
              <PrimarySidePanelHeader
                title={getPanelTitle(slidingState.tabs, slidingState.activeTab, 'SIDE PANEL')}
                {...treeHeaderProps(slidingState.activeTab)}
                tabs={slidingState.tabs}
                activeTab={slidingState.activeTab}
                hasDockedContent={slidingState.tabs.length > 0}
                showSearchFilter={slidingState.activeTab === 'items' || slidingState.activeTab === 'collections' || slidingState.activeTab === 'templates'}
                variant="sidebar"
                isPinned={slidingState.to === 'left' ? isPinned : isSecondaryPinned}
                position={slidingState.to}
                onTogglePin={() => {}}
                onClose={() => {}}
              />
              <div className={`flex-1 min-h-0 overflow-hidden ${slidingState.activeTab !== 'empty' ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
                {renderPanelBody(slidingState.activeTab, slidingState.to)}
              </div>
              <div
                className={`panel-bottom-topper ${
                  slidingState.tabs.length > 0 ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
                } shrink-0 select-none pointer-events-none`}
                aria-hidden="true"
              />
            </aside>
          )}

          {slidingState?.secondaryTabs && (
            <aside
              style={{
                width: `${slidingState.secondaryWidth}px`,
                left: slidingState.isMoving
                  ? slidingState.to === 'right'
                    ? '0px'
                    : `calc(100% - ${slidingState.secondaryWidth}px)`
                  : slidingState.from === 'left'
                  ? `calc(100% - ${slidingState.secondaryWidth}px)`
                  : '0px',
                zIndex: 54,
              }}
              className={[
                'secondary-side-panel absolute top-0 bottom-0 flex flex-col pointer-events-none shadow-2xl',
                slidingState.to === 'right' ? 'secondary-side-panel-left' : 'secondary-side-panel-right',
                animationsEnabled
                  ? 'transition-[left,transform] duration-500 ease-in-out'
                  : 'transition-none',
              ].join(' ')}
            >
              <PrimarySidePanelHeader
                title={getPanelTitle(slidingState.secondaryTabs, slidingState.secondaryActiveTab ?? 'empty', 'SIDE PANEL')}
                hasDockedContent={slidingState.secondaryTabs.length > 0}
                showSearchFilter={slidingState.secondaryActiveTab === 'items' || slidingState.secondaryActiveTab === 'collections'}
                variant="sidebar"
                isPinned={slidingState.to === 'right' ? isPinned : isSecondaryPinned}
                position={slidingState.to === 'right' ? 'left' : 'right'}
                {...treeHeaderProps(slidingState.secondaryActiveTab ?? 'empty')}
                tabs={slidingState.secondaryTabs}
                activeTab={slidingState.secondaryActiveTab}
                onTogglePin={() => {}}
                onClose={() => {}}
              />
              <div className={`flex-1 min-h-0 overflow-hidden ${slidingState.secondaryActiveTab !== 'empty' ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
                {renderPanelBody(slidingState.secondaryActiveTab ?? 'empty', slidingState.to === 'right' ? 'left' : 'right')}
              </div>
              <div
                className={`panel-bottom-topper ${
                  slidingState.secondaryTabs.length > 0 ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
                } shrink-0 select-none pointer-events-none`}
                aria-hidden="true"
              />
            </aside>
          )}
        </div>

        {/* Tier 3: Bottom Navigation Footer & Status */}
        <div className="shrink-0 relative z-[60]">
          <NavigationFooter
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isPrimaryOpen={isPrimaryActive}
            onTogglePrimary={() => {
              if (isPrimaryActive) {
                setIsPrimarySidePanelOpen(false);
                setIsPinned(false);
              } else {
                setIsPrimarySidePanelOpen(true);
              }
            }}
            isBottomOpen={isBottomActive}
            onToggleBottom={() => {
              if (isBottomActive) {
                setIsBottomPanelOpen(false);
                setIsBottomPinned(false);
              } else {
                setIsBottomPanelOpen(true);
              }
            }}
            isSecondaryOpen={isSecondaryActive}
            onToggleSecondary={() => {
              if (isSecondaryActive) {
                setIsSecondaryOpen(false);
                setIsSecondaryPinned(false);
              } else {
                setIsSecondaryOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Modals & Dialog Portals */}
      <ModalContainers
        activeModal={activeModal}
        closeModal={closeModal}
        allItems={allItems}
        collections={allCollections}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        fetchAllData={fetchAllData}
      />
    </div>
  );
}
