'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar, { SearchScope } from '@/components/Navbar';
import BottomBar from '@/components/BottomBar';
import Sidebar from '@/components/Sidebar';
import ItemDetailView from '@/components/ItemDetailView';
import RightSidePanel from '@/components/RightSidePanel';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import TemplateManagerModal from '@/components/TemplateManagerModal';
import ExplorerContent from '@/components/ExplorerContent';
import UnifiedExplorerTree from '@/components/UnifiedExplorerTree';
import { CollectionRecord } from '@/components/CollectionDropdown';
import { ItemRecord } from '@/components/TreeNode';
import { PinFilledIcon } from '@/components/icons/PinIcons';
import {
  itemMatchesQuery,
  buildItemHierarchy,
  buildFilteredUnifiedForest,
} from '@/lib/explorerUtils';

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
  const [allCollections, setAllCollections] = useState<CollectionRecord[]>([]);
  const [allItems, setAllItems] = useState<ItemRecord[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);

  // Pin & Drawer States
  const [isPinned, setIsPinned] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('uc_sidebar_pinned');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        setIsPinned(parsed);
      } catch {
        // Keep default
      }
    }
  }, []);

  const handleTogglePin = () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    setIsSidebarOpen(true);
    localStorage.setItem('uc_sidebar_pinned', JSON.stringify(nextPinned));
  };

  // Search state & scope
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('current');
  const [universalResults, setUniversalResults] = useState<UniversalSearchResultItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation & Consolidated Modal State
  const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  async function fetchAllData(preferredActiveCollectionId?: number | null) {
    try {
      setLoading(true);
      setError(null);

      const [colsRes, itemsRes] = await Promise.all([
        supabase.from('collections').select('*').order('id', { ascending: true }),
        supabase.from('items').select('*').order('id', { ascending: true }),
      ]);

      if (colsRes.error) throw colsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const collections = (colsRes.data as CollectionRecord[]) || [];
      const items = (itemsRes.data as ItemRecord[]) || [];

      setAllCollections(collections);
      setAllItems(items);

      if (collections.length > 0) {
        const targetId =
          preferredActiveCollectionId !== undefined
            ? preferredActiveCollectionId
            : activeCollectionId;
        const exists = collections.some((c) => c.id === targetId);
        const nextValidId = exists && targetId ? targetId : collections[0].id;

        setActiveCollectionId(nextValidId);

        if (selectedItem) {
          const found = items.find((i) => i.id === selectedItem.id);
          if (found) {
            setSelectedItem({
              ...found,
              children: buildItemHierarchy(items, found.id),
            });
          }
        }
      } else {
        setActiveCollectionId(null);
        setSelectedItem(null);
      }
    } catch (err: any) {
      console.error('Failed to load explorer data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchScope === 'all' && searchQuery.trim()) {
      const matches: UniversalSearchResultItem[] = allItems
        .filter((it) => itemMatchesQuery(it, searchQuery))
        .map((it) => ({
          ...it,
          collection_name:
            allCollections.find((c) => c.id === it.collection_id)?.name || 'Collection',
        }));
      setUniversalResults(matches);
    } else {
      setUniversalResults([]);
    }
  }, [searchQuery, searchScope, allItems, allCollections]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const unifiedForest = useMemo(() => {
    return buildFilteredUnifiedForest(
      allCollections,
      allItems,
      null,
      activeCollectionId,
      searchQuery,
      searchScope
    );
  }, [allCollections, allItems, activeCollectionId, searchQuery, searchScope]);

  const activeCollection = allCollections.find((c) => c.id === activeCollectionId) || null;

  const handleTreeSelectItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setSelectedItem({
      ...item,
      children: buildItemHierarchy(allItems, item.id),
    });
    if (!isPinned) {
      setIsSidebarOpen(false);
    }
  };

  const handleAddSubItem = (collectionId: number, parentItemId: number | null = null) => {
    setActiveModal({
      type: 'create_item',
      collectionId,
      parentItemId,
    });
  };

  const handleTriggerEditItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setActiveModal({
      type: 'edit_item',
      item,
      collectionId,
    });
  };

  const handleTriggerDeleteItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setActiveModal({
      type: 'delete_item',
      item,
      collectionId,
    });
  };

    // Reusable Explorer Tree Instance
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
    <div className="h-screen max-h-screen w-screen bg-canvas text-content-primary flex flex-col overflow-hidden studio-grid-canvas relative">
      
      {/* 200% Scaled Watermark Behind UI */}
      <div 
        className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 select-none overflow-hidden"
        aria-hidden="true"
      >
        <img 
          src="/images/web_background_trove_vault_logo.png" 
          alt="" 
          className="w-[1250px] max-w-none object-contain filter brightness-60 drop-shadow-2xl opacity-25"
        />
      </div>

      {/* LOCKED TOP NAVBAR */}
      <div className="shrink-0 relative z-20">
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
        />
      </div>

      {/* INDEPENDENTLY SCROLLING MID-SECTION */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative z-10">
        
        {/* PINNED PERSISTENT SIDEBAR */}
        <Sidebar
          isPinned={isPinned}
          onTogglePin={handleTogglePin}
          allCollectionsCount={allCollections.length}
          allItemsCount={allItems.length}
          activeCollectionId={activeCollectionId}
          onAddNewItem={() => {
            if (activeCollectionId) {
              handleAddSubItem(activeCollectionId, null);
            }
          }}
          loading={loading}
          error={error}
        >
          {explorerTreeElement}
        </Sidebar>

        {/* MAIN CANVAS DETAIL VIEW */}
        <main
          className={`flex-1 min-h-0 overflow-y-auto p-6 transition-all duration-300 ease-in-out relative z-10 ${
            !isPinned && isSidebarOpen
              ? 'filter blur-[3.5px] brightness-[0.60] pointer-events-none select-none'
              : 'filter-none brightness-100'
          }`}
        >
          <div className="max-w-5xl mx-auto">
            <ItemDetailView
              item={selectedItem}
              onAddSubItem={(parent) => {
                if (activeCollectionId) {
                  handleAddSubItem(activeCollectionId, parent.id);
                }
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
          </div>
        </main>

        {/* RIGHT DOCKED PANEL */}
        <RightSidePanel
          isOpen={isRightPanelOpen}
          onOpen={() => setIsRightPanelOpen(true)}
          onClose={() => setIsRightPanelOpen(false)}
        />
      </div>

      {/* LOCKED BOTTOM BAR */}
      <BottomBar 
        activeCollectionName={activeCollection?.name}
        totalItemsCount={allItems.length}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
      />

      {/* MODAL HOSTS */}
      {/* ... activeModal checks ... */}
    </div>
  );

}