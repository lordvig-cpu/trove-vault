'use client';

import { useEffect, useState, useRef } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import NavigationHeader from '@/components/NavigationHeader';
import NavigationFooter from '@/components/NavigationFooter';
import MainContent from '@/components/MainContent';
import RightSidePanel from '@/components/RightSidePanel';
import LeftSidePanel from '@/components/LeftSidePanel';
import ExplorerContent from '@/components/ExplorerContent';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import TemplateManagerModal from '@/components/TemplateManagerModal';

export interface UniversalSearchResultItem extends ItemRecord {
  collection_name?: string;
}

export default function Home() {
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

  const {
    activeModal,
    closeModal,
    openTemplateManager,
    openDeleteCollection,
    openCreateItem,
    openEditItem,
    openDeleteItem,
  } = useModals();

  // Layout & Dock States from Context
  const {
    isPinned,
    togglePin,
    animationsEnabled,
    isAudioEnabled,
  } = useUIPreferences();

  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isLeftSidePanelOpen, setIsLeftSidePanelOpen] = useState<boolean>(false);
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(304);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(360);

  // Local Explorer Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track strictly which folders are currently expanded
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  const isAnyFolderExpanded = expandedFolderIds.size > 0;

  // KEYBOARD SHORTCUTS
  useKeyboardShortcuts([
    {
      key: 'Escape',
      allowInInputs: true,
      action: () => {
        // 1. Dismiss active modal dialog
        if (activeModal) {
          closeModal();
          return;
        }

        // 2. If focus is inside an input (e.g., search), blur it
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }

        // 3. Dismiss floating unpinned Explorer flyout
        if (isLeftSidePanelOpen && !isPinned) {
          setIsLeftSidePanelOpen(false);
          return;
        }

        // 4. Dismiss open right side panel
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

        // 1. Reveal flyout if unpinned and closed
        if (!isPinned && !isLeftSidePanelOpen) {
          setIsLeftSidePanelOpen(true);
        }

        // 2. Target the specific variant's input
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

  const handleToggleAllFolders = () => {
    if (isAnyFolderExpanded) {
      setExpandedFolderIds(new Set());
    } else {
      const allIds = new Set(allCollections.map((c) => c.id));
      setExpandedFolderIds(allIds);
    }
  };

  const handleToggleFolder = (folderId: number, expand: boolean) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (expand) next.add(folderId);
      else next.delete(folderId);
      return next;
    });
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isSubscribed = true;

    if (isLogoHovered) {
      try {
        video.currentTime = 0;
      } catch {}

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Gracefully handle aborts if hover exited rapidly
          if (err.name !== 'AbortError') {
            console.warn('Playback error:', err);
          }
        });
      }
    } else {
      // Pause cleanly
      video.pause();
    }

    return () => {
      isSubscribed = false;
    };
  }, [isLogoHovered]);

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

  return (
    <div
      className={[
        'relative flex flex-col h-full w-full overflow-hidden',
        'bg-canvas text-content-primary studio-grid-canvas',
      ].join(' ')}
    >
      {/* 1. LOGO HOVER TRIGGER ZONE */}
      <div
        className="absolute top-0 left-0 w-36 h-10 z-[100] cursor-pointer"
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
        aria-hidden="true"
      />

      {/* 2. DYNAMIC BACKGROUND LAYER */}
      <div
        aria-hidden="true"
        className={[
          'fixed inset-0 z-0',
          'flex items-center justify-center overflow-hidden',
          'pointer-events-none select-none',
        ].join(' ')}
      >
        <img
          src="/images/web_background_trove_vault_logo.png"
          alt=""
          className={`watermark-logo-image ${isLogoHovered ? 'watermark-logo-image-hidden' : ''}`}
        />

        <video
          ref={videoRef}
          src="/videos/website_intro_video.mp4"
          preload="auto"
          muted={!isAudioEnabled}
          playsInline
          className={`watermark-video-player ${isLogoHovered ? 'watermark-video-active' : 'watermark-video-inactive'}`}
        />
      </div>

      {/* 3. APPLICATION SHELL */}
      <div className="flex flex-col h-full w-full">
        {/* Top Navigation */}
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

        {/* Center Workspace */}
        <div
          className={[
            'flex flex-1 min-h-0 relative overflow-hidden',
            'transition-opacity duration-500 ease-in-out',
            isLogoHovered ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
        >
          {explorerSidebarPanel}

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

          <RightSidePanel
            isOpen={isRightPanelOpen}
            onOpen={() => setIsRightPanelOpen(true)}
            onClose={() => setIsRightPanelOpen(false)}
            reservedWidth={isPinned ? leftPanelWidth : 0}
            onWidthChange={setRightPanelWidth}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="shrink-0 relative z-[60]">
          <NavigationFooter
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isRightPanelOpen={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          />
        </div>
      </div>

      {/* Modals Container */}
      {activeModal?.type === 'template_manager' && (
        <TemplateManagerModal
          isOpen={true}
          onClose={closeModal}
          collectionId={activeModal.collectionId}
          collectionName={activeModal.collectionName}
          onTemplateApplied={() => fetchAllData()}
        />
      )}

      {activeModal?.type === 'delete_collection' && (
        <DeleteCollectionModal
          isOpen={true}
          onClose={closeModal}
          onCollectionDeleted={() => fetchAllData(null)}
          collection={activeModal.collection}
        />
      )}

      {activeModal?.type === 'create_item' && (
        <CreateItemModal
          isOpen={true}
          onClose={closeModal}
          onItemCreated={() => fetchAllData(activeModal.collectionId)}
          collectionId={activeModal.collectionId}
          availableParents={allItems.filter(
            (i) => i.collection_id === activeModal.collectionId
          )}
          initialParentId={activeModal.parentItemId || null}
        />
      )}

      {activeModal?.type === 'edit_item' && (
        <EditItemModal
          isOpen={true}
          onClose={closeModal}
          onItemUpdated={() => fetchAllData(activeModal.collectionId)}
          item={activeModal.item}
        />
      )}

      {activeModal?.type === 'delete_item' && (
        <DeleteItemModal
          isOpen={true}
          onClose={closeModal}
          onItemDeleted={() => {
            if (activeModal.item.id === selectedItem?.id) {
              setSelectedItem(null);
            }
            fetchAllData(activeModal.collectionId);
          }}
          item={activeModal.item}
        />
      )}
    </div>
  );
}