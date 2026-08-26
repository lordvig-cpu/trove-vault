'use client';

import { useEffect, useState } from 'react';
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

export default function Home() {
  const [collection, setCollection] = useState<HierarchicalCollection | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
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

      // Maintain selection or select first available item
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

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

          {collection && (
            <div className="flex flex-col gap-1.5">
              {collection.items.map((item) => (
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