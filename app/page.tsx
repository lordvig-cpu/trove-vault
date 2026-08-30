'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import BottomBar from '@/components/BottomBar';
import ItemDetailView from '@/components/ItemDetailView';
import RightSidePanel from '@/components/RightSidePanel';
import Sidebar from '@/components/Sidebar';
import ExplorerContent from '@/components/ExplorerContent';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import TemplateManagerModal from '@/components/TemplateManagerModal';
import { CollectionRecord } from '@/components/CollectionDropdown';
import { ItemRecord } from '@/components/TreeNode';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Video reference for smooth playback & rewinding
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isLogoHovered) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Fallback if browser autoplay policies interfere
        });
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
    setIsSidebarOpen(true);
    localStorage.setItem('uc_sidebar_pinned', JSON.stringify(nextPinned));
  };

  const handleTreeSelectItem = (item: ItemRecord, collectionId: number) => {
    selectItemWithChildren(item, collectionId);
    if (!isPinned) {
      setIsSidebarOpen(false);
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
      setIsSidebarOpen={setIsSidebarOpen}
      onSelectCollection={(colId) => {
        setActiveCollectionId(colId);
        if (!isPinned) setIsSidebarOpen(false);
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

      {/* 1. INVISIBLE LOGO HOVER TRIGGER ZONE (Top Left) */}
      <div 
        className="absolute top-0 left-0 w-36 h-10 z-[100] cursor-pointer" 
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
        aria-hidden="true"
      />

      {/* 2. DYNAMIC BACKGROUND LAYER (Fixed Image + Hover Video) */}
      <div 
        className="pointer-events-none fixed inset-0 flex items-center justify-center select-none overflow-hidden z-0" 
        aria-hidden="true"
      >
        {/* Fixed Watermark Image */}
        <img 
          src="/images/web_background_trove_vault_logo.png" 
          alt="" 
          className={`w-[1250px] max-w-none h-auto object-contain drop-shadow-2xl transition-all duration-700 ease-out ${
            isLogoHovered ? 'opacity-0 scale-105' : 'opacity-25 filter brightness-60 scale-100'
          }`} 
        />

        {/* Full-Height Hover Video Animation */}
        <video
          ref={videoRef}
          src="/videos/old_web_logo_animation.mp4"
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-contain drop-shadow-2xl transition-all duration-700 ease-in-out ${
            isLogoHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      </div>

      {/* 3. MAIN APPLICATION UI WRAPPER */}
      <div className="flex flex-col h-full w-full">

        {/* Top Navbar (Always Visible) */}
        <div className="shrink-0 relative z-40">
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchScope={searchScope}
            onSearchScopeChange={setSearchScope}
            activeCollectionName={activeCollection ? activeCollection.name : 'Select Collection'}
            collections={allCollections}
            activeCollectionId={activeCollectionId}
            onSelectCollection={(newId) => {
              setActiveCollectionId(newId);
              if (!isPinned) setIsSidebarOpen(false);
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
            isSidebarOpen={isSidebarOpen}
            isPinned={isPinned}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onTogglePin={handleTogglePin}
            explorerContent={explorerTreeElement}
            animationsEnabled={animationsEnabled}
          />
        </div>

        {/* Mid-Section (Fades out when logo is hovered, revealing the background video) */}
        <div 
          className={`flex-1 min-h-0 flex overflow-hidden relative z-10 transition-opacity duration-500 ease-in-out ${
            isLogoHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Sidebar
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
          </Sidebar>

          {/* WORKSPACE COLUMN WRAPPER */}
          <div className="flex-1 min-h-0 relative flex flex-col z-10">
            
            {/* Main Content */}
            <main
              className={`flex-1 flex flex-col min-h-0 overflow-y-auto relative main_content_scroll transition-all duration-300 ease-in-out ${
                !isPinned && isSidebarOpen
                  ? 'filter blur-[3.5px] brightness-[0.60] pointer-events-none select-none'
                  : 'filter-none brightness-100'
              }`}
            >
              {/* Sticky Upper Shadow (only active if an item is selected) */}
              {selectedItem && (
                <div className="sticky top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/85 to-transparent z-30 pointer-events-none shrink-0 -mb-10" aria-hidden="true" />
              )}

              {/* Main Content Area */}
              <div className="max-w-5xl mx-auto p-6 w-full flex-1 pt-10 pb-10">
                {selectedItem ? (
                  <ItemDetailView
                    item={selectedItem}
                    onAddSubItem={(parent) => {
                      if (activeCollectionId) handleAddSubItem(activeCollectionId, parent.id);
                    }}
                    onEditItem={() => {
                      if (selectedItem && activeCollectionId) {
                        handleTriggerEditItem(selectedItem, activeCollectionId);
                      }
                    }}
                    onDeleteItem={() => {
                      if (selectedItem && activeCollectionId) {
                        handleTriggerDeleteItem(selectedItem, activeCollectionId);
                      }
                    }}
                  />
                ) : null}
              </div>

              {/* Sticky Lower Shadow (only active if an item is selected) */}
              {selectedItem && (
                <div className="sticky bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/85 to-transparent z-30 pointer-events-none shrink-0 -mt-10" aria-hidden="true" />
              )}
            </main>
          </div>

          <RightSidePanel
            isOpen={isRightPanelOpen}
            onOpen={() => setIsRightPanelOpen(true)}
            onClose={() => setIsRightPanelOpen(false)}
            animationsEnabled={animationsEnabled}
          />
        </div>

        {/* LOCKED BOTTOM BAR (Always Visible) */}
        <div className="shrink-0 relative z-40">
          <BottomBar 
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isRightPanelOpen={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            animationsEnabled={animationsEnabled}
            setAnimationsEnabled={setAnimationsEnabled}
          />
        </div>
      </div>
        
      {/* Modal Container */}
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