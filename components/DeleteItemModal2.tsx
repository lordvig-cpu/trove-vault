'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ItemRecord } from '@/types/item2';

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

export default function DeleteItemModal2({
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

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('items2')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      onItemDeleted();
      onClose();
    } catch (err: any) {
      console.error('Delete error on items2:', err);
      setError(err?.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
            <span>⚠️</span>
            <span>Confirm Deletion</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to delete <strong className="text-white">"{item.name}"</strong> (ID: #{item.id})?
          </p>

          {cascadeItems.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-300">Cascade Deletion Warning</span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded">
                  {cascadeItems.length} sub-item{cascadeItems.length > 1 ? 's' : ''} affected
                </span>
              </div>
              <p className="text-xs text-rose-400/90 leading-relaxed">
                Deleting this parent will permanently remove all connected child records:
              </p>

              {/* Scrollable Subtree Preview */}
              <div className="max-h-36 overflow-y-auto bg-slate-950/70 border border-rose-950 rounded-lg p-2.5 space-y-1.5 mt-2">
                {cascadeItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-xs font-mono text-slate-400"
                    style={{ paddingLeft: `${(sub.depth - 1) * 12}px` }}
                  >
                    <span className="truncate text-slate-300">
                      {'↳ '} {sub.name}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">ID: #{sub.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 p-5 bg-slate-950/50 border-t border-slate-800">
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
            disabled={deleting}
            className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-md shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Everything'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const DeleteItemModal = DeleteItemModal2;