'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import TreeNode, { ItemRecord } from '@/components/TreeNode';
import ItemDetailView from '@/components/ItemDetailView';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';

interface CollectionRecord {
  id: number;
  name: string;
  description: string | null;
  sys_created_at?: string;
  created_at?: string;
}

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

// Check if an item matches by name or JSONB attribute values
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

// Filter tree preserving parent paths if a child matches
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
  const [collection, setCollection] = useState<HierarchicalCollection | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function fetchCollectionData(targetSelectId?: number | null) {
    try {
      setLoading(true);

      const { data: collectionData, error: colError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 1)
        .single();

      if (colError) throw colError;

      const { data: rawItems, error: itError } = await supabase
        .from('items')
        .select('*')
        .eq('collection_id', 1)
        .order('id', { ascending: true });

      if (itError) throw itError;

      const nestedItems = buildItemHierarchy(rawItems as ItemRecord[]);

      setCollection({
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
      console.error('Failed to load collection:', err);
      setError(err?.message || 'Query error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollectionData();
  }, []);

  // Filtered hierarchy based on active search
  const visibleItems = useMemo(() => {
    if (!collection) return [];
    return filterHierarchy(collection.items, searchQuery);
  }, [collection, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Explorer
              </span>
              <button
                onClick={() => {
                  setModalParentId(null);
                  setIsCreateOpen(true);
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                + New Item
              </button>
            </div>
            <h2 className="text-sm font-bold text-white mt-1">
              {collection ? collection.name : 'Loading...'}
            </h2>
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

          {/* Active Filter Indicator Badge */}
          {searchQuery && (
            <div className="flex items-center justify-between text-xs bg-indigo-950/60 border border-indigo-800/70 rounded-xl px-3 py-2 text-indigo-200 shadow-sm shadow-indigo-950/50">
              <div className="flex items-center gap-2 min-w-0">
                {/* Funnel Filter SVG */}
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

          {collection && visibleItems.length === 0 && !loading && (
            <div className="text-xs text-slate-500 text-center py-6">
              No items match your search.
            </div>
          )}

          {collection && visibleItems.length > 0 && (
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

      {/* Creation Modal */}
      <CreateItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onItemCreated={() => fetchCollectionData()}
        collectionId={1}
        availableParents={collection?.items || []}
        initialParentId={modalParentId}
      />

      {/* Edit Modal */}
      <EditItemModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onItemUpdated={() => fetchCollectionData(selectedItem?.id)}
        item={selectedItem}
      />

      {/* Delete Modal */}
      <DeleteItemModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onItemDeleted={() => fetchCollectionData(null)}
        item={selectedItem}
      />
    </div>
  );
}