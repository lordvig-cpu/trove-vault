'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';

/* ==========================================================================
   1. TYPE DEFINITIONS & PROPS
   ========================================================================== */

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

/* ==========================================================================
   2. HIERARCHY UTILITY
   ========================================================================== */

function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null): ItemRecord[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

/* ==========================================================================
   3. MAIN COMPONENT: DeleteCollectionModal
   Renders confirmation dialog and calculates cascade impact on nested records.
   ========================================================================== */

export default function DeleteCollectionModal({
  isOpen,
  onClose,
  onCollectionDeleted,
  collection,
}: DeleteCollectionModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cascadeList, setCascadeList] = useState<FlatSubItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------
     3.1 FETCH CASCADE IMPACT TREE
     ------------------------------------------------------------------------ */
  useEffect(() => {
    async function fetchCollectionItems() {
      if (!collection || !isOpen) return;

      try {
        setLoadingItems(true);
        setError(null);

        const { data, error: fetchErr } = await supabase
          .from('items')
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

  /* ------------------------------------------------------------------------
     3.2 MUTATION HANDLER
     ------------------------------------------------------------------------ */
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('collections')
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

  /* ------------------------------------------------------------------------
     3.3 COMPONENT RENDER
     ------------------------------------------------------------------------ */
  return (
    <div className="fixed inset-0 z-50 confirm-modal-backdrop flex items-center justify-center p-4">
      <div className="confirm-modal-dialog rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="confirm-modal-header p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 confirm-modal-danger-heading font-bold text-base">
            <span>⚠️</span>
            <span>Confirm Collection Deletion</span>
          </div>
          <button
            onClick={onClose}
            className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="confirm-modal-error p-3 text-xs rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm confirm-modal-item leading-relaxed">
            Are you sure you want to delete the collection{' '}
            <strong className="confirm-modal-item-name">"{collection.name}"</strong> (ID: #{collection.id})?
          </p>

          <div className="confirm-modal-danger-panel rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold confirm-modal-danger-heading">Cascade Impact</span>
              <span className="confirm-modal-count text-[10px] font-mono px-1.5 py-0.5 rounded">
                {loadingItems ? 'Counting...' : `${cascadeList.length} item${cascadeList.length === 1 ? '' : 's'} affected`}
              </span>
            </div>

            <p className="text-xs confirm-modal-danger-copy leading-relaxed">
              Deleting this collection will permanently drop all associated items and nested hierarchies:
            </p>

            {loadingItems ? (
              <div className="confirm-modal-loading p-3 rounded-lg text-xs italic text-center">
                Calculating items hierarchy...
              </div>
            ) : cascadeList.length > 0 ? (
              <div className="confirm-modal-list max-h-40 overflow-y-auto rounded-lg p-2.5 space-y-1.5 mt-2">
                {cascadeList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs font-mono confirm-modal-item"
                    style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}
                  >
                    <span className="truncate confirm-modal-item-name">
                      {item.depth > 1 ? '↳ ' : '• '}
                      {item.name}
                    </span>
                    <span className="text-[10px] confirm-modal-item-id shrink-0 ml-2">ID: #{item.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="confirm-modal-empty p-2 rounded-lg text-xs italic text-center">
                This collection is currently empty.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="confirm-modal-footer flex items-center justify-end gap-2 p-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || loadingItems}
            className="item-modal-danger-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}