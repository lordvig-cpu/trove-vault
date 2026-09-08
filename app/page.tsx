'use client';

import { useEffect, useState, useRef } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
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

type ActiveModal =
  | { type: 'template_manager'; collectionId: number; collectionName: string }
  | { type: 'delete_collection'; collection: CollectionRecord }
  | { type: 'create_item'; collectionId: number; parentItemId?: number | null }
  | { type: 'edit_item'; item: ItemRecord; collectionId: number }
  | { type: 'delete_item'; item: ItemRecord; collectionId: number }
  | null;

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
  } = useCollections();

  // Layout & Dock States from Context
  const {
    isPinned,
    togglePin,
    animationsEnabled,
    isAudioEnabled,
  } = useUIPreferences();

  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isRightPinned, setIsRightPinned] = useState<boolean>(true);
  const [isLeftSidePanelOpen, setIsLeftSidePanelOpen] = useState<boolean>(false);
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(304);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(360);

  // Local Explorer Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track strictly which folders are currently expanded
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  // If even one folder is open, we show the Collapse All (-) button
  const isAnyFolderExpanded = expandedFolderIds.size > 0;

  const handleToggleAllFolders = () => {
    if (isAnyFolderExpanded) {
      // Collapse everything back to root
      setExpandedFolderIds(new Set());
    } else {
      // Expand everything
      const allIds = new Set(allCollections.map(c => c.id));
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
    if (isLogoHovered) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
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

  const handleAddSubItem = (collectionId: number, parentItemId: number | null = null) => {
    setActiveModal({ type: 'create_item', collectionId, parentItemId });
  };

  const handleTriggerEditItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setActiveModal({ type: 'edit_item', item, collectionId });
  };

  const handleTriggerDeleteItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setActiveModal({ type: 'delete_item', item, collectionId });
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
      onAddSubItem={handleAddSubItem}
      onDeleteCollection={(col: CollectionRecord) =>
        setActiveModal({ type: 'delete_collection', collection: col })
      }
      onEditItem={handleTriggerEditItem}
      onDeleteItem={handleTriggerDeleteItem}
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
    <div className={[
      // Layout & Dimensions
      'relative flex flex-col h-full w-full overflow-hidden',
      // Colors & Surface
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
      <div aria-hidden="true" className={[
        // Positioning & Layering
        'fixed inset-0 z-0',
        // Layout & Centering
        'flex items-center justify-center overflow-hidden',
        // Interaction
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
            onRequestDeleteCollection={(col) => setActiveModal({ type: 'delete_collection', collection: col })}
            onOpenTemplateManager={() => {
              if (activeCollection) {
                setActiveModal({
                  type: 'template_manager',
                  collectionId: activeCollection.id,
                  collectionName: activeCollection.name,
                });
              }
            }}
            isLeftSidePanelOpen={isLeftSidePanelOpen}
            onToggleLeftSidePanel={() => setIsLeftSidePanelOpen(!isLeftSidePanelOpen)}
            unpinnedExplorerPanel={explorerFlyoutPanel}
            onAddNewItem={() => {
              if (activeCollectionId) handleAddSubItem(activeCollectionId, null);
            }}
          />
        </div>

        {/* Center Workspace */}
        <div 
          className={[
            // Layout & Sizing
            'flex flex-1 min-h-0 relative overflow-hidden',
            // Transitions & Timing
            'transition-opacity duration-500 ease-in-out',
            // Dynamic State
            isLogoHovered ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
        >
          {/* ALWAYS render the sidebar, let CSS handle hiding it! */}
          {explorerSidebarPanel}

          {/* Modular Main Content Area (Fixed full canvas behind overlays) */}
          <div className="w-full h-full flex-1 min-w-0 relative z-10">
            <MainContent
              selectedItem={selectedItem}
              activeCollectionId={activeCollectionId}
              isBlurred={!isPinned && isLeftSidePanelOpen}
              onAddSubItem={handleAddSubItem}
              onEditItem={handleTriggerEditItem}
              onDeleteItem={handleTriggerDeleteItem}
              rightPanelWidth={isRightPanelOpen && isRightPinned ? rightPanelWidth : 0} // ONLY subtract width if it is pinned!
            />
          </div>

          <RightSidePanel
            isOpen={isRightPanelOpen}
            onOpen={() => setIsRightPanelOpen(true)}
            onClose={() => setIsRightPanelOpen(false)}
            isPinned={isRightPinned} // ADD THIS
            onTogglePin={() => setIsRightPinned(!isRightPinned)} // ADD THIS
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
          onClose={() => setActiveModal(null)}
          collectionId={activeModal.collectionId}
          collectionName={activeModal.collectionName}
          onTemplateApplied={() => fetchAllData()}
        />
      )}

      {activeModal?.type === 'delete_collection' && (
        <DeleteCollectionModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onCollectionDeleted={() => fetchAllData(null)}
          collection={activeModal.collection}
        />
      )}

      {activeModal?.type === 'create_item' && (
        <CreateItemModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
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
          onClose={() => setActiveModal(null)}
          onItemUpdated={() => fetchAllData(activeModal.collectionId)}
          item={activeModal.item}
        />
      )}

      {activeModal?.type === 'delete_item' && (
        <DeleteItemModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
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