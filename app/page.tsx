'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar, { SearchScope } from '@/components/Navbar';
import BottomBar from '@/components/BottomBar';
import ItemDetailView from '@/components/ItemDetailView';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import TemplateManagerModal from '@/components/TemplateManagerModal';
import UnifiedExplorerTree, { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree';
import { CollectionRecord } from '@/components/CollectionDropdown';
import { ItemRecord } from '@/components/TreeNode';
import { PinFilledIcon } from '@/components/icons/PinIcons';

export interface UniversalSearchResultItem extends ItemRecord {
  collection_name?: string;
}

function itemMatchesQuery(item: ItemRecord, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();

  if (item.name.toLowerCase().includes(q)) return true;

  if (item.attributes) {
    for (const [key, value] of Object.entries(item.attributes)) {
      if (key.toLowerCase().includes(q)) return true;
      if (String(value).toLowerCase().includes(q)) return true;
    }
  }

  return false;
}

function filterItemHierarchy(items: ItemRecord[], query: string): ItemRecord[] {
  if (!query.trim()) return items;

  const result: ItemRecord[] = [];

  for (const item of items) {
    const matchingChildren = filterItemHierarchy(item.children || [], query);
    const selfMatches = itemMatchesQuery(item, query);

    if (selfMatches || matchingChildren.length > 0) {
      result.push({
        ...item,
        children: matchingChildren,
      });
    }
  }

  return result;
}

function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null): ItemRecord[] {
  return items
    .filter((item) => (item.parent_id || null) === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

function buildFilteredUnifiedForest(
  collections: CollectionRecord[],
  allItems: ItemRecord[],
  parentCollectionId: number | null = null,
  activeCollectionId: number | null = null,
  searchQuery: string = '',
  searchScope: SearchScope = 'current'
): UnifiedCollectionNode[] {
  const isSearchingCurrent = searchScope === 'current' && searchQuery.trim() !== '';

  return collections
    .filter((col) => (col.parent_id || null) === parentCollectionId)
    .map((col) => {
      const collectionRawItems = allItems.filter((it) => it.collection_id === col.id);
      const fullItemTree = buildItemHierarchy(collectionRawItems, null);

      const childSubCols = buildFilteredUnifiedForest(
        collections,
        allItems,
        col.id,
        activeCollectionId,
        searchQuery,
        searchScope
      );

      let filteredItems = fullItemTree;
      if (isSearchingCurrent) {
        if (col.id === activeCollectionId || isDescendantOf(collections, col.id, activeCollectionId)) {
          filteredItems = filterItemHierarchy(fullItemTree, searchQuery);
        } else {
          filteredItems = [];
        }
      }

      return {
        ...col,
        items: filteredItems,
        subCollections: childSubCols,
      };
    })
    .filter((colNode) => {
      if (isSearchingCurrent) {
        const belongsToActiveBranch =
          colNode.id === activeCollectionId ||
          isDescendantOf(collections, colNode.id, activeCollectionId) ||
          isAncestorOf(collections, colNode.id, activeCollectionId);

        if (!belongsToActiveBranch) return false;

        const hasMatches =
          colNode.items.length > 0 || colNode.subCollections.length > 0;
        return hasMatches || colNode.id === activeCollectionId;
      }
      return true;
    });
}

function isDescendantOf(
  collections: CollectionRecord[],
  candidateId: number,
  ancestorId: number | null
): boolean {
  if (!ancestorId) return false;
  const current = collections.find((c) => c.id === candidateId);
  if (!current || !current.parent_id) return false;
  if (current.parent_id === ancestorId) return true;
  return isDescendantOf(collections, current.parent_id, ancestorId);
}

function isAncestorOf(
  collections: CollectionRecord[],
  candidateId: number,
  descendantId: number | null
): boolean {
  if (!descendantId) return false;
  return isDescendantOf(collections, descendantId, candidateId);
}

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

  // Modals & Popovers
  const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetCollectionIdForCreate, setTargetCollectionIdForCreate] = useState<number | null>(null);
  const [modalParentItemId, setModalParentItemId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ItemRecord | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemRecord | null>(null);

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
    setTargetCollectionIdForCreate(collectionId);
    setModalParentItemId(parentItemId);
    setIsCreateOpen(true);
  };

  const handleTriggerEditItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setItemToEdit(item);
    setIsEditOpen(true);
  };

  const handleTriggerDeleteItem = (item: ItemRecord, collectionId: number) => {
    setActiveCollectionId(collectionId);
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const renderExplorerTree = () => (
    <div className="min-w-fit">
      {searchScope === 'all' && searchQuery ? (
        <div className="space-y-1.5">
          {universalResults.length === 0 ? (
            <div className="text-xs text-content-muted text-center py-6">
              No matches found across any collection.
            </div>
          ) : (
            universalResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleTreeSelectItem(item, item.collection_id)}
                className={`p-2 rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                  selectedItem?.id === item.id
                    ? 'bg-accent-primary/20 border-accent-primary shadow-md'
                    : 'bg-surface border-border-subtle hover:border-border-strong'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-content-primary whitespace-nowrap">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-accent-secondary shrink-0">
                    #{item.id}
                  </span>
                </div>
                <span className="text-[10px] text-content-muted truncate">
                  🗂️ {item.collection_name}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-0.5">
          {unifiedForest.length === 0 && !loading ? (
            <div className="text-xs text-content-muted text-center py-6">
              {searchQuery
                ? `No matches in ${activeCollection?.name || 'this folder'}.`
                : 'No collections created yet.'}
            </div>
          ) : (
            unifiedForest.map((colNode) => (
              <UnifiedExplorerTree
                key={`root-col-${colNode.id}`}
                collection={colNode}
                activeCollectionId={activeCollectionId}
                selectedItemId={selectedItem?.id || null}
                onSelectCollection={(colId) => {
                  setActiveCollectionId(colId);
                  if (!isPinned) setIsSidebarOpen(false);
                }}
                onSelectItem={handleTreeSelectItem}
                onAddSubCollection={() => setIsColDropdownOpen(true)}
                onAddSubItem={handleAddSubItem}
                onEditCollection={() => setIsColDropdownOpen(true)}
                onDeleteCollection={(col) => setCollectionToDelete(col)}
                onEditItem={handleTriggerEditItem}
                onDeleteItem={handleTriggerDeleteItem}
              />
            ))
          )}
        </div>
      )}
    </div>
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
          onRequestDeleteCollection={(col) => setCollectionToDelete(col)}
          onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
          isSidebarOpen={isSidebarOpen}
          isPinned={isPinned}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onTogglePin={handleTogglePin}
          explorerContent={renderExplorerTree()}
        />
      </div>

      {/* INDEPENDENTLY SCROLLING MID-SECTION */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative z-10">
        
        {/* PINNED PERSISTENT SIDEBAR */}
        {/* PINNED SIDEBAR - Fixed width, no horizontal scrolling */}
        <aside
          className={`h-full border-border-subtle bg-surface/90 backdrop-blur-md flex flex-col gap-2.5 overflow-x-hidden overflow-y-auto shrink-0 transition-all duration-300 ease-in-out ${
            isPinned
              ? 'w-84 max-w-84 border-r p-3 opacity-100'
              : 'w-0 border-r-0 p-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-2 shrink-0">
            <div>
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
                Explorer
              </span>
              <span className="text-[10px] text-content-muted font-mono">
                {allCollections.length} Folders • {allItems.length} Items
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {activeCollectionId && (
                <button
                  onClick={() => handleAddSubItem(activeCollectionId, null)}
                  className="text-[11px] font-semibold text-accent-secondary hover:text-accent-primary shrink-0 cursor-pointer"
                >
                  + New Item
                </button>
              )}
              <button
                type="button"
                onClick={handleTogglePin}
                className="group p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-hover transition cursor-pointer"
                title="Unpin Sidebar"
              >
                <PinFilledIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-xs text-amber-400 p-2.5 bg-surface border border-border-subtle rounded-lg animate-pulse shrink-0">
              ⏳ Syncing hierarchy...
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-300 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg shrink-0">
              {error}
            </div>
          )}

          <div className="flex-1 pb-4 min-w-0">
            {renderExplorerTree()}
          </div>
        </aside>

        {/* MAIN CANVAS DETAIL VIEW (Only this panel scrolls vertically) */}
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

        {/* FLOATING EXPAND TAB ON RIGHT EDGE (When Closed) */}
        {!isRightPanelOpen && (
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute right-0 top-2.5 z-30 h-7 px-2 rounded-l-md bg-surface/90 hover:bg-surface-hover border-y border-l border-border-subtle hover:border-border-strong text-content-muted hover:text-accent-secondary shadow-lg backdrop-blur-md transition-all cursor-pointer flex items-center justify-center group"
            title="Open Side Panel"
          >
            <svg 
              className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* RIGHT DOCKED PANEL */}
        <aside
          className={`h-full border-border-subtle bg-surface/90 backdrop-blur-md flex flex-col overflow-x-hidden overflow-y-auto shrink-0 transition-all duration-300 ease-in-out z-20 relative ${
            isRightPanelOpen
              ? 'w-84 max-w-84 border-l p-3 opacity-100'
              : 'w-0 border-l-0 p-0 opacity-0 pointer-events-none'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-border-subtle pb-2.5 shrink-0 pr-8">
            <div>
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
                Side Panel
              </span>
              <span className="text-[10px] text-content-muted font-mono">
                Utility & Actions
              </span>
            </div>
          </div>

          {/* Collapse Button (Pinned to top-2.5 right-2.5 for exact height parity) */}
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(false)}
            className="absolute top-2.5 right-2.5 z-30 h-7 w-7 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-hover border border-transparent hover:border-border-subtle transition cursor-pointer flex items-center justify-center group"
            title="Collapse Panel"
          >
            <svg 
              className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Panel Scrollable Content Body */}
          <div className="flex-1 py-3 text-xs text-content-muted">
            <div className="border border-dashed border-border-subtle/80 rounded-xl p-4 text-center">
              Panel ready for activity logs, quick attributes, or history.
            </div>
          </div>
        </aside>

        
      </div>

      {/* LOCKED BOTTOM BAR */}
      <BottomBar 
        activeCollectionName={activeCollection?.name}
        totalItemsCount={allItems.length}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
      />

      {activeCollection && (
        <TemplateManagerModal
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          collectionId={activeCollection.id}
          collectionName={activeCollection.name}
          onTemplateApplied={() => fetchAllData()}
        />
      )}

      <DeleteCollectionModal
        isOpen={Boolean(collectionToDelete)}
        onClose={() => setCollectionToDelete(null)}
        onCollectionDeleted={() => fetchAllData(null)}
        collection={collectionToDelete}
      />

      {targetCollectionIdForCreate && (
        <CreateItemModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setTargetCollectionIdForCreate(null);
          }}
          onItemCreated={() => fetchAllData(targetCollectionIdForCreate)}
          collectionId={targetCollectionIdForCreate}
          availableParents={allItems.filter(
            (i) => i.collection_id === targetCollectionIdForCreate
          )}
          initialParentId={modalParentItemId}
        />
      )}

      <EditItemModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setItemToEdit(null);
        }}
        onItemUpdated={() => fetchAllData(activeCollectionId)}
        item={itemToEdit || selectedItem}
      />

      <DeleteItemModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onItemDeleted={() => {
          if (itemToDelete?.id === selectedItem?.id) {
            setSelectedItem(null);
          }
          fetchAllData(activeCollectionId);
        }}
        item={itemToDelete || selectedItem}
      />
    </div>
  );

}