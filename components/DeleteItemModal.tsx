'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ItemRecord } from '@/types/item';
import { errorMessage } from '@/lib/errors';

/* ==========================================================================
   1. TYPE DEFINITIONS & PROPS
   ========================================================================== */

interface DeleteItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemDeleted: () => void;
  item: ItemRecord | null;
}

interface FlatSubItem {
  id: number;
  name: string;
  depth: number;
}

/* ==========================================================================
   2. MAIN COMPONENT: DeleteItemModal
   Handles item deletion confirmation and cascades through nested sub-items.
   ========================================================================== */

export default function DeleteItemModal({
  isOpen,
  onClose,
  onItemDeleted,
  item,
}: DeleteItemModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // Recursively collect all nested sub-items with their depth level
  const getSubtreeList = (node: ItemRecord, depth = 1): FlatSubItem[] => {
    let list: FlatSubItem[] = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        list.push({ id: child.id, name: child.name, depth });
        list = list.concat(getSubtreeList(child, depth + 1));
      }
    }
    return list;
  };

  const cascadeItems = getSubtreeList(item);

  /* ------------------------------------------------------------------------
     2.1 MUTATION HANDLER
     ------------------------------------------------------------------------ */
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      onItemDeleted();
      onClose();
    } catch (err) {
      console.error('Delete error on items table:', err);
      setError(errorMessage(err, 'Failed to delete item'));
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------------------------------------------------
     2.2 COMPONENT RENDER
     ------------------------------------------------------------------------ */
  return (
    <div className="fixed inset-0 z-50 confirm-modal-backdrop flex items-center justify-center p-4">
      <div className="confirm-modal-dialog rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="confirm-modal-header p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 confirm-modal-danger-heading font-bold text-base">
            <span>⚠️</span>
            <span>Confirm Deletion</span>
          </div>
          <button
            onClick={onClose}
            className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="confirm-modal-error p-3 text-xs rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm confirm-modal-item leading-relaxed">
            Are you sure you want to delete <strong className="confirm-modal-item-name">&quot;{item.name}&quot;</strong> (ID: #{item.id})?
          </p>

          {cascadeItems.length > 0 && (
            <div className="confirm-modal-danger-panel rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold confirm-modal-danger-heading">Cascade Deletion Warning</span>
                <span className="confirm-modal-count text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {cascadeItems.length} sub-item{cascadeItems.length > 1 ? 's' : ''} affected
                </span>
              </div>
              <p className="text-xs confirm-modal-danger-copy leading-relaxed">
                Deleting this parent will permanently remove all connected child records:
              </p>

              {/* Scrollable Subtree Preview */}
              <div className="confirm-modal-list max-h-36 overflow-y-auto rounded-lg p-2.5 space-y-1.5 mt-2">
                {cascadeItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-xs font-mono confirm-modal-item"
                    style={{ paddingLeft: `${(sub.depth - 1) * 12}px` }}
                  >
                    <span className="truncate confirm-modal-item-name">
                      {'↳ '} {sub.name}
                    </span>
                    <span className="text-[10px] confirm-modal-item-id shrink-0 ml-2">ID: #{sub.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="confirm-modal-footer flex items-center justify-end gap-2 p-5">
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
            disabled={deleting}
            className="item-modal-danger-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Everything'}
          </button>
        </div>
      </div>
    </div>
  );
}