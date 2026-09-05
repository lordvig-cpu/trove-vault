'use client';

import { useEffect, useState, useRef } from 'react';
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
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';

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
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    universalResults,
    unifiedForest,
    loading,
    error,
    fetchAllData,
  } = useCollections();

  // Layout & Dock States
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isLeftSidePanelOpen, setIsLeftSidePanelOpen] = useState<boolean>(false);
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
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
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    setIsLeftSidePanelOpen(true);
    localStorage.setItem('uc_leftsidepanel_pinned', JSON.stringify(nextPinned));
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
      searchScope={searchScope}
      searchQuery={searchQuery}
      universalResults={universalResults}
      unifiedForest={unifiedForest}
      activeCollectionId={activeCollectionId}
      activeCollectionName={activeCollection?.name}
      selectedItemId={selectedItem?.id || null}
      loading={loading}
      isPinned={isPinned}
      setIsLeftSidePanelOpen={setIsLeftSidePanelOpen}
      onSelectCollection={(colId) => {
        setActiveCollectionId(colId);
        if (!isPinned) setIsLeftSidePanelOpen(false);
      }}
      onSelectItem={handleTreeSelectItem}
      onAddSubItem={handleAddSubItem}
      onOpenFolderDropdown={() => setIsColDropdownOpen(true)}
      onRequestDeleteCollection={(col) =>
        setActiveModal({ type: 'delete_collection', collection: col })
      }
      onEditItem={handleTriggerEditItem}
      onDeleteItem={handleTriggerDeleteItem}
    />
  );

  return (
    <div className="h-full w-full bg-canvas text-content-primary flex flex-col overflow-hidden studio-grid-canvas relative">

      {/* 1. LOGO HOVER TRIGGER ZONE */}
      <div 
        className="absolute top-0 left-0 w-36 h-10 z-[100] cursor-pointer" 
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
        aria-hidden="true"
      />

      {/* 2. DYNAMIC BACKGROUND LAYER */}
      <div 
        className="pointer-events-none fixed inset-0 flex items-center justify-center select-none overflow-hidden z-0" 
        aria-hidden="true"
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchScope={searchScope}
            onSearchScopeChange={setSearchScope}
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
            isPinned={isPinned}
            onToggleLeftSidePanel={() => setIsLeftSidePanelOpen(!isLeftSidePanelOpen)}
            onTogglePin={handleTogglePin}
            explorerContent={explorerTreeElement}
            animationsEnabled={animationsEnabled}
          />
        </div>

        {/* Center Workspace */}
        <div 
          className={`flex-1 min-h-0 flex overflow-hidden relative transition-opacity duration-500 ease-in-out ${
            isLogoHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <LeftSidePanel
            isPinned={isPinned}
            onTogglePin={handleTogglePin}
            allCollectionsCount={allCollections.length}
            allItemsCount={allItems.length}
            activeCollectionId={activeCollectionId}
            onAddNewItem={() => {
              if (activeCollectionId) handleAddSubItem(activeCollectionId, null);
            }}
            loading={loading}
            error={error}
            animationsEnabled={animationsEnabled}
          >
            {explorerTreeElement}
          </LeftSidePanel>

          {/* Modular Main Content Area */}
          <MainContent
            selectedItem={selectedItem}
            activeCollectionId={activeCollectionId}
            isBlurred={!isPinned && isLeftSidePanelOpen}
            onAddSubItem={handleAddSubItem}
            onEditItem={handleTriggerEditItem}
            onDeleteItem={handleTriggerDeleteItem}
          />

          <RightSidePanel
            isOpen={isRightPanelOpen}
            onOpen={() => setIsRightPanelOpen(true)}
            onClose={() => setIsRightPanelOpen(false)}
            animationsEnabled={animationsEnabled}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="shrink-0 relative z-[60]">
          <NavigationFooter 
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isRightPanelOpen={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            animationsEnabled={animationsEnabled}
            setAnimationsEnabled={setAnimationsEnabled}
            isAudioEnabled={isAudioEnabled} 
            setIsAudioEnabled={setIsAudioEnabled}
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