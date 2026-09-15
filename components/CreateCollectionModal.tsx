'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection';

/* ==========================================================================
   1. TYPE DEFINITIONS & PROPS
   ========================================================================== */

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionCreated: (newId: number) => void;
  collections: CollectionRecord[];
  initialParentId?: number | null;
}

/* ==========================================================================
   2. MAIN COMPONENT: CreateCollectionModal
   Modal dialog allowing users to create new collection containers or nested
   sub-collections with a name, description, and parent collection selector.
   ========================================================================== */

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onCollectionCreated,
  collections,
  initialParentId = null,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | null>(initialParentId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          parent_id: parentId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onCollectionCreated(data.id);
      onClose();
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err?.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 item-modal-backdrop">
      <div className="w-full max-w-md rounded-2xl overflow-hidden item-modal-dialog flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="item-modal-header flex items-center justify-between p-5 shrink-0">
          <div>
            <h2 className="text-base font-bold item-modal-primary-text">
              Create New Collection
            </h2>
            <p className="text-xs item-modal-muted">
              Add a new collection container to organize your items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="item-modal-error p-3 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Collection Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold item-modal-label">Collection Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Comic Books, Rare Coins..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full item-modal-input rounded-lg px-3 py-2 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold item-modal-label">Description (Optional)</label>
            <textarea
              placeholder="Brief summary or notes about this collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full item-modal-input rounded-lg px-3 py-2 text-xs resize-none"
            />
          </div>

          {/* Parent Collection Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold item-modal-label">Parent Collection</label>
            <select
              value={parentId === null ? '' : parentId}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="">(None - Top Level Collection)</option>
              {collections
                .filter((c) => c.id > 0)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    📁 {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 item-modal-property-divider">
            <button
              type="button"
              onClick={onClose}
              className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="item-modal-primary-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

