'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import TreeNode, { ItemRecord } from '@/components/TreeNode';
import ItemDetailView from '@/components/ItemDetailView';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import { CollectionRecord } from '@/components/CollectionDropdown';

interface HierarchicalCollection extends CollectionRecord {
  items: ItemRecord[];
}

function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null): ItemRecord[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

function itemMatchesQuery(item: ItemRecord, query: string): boolean {
  if (!query) return true;
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

function filterHierarchy(nodes: ItemRecord[], query: string): ItemRecord[] {
  if (!query.trim()) return nodes;

  const filtered: ItemRecord[] = [];

  for (const node of nodes) {
    const matchingChildren = filterHierarchy(node.children || [], query);
    const selfMatches = itemMatchesQuery(node, query);

    if (selfMatches || matchingChildren.length > 0) {
      filtered.push({
        ...node,
        children: matchingChildren,
      });
    }
  }

  return filtered;
}

export default function Home() {
  const [allCollections, setAllCollections] = useState<CollectionRecord[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [currentCollection, setCurrentCollection] = useState<HierarchicalCollection | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Popovers & Modals
  const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch all collections and resolve the next valid active ID
  async function fetchCollectionsList(preferredId?: number | null) {
    try {
      setError(null);
      const { data, error: colListError } = await supabase
        .from('collections')
        .select('*')
        .order('id', { ascending: true });

      if (colListError) throw colListError;

      const collections = data || [];
      setAllCollections(collections);

      if (collections.length > 0) {
        // Check if preferredId or current activeCollectionId still exists in the database
        const targetId = preferredId !== undefined ? preferredId : activeCollectionId;
        const exists = collections.some((c) => c.id === targetId);
        
        // If it still exists, keep it; otherwise cleanly default to the first available collection
        const nextValidId = exists && targetId ? targetId : collections[0].id;
        
        setActiveCollectionId(nextValidId);
        fetchActiveCollectionData(nextValidId);
      } else {
        // No collections left in the database
        setActiveCollectionId(null);
        setCurrentCollection(null);
        setSelectedItem(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to load collections list:', err);
      setError(err?.message || 'Failed to load collections');
      setLoading(false);
    }
  }

  // Fetch items for the active collection
  async function fetchActiveCollectionData(collectionId: number, targetSelectId?: number | null) {
    try {
      setLoading(true);
      setError(null);

      const { data: collectionData, error: colError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .maybeSingle();

      if (colError) throw colError;

      if (!collectionData) {
        // Collection does not exist anymore
        setCurrentCollection(null);
        setSelectedItem(null);
        return;
      }

      const { data: rawItems, error: itError } = await supabase
        .from('items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('id', { ascending: true });

      if (itError) throw itError;

      const nestedItems = buildItemHierarchy(rawItems as ItemRecord[]);

      setCurrentCollection({
        ...collectionData,
        items: nestedItems,
      });

      const activeId = targetSelectId !== undefined ? targetSelectId : selectedItem?.id;
      if (activeId) {
        const found = (rawItems as ItemRecord[]).find((i) => i.id === activeId);
        if (found) {
          setSelectedItem({
            ...found,
            children: buildItemHierarchy(rawItems as ItemRecord[], found.id),
          });
        } else {
          setSelectedItem(nestedItems.length > 0 ? nestedItems[0] : null);
        }
      } else {
        setSelectedItem(nestedItems.length > 0 ? nestedItems[0] : null);
      }
    } catch (err: any) {
      console.error('Failed to load collection data:', err);
      setError(err?.message || 'Query error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollectionsList();
  }, []);

  const visibleItems = useMemo(() => {
    if (!currentCollection) return [];
    return filterHierarchy(currentCollection.items, searchQuery);
  }, [currentCollection, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCollectionName={currentCollection ? currentCollection.name : 'Select Collection'}
        collections={allCollections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={(newId) => {
          setActiveCollectionId(newId);
          fetchActiveCollectionData(newId);
        }}
        onCollectionsUpdated={() => fetchCollectionsList()}
        isDropdownOpen={isColDropdownOpen}
        setIsDropdownOpen={setIsColDropdownOpen}
        onRequestDeleteCollection={(col) => setCollectionToDelete(col)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Explorer
              </span>
              {currentCollection && (
                <button
                  onClick={() => {
                    setModalParentId(null);
                    setIsCreateOpen(true);
                  }}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  + New Item
                </button>
              )}
            </div>
            <h2 className="text-sm font-bold text-white mt-1">
              {currentCollection ? currentCollection.name : 'No Collection Selected'}
            </h2>
            {currentCollection?.description && (
              <p className="text-xs text-slate-400 mt-0.5">{currentCollection.description}</p>
            )}
          </div>

          {loading && (
            <div className="text-xs text-amber-400 p-3 bg-slate-900 border border-slate-800 rounded-lg animate-pulse">
              ⏳ Syncing hierarchy...
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-300 p-3 bg-rose-950/60 border border-rose-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Active Filter Indicator */}
          {searchQuery && (
            <div className="flex items-center justify-between text-xs bg-indigo-950/60 border border-indigo-800/70 rounded-xl px-3 py-2 text-indigo-200 shadow-sm shadow-indigo-950/50">
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-3.5 h-3.5 text-indigo-400 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.75 4.5a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.22.53l-5.78 5.78v6.19a.75.75 0 0 1-.3.6l-3 2.25a.75.75 0 0 1-1.2-.6v-8.44L3.97 7.28A.75.75 0 0 1 3.75 6.75V4.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate">
                  Filtering for: <strong className="text-white">"{searchQuery}"</strong>
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-medium text-indigo-400 hover:text-white shrink-0 ml-2 px-1.5 py-0.5 rounded hover:bg-indigo-900/60 transition"
              >
                Clear
              </button>
            </div>
          )}

          {currentCollection && visibleItems.length === 0 && !loading && (
            <div className="text-xs text-slate-500 text-center py-6">
              {searchQuery ? 'No items match your search.' : 'No items yet. Create your first item above!'}
            </div>
          )}

          {currentCollection && visibleItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {visibleItems.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  level={0}
                  selectedItemId={selectedItem?.id || null}
                  onSelectItem={(clickedItem) => setSelectedItem(clickedItem)}
                />
              ))}
            </div>
          )}
        </aside>

        {/* MAIN DETAIL PANEL */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
          <div className="max-w-4xl mx-auto">
            <ItemDetailView
              item={selectedItem}
              onAddSubItem={(parent) => {
                setModalParentId(parent.id);
                setIsCreateOpen(true);
              }}
              onEditItem={() => setIsEditOpen(true)}
              onDeleteItem={() => setIsDeleteOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        isOpen={Boolean(collectionToDelete)}
        onClose={() => setCollectionToDelete(null)}
        onCollectionDeleted={() => fetchCollectionsList(null)}
        collection={collectionToDelete}
      />

      {/* Creation Modal */}
      {currentCollection && (
        <CreateItemModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onItemCreated={() => fetchActiveCollectionData(currentCollection.id)}
          collectionId={currentCollection.id}
          availableParents={currentCollection.items || []}
          initialParentId={modalParentId}
        />
      )}

      {/* Edit Modal */}
      <EditItemModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onItemUpdated={() =>
          currentCollection && fetchActiveCollectionData(currentCollection.id, selectedItem?.id)
        }
        item={selectedItem}
      />

      {/* Delete Item Modal */}
      <DeleteItemModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onItemDeleted={() =>
          currentCollection && fetchActiveCollectionData(currentCollection.id, null)
        }
        item={selectedItem}
      />
    </div>
  );
}