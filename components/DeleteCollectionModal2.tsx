'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection2';
import { ItemRecord } from '@/types/item2';

interface DeleteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionDeleted: () => void;
  collection: CollectionRecord | null;
}

interface FlatSubItem {
  id: number;
  name: string;
  depth: number;
}

function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null): ItemRecord[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

export default function DeleteCollectionModal2({
  isOpen,
  onClose,
  onCollectionDeleted,
  collection,
}: DeleteCollectionModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cascadeList, setCascadeList] = useState<FlatSubItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollectionItems() {
      if (!collection || !isOpen) return;

      try {
        setLoadingItems(true);
        setError(null);

        const { data, error: fetchErr } = await supabase
          .from('items2')
          .select('*')
          .eq('collection_id', collection.id)
          .order('id', { ascending: true });

        if (fetchErr) throw fetchErr;

        const rawItems = (data || []) as ItemRecord[];
        const nestedTree = buildItemHierarchy(rawItems, null);

        const flattenTree = (nodes: ItemRecord[], depth = 1): FlatSubItem[] => {
          let list: FlatSubItem[] = [];
          for (const node of nodes) {
            list.push({ id: node.id, name: node.name, depth });
            if (node.children && node.children.length > 0) {
              list = list.concat(flattenTree(node.children, depth + 1));
            }
          }
          return list;
        };

        setCascadeList(flattenTree(nestedTree));
      } catch (err: any) {
        console.error('Error fetching collection items for delete:', err);
        setError('Could not calculate affected items');
      } finally {
        setLoadingItems(false);
      }
    }

    fetchCollectionItems();
  }, [collection, isOpen]);

  if (!isOpen || !collection) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('collections2')
        .delete()
        .eq('id', collection.id);

      if (deleteError) throw deleteError;

      onCollectionDeleted();
      onClose();
    } catch (err: any) {
      console.error('Delete collection error:', err);
      setError(err?.message || 'Failed to delete collection');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
            <span>⚠️</span>
            <span>Confirm Collection Deletion</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to delete the collection{' '}
            <strong className="text-white">"{collection.name}"</strong> (ID: #{collection.id})?
          </p>

          <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">Cascade Impact</span>
              <span className="text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded">
                {loadingItems ? 'Counting...' : `${cascadeList.length} item${cascadeList.length === 1 ? '' : 's'} affected`}
              </span>
            </div>

            <p className="text-xs text-rose-400/90 leading-relaxed">
              Deleting this collection will permanently drop all associated items and nested hierarchies:
            </p>

            {loadingItems ? (
              <div className="p-3 bg-slate-950/60 rounded-lg text-xs text-slate-500 italic text-center">
                Calculating items hierarchy...
              </div>
            ) : cascadeList.length > 0 ? (
              <div className="max-h-40 overflow-y-auto bg-slate-950/70 border border-rose-950 rounded-lg p-2.5 space-y-1.5 mt-2">
                {cascadeList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs font-mono text-slate-400"
                    style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}
                  >
                    <span className="truncate text-slate-300">
                      {item.depth > 1 ? '↳ ' : '• '}
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">ID: #{item.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 bg-slate-950/60 rounded-lg text-xs text-slate-400 italic text-center">
                This collection is currently empty.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 p-5 bg-slate-950/50 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || loadingItems}
            className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-md shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const DeleteCollectionModal = DeleteCollectionModal2;