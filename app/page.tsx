'use client';

import { useState } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useExplorerFolders } from '@/hooks/useExplorerFolders';
import NavigationHeader from '@/components/NavigationHeader';
import NavigationFooter from '@/components/NavigationFooter';
import MainContent from '@/components/MainContent';
import RightSidePanel from '@/components/RightSidePanel';
import LeftSidePanel from '@/components/LeftSidePanel';
import ExplorerContent from '@/components/ExplorerContent';
import ModalContainers from '@/components/ModalContainers';
import DynamicWatermark from '@/components/DynamicWatermark';

export interface UniversalSearchResultItem extends ItemRecord {
  collection_name?: string;
}

export default function Home() {
  /* ------------------------------------------------------------------------
     1. DATA LAYER (Supabase Records, Trees & CRUD Mutations)
     Manages active collections, items, selection, and remote persistence.
     ------------------------------------------------------------------------ */
  const {
    allCollections,
    allItems,
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
     Manages active modal types via a unified discriminated union.
     ------------------------------------------------------------------------ */
  const {
    activeModal,
    closeModal,
    openTemplateManager,
    openDeleteCollection,
    openCreateItem,
    openEditItem,
    openDeleteItem,
  } = useModals();

  /* ------------------------------------------------------------------------
     3. EXPLORER TREE STATE
     Tracks search filtering, expansion tracking, and bulk toggle state.
     ------------------------------------------------------------------------ */
  const {
    searchQuery,
    setSearchQuery,
    expandedFolderIds,
    isAnyFolderExpanded,
    handleToggleAllFolders,
    handleToggleFolder,
  } = useExplorerFolders(allCollections);

  /* ------------------------------------------------------------------------
     4. GLOBAL UI & LAYOUT PREFERENCES
     Reads persistent user preferences from UIPreferencesContext.
     ------------------------------------------------------------------------ */
  const { isPinned, togglePin, isAudioEnabled } = useUIPreferences();

  /* ------------------------------------------------------------------------
     5. LOCAL VIEWPORT & INTERACTION STATES
     Governs side panel docking, widths, dropdowns, and watermark hover.
     ------------------------------------------------------------------------ */
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isLeftSidePanelOpen, setIsLeftSidePanelOpen] = useState<boolean>(false);
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(304);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(360);

  /* ------------------------------------------------------------------------
     6. GLOBAL KEYBOARD SHORTCUTS
     Handles global hotkeys (Esc dismissals, Ctrl+K / Cmd+K Explorer focus).
     ------------------------------------------------------------------------ */
  useKeyboardShortcuts([
    {
      key: 'Escape',
      allowInInputs: true,
      action: () => {
        // Dismiss active modal if one is currently mounted
        if (activeModal) {
          closeModal();
          return;
        }

        // If actively typing, blur the input without closing panels
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }

        // Dismiss floating flyout if unpinned
        if (isLeftSidePanelOpen && !isPinned) {
          setIsLeftSidePanelOpen(false);
          return;
        }

        // Dismiss open right utility drawer
        if (isRightPanelOpen) {
          setIsRightPanelOpen(false);
        }
      },
    },
    {
      key: 'k',
      ctrl: true,
      action: (e) => {
        e.preventDefault();

        // Reveal the unpinned flyout if closed
        if (!isPinned && !isLeftSidePanelOpen) {
          setIsLeftSidePanelOpen(true);
        }

        // Target the appropriate input variant based on pin docking state
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
     7. EVENT HANDLERS & DELEGATION
     Coordinates user interactions across navigation panels and modals.
     ------------------------------------------------------------------------ */
  const handleTogglePin = () => {
    togglePin();
    setIsLeftSidePanelOpen(true);
  };

  const handleTreeSelectItem = (item: ItemRecord, collectionId: number) => {
    selectItemWithChildren(item, collectionId);
    if (!isPinned) {
      setIsLeftSidePanelOpen(false);
    }
  };

  const handleTriggerEditItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    openEditItem(item, collectionId);
  };

  const handleTriggerDeleteItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    openDeleteItem(item, collectionId);
  };

  /* ------------------------------------------------------------------------
     8. MEMOIZED EXPLORER SUB-COMPONENTS
     Shared tree component used by both flyout and sidebar variants.
     ------------------------------------------------------------------------ */
  const explorerTreeElement = (
    <ExplorerContent
      unifiedForest={unifiedForest}
      searchQuery={searchQuery}
      activeCollectionId={activeCollectionId}
      selectedItemId={selectedItem?.id || null}
      expandedFolderIds={expandedFolderIds}
      onToggleFolder={handleToggleFolder}
      onSelectCollection={(colId) => {
        setActiveCollectionId(colId);
        if (!isPinned) setIsLeftSidePanelOpen(false);
      }}
      onSelectItem={handleTreeSelectItem}
      onAddSubItem={openCreateItem}
      onDeleteCollection={openDeleteCollection}
      onEditItem={handleTriggerEditItem}
      onDeleteItem={handleTriggerDeleteItem}
      onRenameCollection={renameCollection}
      onRenameItem={renameItem}
    />
  );

  // Unpinned floating flyout popover
  const explorerFlyoutPanel = (
    <LeftSidePanel
      variant="flyout"
      isOpen={isLeftSidePanelOpen}
      onClose={() => setIsLeftSidePanelOpen(false)}
      onTogglePin={handleTogglePin}
      isAnyFolderExpanded={isAnyFolderExpanded}
      onToggleAllFolders={handleToggleAllFolders}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      error={error}
    >
      {explorerTreeElement}
    </LeftSidePanel>
  );

  // Pinned desktop-docked split sidebar
  const explorerSidebarPanel = (
    <LeftSidePanel
      variant="sidebar"
      isOpen={isLeftSidePanelOpen}
      onClose={() => setIsLeftSidePanelOpen(false)}
      onTogglePin={handleTogglePin}
      isAnyFolderExpanded={isAnyFolderExpanded}
      onToggleAllFolders={handleToggleAllFolders}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      reservedWidth={isRightPanelOpen ? rightPanelWidth : 0}
      onWidthChange={setLeftPanelWidth}
      loading={loading}
      error={error}
    >
      {explorerTreeElement}
    </LeftSidePanel>
  );

  /* ------------------------------------------------------------------------
     9. VIEWPORT COMPOSITION & PRESENTATION SHELL
     ------------------------------------------------------------------------ */
  return (
    <div
      className={[
        'relative flex flex-col h-full w-full overflow-hidden',
        'bg-canvas text-content-primary studio-grid-canvas',
      ].join(' ')}
    >
      {/* Dynamic Watermark Background & Hover Video Trigger */}
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
              if (!isPinned) setIsLeftSidePanelOpen(false);
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
            isLeftSidePanelOpen={isLeftSidePanelOpen}
            onToggleLeftSidePanel={() => setIsLeftSidePanelOpen(!isLeftSidePanelOpen)}
            unpinnedExplorerPanel={explorerFlyoutPanel}
            onAddNewItem={() => {
              if (activeCollectionId) openCreateItem(activeCollectionId, null);
            }}
          />
        </div>

        {/* Tier 2: Center Workspace (Pinned Explorer, Canvas, and Right Panel) */}
        <div
          className={[
            'flex flex-1 min-h-0 relative overflow-hidden',
            'transition-opacity duration-500 ease-in-out',
            isLogoHovered ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
        >
          {/* Docked Explorer Sidebar */}
          {explorerSidebarPanel}

          {/* Center Main Stage / Detail Canvas */}
          <div className="w-full h-full flex-1 min-w-0 relative z-10">
            <MainContent
              selectedItem={selectedItem}
              activeCollectionId={activeCollectionId}
              isBlurred={!isPinned && isLeftSidePanelOpen}
              onAddSubItem={openCreateItem}
              onEditItem={handleTriggerEditItem}
              onDeleteItem={handleTriggerDeleteItem}
              rightPanelWidth={isRightPanelOpen ? rightPanelWidth : 0}
            />
          </div>

          {/* Docked Right Utility & Actions Panel */}
          <RightSidePanel
            isOpen={isRightPanelOpen}
            onOpen={() => setIsRightPanelOpen(true)}
            onClose={() => setIsRightPanelOpen(false)}
            reservedWidth={isPinned ? leftPanelWidth : 0}
            onWidthChange={setRightPanelWidth}
          />
        </div>

        {/* Tier 3: Bottom Navigation Footer & Status */}
        <div className="shrink-0 relative z-[60]">
          <NavigationFooter
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isRightPanelOpen={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          />
        </div>
      </div>

      {/* Modals & Dialog Portals */}
      <ModalContainers
        activeModal={activeModal}
        closeModal={closeModal}
        allItems={allItems}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        fetchAllData={fetchAllData}
      />
    </div>
  );
}