'use client';

import { useState, useCallback } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useExplorerCategories } from '@/hooks/useExplorerCategories';
import { usePanelDockDrag, DockablePanelId, DockDropTargetZone } from '@/hooks/usePanelDockDrag';
import NavigationHeader from '@/components/NavigationHeader';
import NavigationFooter from '@/components/NavigationFooter';
import MainContent from '@/components/MainContent';
import PrimarySidePanel from '@/components/PrimarySidePanel';
import SecondarySidePanel from '@/components/SecondarySidePanel';
import BottomPanel from '@/components/BottomPanel';
import PanelDockDropZones from '@/components/PanelDockDropZones';
import ExplorerContent from '@/components/ExplorerContent';
import ModalContainers from '@/components/ModalContainers';
import DynamicWatermark from '@/components/DynamicWatermark';
import { filterExplorerForest, ExplorerTab } from '@/lib/filterExplorerForest';

export interface UniversalSearchResultItem extends ItemRecord {
  collection_name?: string;
}

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
     3. EXPLORER TABS, FILTERS & TREE STATE
     ------------------------------------------------------------------------ */
  const [activeExplorerTab, setActiveExplorerTab] = useState<ExplorerTab>('items');
  const [filterCollectionIds, setFilterCollectionIds] = useState<number[]>([]);

  const handleToggleFilterCollection = (id: number) => {
    setFilterCollectionIds((prev) => 
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
    setActiveExplorerTab('collections');
  };

  const handleClearCollectionFilters = () => {
    setFilterCollectionIds([]);
  };

  const filteredForest = filterExplorerForest(
    unifiedForest,
    filterCollectionIds,
    activeExplorerTab,
    allItems,
    allCollections,
    templates
  );

  const {
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,
  } = useExplorerCategories(filteredForest);

  /* ------------------------------------------------------------------------
     4. GLOBAL UI & LAYOUT PREFERENCES
     ------------------------------------------------------------------------ */
  const {
    isPinned,
    togglePin,
    setIsPinned,
    isAudioEnabled,
    primaryPosition,
    setPrimaryPosition,
    secondaryPosition,
    setSecondaryPosition,
  } = useUIPreferences();

  /* ------------------------------------------------------------------------
     5. LOCAL VIEWPORT & INTERACTION STATES
     ------------------------------------------------------------------------ */
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isPrimarySidePanelOpen, setIsPrimarySidePanelOpen] = useState<boolean>(false);
  const [isSecondarySidePanelOpen, setIsSecondarySidePanelOpen] = useState<boolean>(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(false);
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [primaryPanelWidth, setPrimaryPanelWidth] = useState<number>(304);
  const [secondaryPanelWidth, setSecondaryPanelWidth] = useState<number>(304);

  // Dynamic mutually exclusive positions
  const effectivePrimaryPosition = primaryPosition === 'right' ? 'right' : 'left';
  const effectiveSecondaryPosition = effectivePrimaryPosition === 'left' ? 'right' : 'left';

  /* ------------------------------------------------------------------------
     6. PANEL POSITION TOGGLES (Mutually Exclusive Clean Swapping)
     ------------------------------------------------------------------------ */
  const handleTogglePrimaryPosition = useCallback(() => {
    const nextPrimary = effectivePrimaryPosition === 'left' ? 'right' : 'left';
    setPrimaryPosition(nextPrimary);
    setSecondaryPosition(nextPrimary === 'right' ? 'left' : 'right');
  }, [effectivePrimaryPosition, setPrimaryPosition, setSecondaryPosition]);

  const handleToggleSecondaryPosition = useCallback(() => {
    const nextSecondary = effectiveSecondaryPosition === 'left' ? 'right' : 'left';
    setSecondaryPosition(nextSecondary);
    setPrimaryPosition(nextSecondary === 'right' ? 'left' : 'right');
  }, [effectiveSecondaryPosition, setPrimaryPosition, setSecondaryPosition]);

  /* ------------------------------------------------------------------------
     7. PANEL DOCK DRAG & DROP ORCHESTRATION (Pointer Events API)
     ------------------------------------------------------------------------ */
  const handleDropPanel = useCallback(
    (panelId: DockablePanelId, targetZone: DockDropTargetZone) => {
      if (panelId === 'primary') {
        if (targetZone === 'left') {
          setPrimaryPosition('left');
          setSecondaryPosition('right');
          setIsPinned(true);
        } else if (targetZone === 'right') {
          setPrimaryPosition('right');
          setSecondaryPosition('left');
          setIsPinned(true);
        }
        // Bottom is disallowed for Explorer (primary) panel
      } else if (panelId === 'secondary') {
        if (targetZone === 'left') {
          setSecondaryPosition('left');
          setPrimaryPosition('right');
          setIsSecondarySidePanelOpen(true);
        } else if (targetZone === 'right') {
          setSecondaryPosition('right');
          setPrimaryPosition('left');
          setIsSecondarySidePanelOpen(true);
        } else if (targetZone === 'bottom') {
          setIsBottomPanelOpen(true);
        }
      } else if (panelId === 'bottom') {
        if (targetZone === 'left') {
          // Dragging bottom panel to Left docks Primary to left and opens it
          setPrimaryPosition('left');
          setSecondaryPosition('right');
          setIsPinned(true);
        } else if (targetZone === 'right') {
          // Dragging bottom panel to Right docks Secondary to right and opens it
          setSecondaryPosition('right');
          setPrimaryPosition('left');
          setIsSecondarySidePanelOpen(true);
        } else if (targetZone === 'bottom') {
          setIsBottomPanelOpen(true);
        }
      }
    },
    [setIsPinned, setPrimaryPosition, setSecondaryPosition]
  );

  const {
    isDragging: isDraggingPanel,
    draggingPanel,
    hoveredZone,
    cursorPos,
    handlePointerDown: startDockDrag,
    cancelDrag,
  } = usePanelDockDrag({ onDropPanel: handleDropPanel });

  /* ------------------------------------------------------------------------
     8. GLOBAL KEYBOARD SHORTCUTS
     ------------------------------------------------------------------------ */
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

        if (isPrimarySidePanelOpen && !isPinned) {
          setIsPrimarySidePanelOpen(false);
          return;
        }

        if (isSecondarySidePanelOpen) {
          setIsSecondarySidePanelOpen(false);
        }
      },
    },
    {
      key: 'k',
      ctrl: true,
      action: (e) => {
        e.preventDefault();

        if (!isPinned && !isPrimarySidePanelOpen) {
          setIsPrimarySidePanelOpen(true);
        }

        const targetInputId = isPinned
          ? 'explorer-search-input-sidebar'
          : 'explorer-search-input-flyout';

        setTimeout(() => {
          const searchInput = document.getElementById(targetInputId) as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 50);
      },
    },
  ]);

  /* ------------------------------------------------------------------------
     9. EVENT HANDLERS & DELEGATION
     ------------------------------------------------------------------------ */
  const handleTogglePin = () => {
    togglePin();
    setIsPrimarySidePanelOpen(true);
  };

  const handleTreeSelectItem = (item: ItemRecord, collectionId: number | null) => {
    selectItemWithChildren(item, collectionId);
    if (!isPinned) {
      setIsPrimarySidePanelOpen(false);
    }
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
     10. MEMOIZED EXPLORER SUB-COMPONENTS
     ------------------------------------------------------------------------ */
  const explorerTreeElement = (
    <ExplorerContent
      unifiedForest={filteredForest}
      searchQuery={searchQuery}
      activeCollectionId={activeCollectionId}
      selectedItemId={selectedItem?.id || null}
      expandedCategoryIds={expandedCategoryIds}
      onToggleCategory={handleToggleCategory}
      onSelectCollection={(colId) => {
        setActiveCollectionId(colId);
        if (!isPinned) setIsPrimarySidePanelOpen(false);
      }}
      onSelectItem={handleTreeSelectItem}
      onAddSubItem={openCreateItem}
      onEditTemplate={(categoryId: number) => {
        const templateId = Math.abs(categoryId);
        console.log('Open Template Editor for Template ID:', templateId);
      }}
      onEditCollection={(col) => openTemplateManager(col.id, col.name)}
      onDeleteCollection={openDeleteCollection}
      onEditItem={handleTriggerEditItem}
      onDeleteItem={handleTriggerDeleteItem}
      onRenameCollection={renameCollection}
      onRenameItem={renameItem}
      position={effectivePrimaryPosition}
    />
  );

  const explorerFlyoutPanel = (
    <PrimarySidePanel
      variant="flyout"
      position={effectivePrimaryPosition}
      onTogglePosition={handleTogglePrimaryPosition}
      isOpen={isPrimarySidePanelOpen}
      onClose={() => setIsPrimarySidePanelOpen(false)}
      onTogglePin={handleTogglePin}
      activeTab={activeExplorerTab}
      onTabChange={setActiveExplorerTab}
      isAnyCategoryExpanded={isAnyCategoryExpanded}
      onToggleAllCategories={handleToggleAllCategories}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      collections={allCollections}
      filterCollectionIds={filterCollectionIds}
      onToggleFilterCollection={handleToggleFilterCollection}
      onClearCollectionFilters={handleClearCollectionFilters}
      onHandlePointerDown={(e) => startDockDrag('primary', e)}
    >
      {explorerTreeElement}
    </PrimarySidePanel>
  );

  const explorerSidebarPanel = (
    <PrimarySidePanel
      variant="sidebar"
      position={effectivePrimaryPosition}
      onTogglePosition={handleTogglePrimaryPosition}
      isOpen={isPrimarySidePanelOpen}
      onClose={() => setIsPrimarySidePanelOpen(false)}
      onTogglePin={handleTogglePin}
      activeTab={activeExplorerTab}
      onTabChange={setActiveExplorerTab}
      isAnyCategoryExpanded={isAnyCategoryExpanded}
      onToggleAllCategories={handleToggleAllCategories}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      reservedWidth={isSecondarySidePanelOpen ? secondaryPanelWidth : 0}
      onWidthChange={setPrimaryPanelWidth}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      collections={allCollections}
      filterCollectionIds={filterCollectionIds}
      onToggleFilterCollection={handleToggleFilterCollection}
      onClearCollectionFilters={handleClearCollectionFilters}
      onHandlePointerDown={(e) => startDockDrag('primary', e)}
    >
      {explorerTreeElement}
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
      <DynamicWatermark
        isHovered={isLogoHovered}
        onHoverChange={setIsLogoHovered}
        isAudioEnabled={isAudioEnabled}
      />

      {/* Primary Application Shell */}
      <div className="flex flex-col h-full w-full">
        {/* Tier 1: Top Navigation Header */}
        <div className="shrink-0 relative z-[80]">
          <NavigationHeader
            activeCollectionName={activeCollection ? activeCollection.name : 'Select Collection'}
            collections={allCollections}
            activeCollectionId={activeCollectionId}
            onSelectCollection={(newId) => {
              setActiveCollectionId(newId);
              if (!isPinned) setIsPrimarySidePanelOpen(false);
            }}
            onCollectionsUpdated={() => fetchAllData()}
            isDropdownOpen={isColDropdownOpen}
            setIsDropdownOpen={setIsColDropdownOpen}
            onRequestDeleteCollection={openDeleteCollection}
            onOpenTemplateManager={() => {
              if (activeCollection) {
                openTemplateManager(activeCollection.id, activeCollection.name);
              }
            }}
            isPrimarySidePanelOpen={isPrimarySidePanelOpen}
            onTogglePrimarySidePanel={() => setIsPrimarySidePanelOpen(!isPrimarySidePanelOpen)}
            unpinnedPrimaryPanel={explorerFlyoutPanel}
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
            isLogoHovered ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
        >
          {/* Visual Dock Drop Targets (OKLCH Dynamic Palette) */}
          <PanelDockDropZones
            isDragging={isDraggingPanel}
            draggingPanel={draggingPanel}
            hoveredZone={hoveredZone}
            cursorPos={cursorPos}
          />

          {/* Primary Side Panel (Explorer Tree) - Sits Above Main Content (z-50) */}
          {explorerSidebarPanel}

          {/* Center Main Stage / Detail Canvas (Full-Width Base Layer z-10) */}
          <div className="w-full h-full flex-1 min-w-0 relative z-10">
            <MainContent
              selectedItem={selectedItem}
              activeCollectionId={activeCollectionId}
              isBlurred={!isPinned && isPrimarySidePanelOpen}
              onAddSubItem={openCreateItem}
              onEditItem={handleTriggerEditItem}
              onDeleteItem={handleTriggerDeleteItem}
            />
          </div>

          {/* Collapsible Bottom Diagnostics Drawer - Sits Above Main Content (z-35) */}
          <BottomPanel
            isOpen={isBottomPanelOpen}
            onClose={() => setIsBottomPanelOpen(false)}
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            onHandlePointerDown={(e) => startDockDrag('bottom', e)}
          />

          {/* Secondary Side Panel (Details / Inspector Drawer) - Sits Above Main Content (z-40) */}
          <SecondarySidePanel
            isOpen={isSecondarySidePanelOpen}
            position={effectiveSecondaryPosition}
            onTogglePosition={handleToggleSecondaryPosition}
            onOpen={() => setIsSecondarySidePanelOpen(true)}
            onClose={() => setIsSecondarySidePanelOpen(false)}
            reservedWidth={isPinned ? primaryPanelWidth : 0}
            onWidthChange={setSecondaryPanelWidth}
            onHandlePointerDown={(e) => startDockDrag('secondary', e)}
          />
        </div>

        {/* Tier 3: Bottom Navigation Footer & Status */}
        <div className="shrink-0 relative z-[60]">
          <NavigationFooter
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isPrimaryPinned={isPinned}
            onTogglePrimary={() => togglePin()}
            isBottomOpen={isBottomPanelOpen}
            onToggleBottom={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            isSecondaryOpen={isSecondarySidePanelOpen}
            onToggleSecondary={() => setIsSecondarySidePanelOpen(!isSecondarySidePanelOpen)}
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