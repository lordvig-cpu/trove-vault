'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface CollectionRecord {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  created_at?: string;
  children?: CollectionRecord[];
}

export interface CollectionDropdownProps {
  collections: CollectionRecord[];
  activeCollectionId: number | null;
  onSelectCollection: (id: number) => void;
  onCollectionsUpdated: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRequestDelete?: (collection: CollectionRecord) => void;
}

export default function CollectionDropdown({
  collections,
  activeCollectionId,
  onSelectCollection,
  onCollectionsUpdated,
  isOpen,
  setIsOpen,
  onRequestDelete,
}: CollectionDropdownProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [parentCollectionId, setParentCollectionId] = useState<number | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  function buildCollectionTree(
    items: CollectionRecord[],
    parentId: number | null = null
  ): CollectionRecord[] {
    return items
      .filter((item) => (item.parent_id || null) === parentId)
      .map((item) => ({
        ...item,
        children: buildCollectionTree(items, item.id),
      }));
  }

  const collectionTree = buildCollectionTree(collections, null);

  const handleStartCreate = (parentId: number | null = null) => {
    setParentCollectionId(parentId);
    setNewColName('');
    setNewColDesc('');
    setError(null);
    setIsCreating(true);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      setIsSaving(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert({
          name: newColName.trim(),
          description: newColDesc.trim() || null,
          parent_id: parentCollectionId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setIsCreating(false);
      setNewColName('');
      setNewColDesc('');
      onCollectionsUpdated();

      if (data) {
        onSelectCollection(data.id);
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error creating folder/collection:', err);
      setError(err?.message || 'Failed to create collection');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTreeNodes = (nodes: CollectionRecord[], level = 0) => {
    return nodes.map((col) => {
      const isActive = col.id === activeCollectionId;
      const hasChildren = col.children && col.children.length > 0;

      return (
        <div key={col.id} className="flex flex-col">
          <div
            onClick={() => {
              onSelectCollection(col.id);
              setIsOpen(false);
            }}
            className={`group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition ${
              isActive
                ? 'bg-accent-primary/20 border border-accent-primary/50 text-content-primary font-semibold'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
            }`}
            style={{ paddingLeft: `${level * 14 + 8}px` }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-amber-400 text-sm shrink-0">📁</span>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs">{col.name}</span>
                {col.description && (
                  <span className="truncate text-[10px] text-content-muted font-normal">
                    {col.description}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.2 rounded shrink-0 ml-1">
                  Active
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleStartCreate(col.id)}
                className="p-1 text-content-muted hover:text-amber-300 rounded hover:bg-surface-hover text-[10px]"
                title="Add Sub-Folder"
              >
                +📁
              </button>
              {onRequestDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onRequestDelete(col);
                    setIsOpen(false);
                  }}
                  className="p-1 text-content-muted hover:text-rose-400 rounded hover:bg-surface-hover text-[10px]"
                  title="Delete Folder"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {hasChildren && (
            <div className="border-l border-border-subtle ml-3.5 pl-0.5 space-y-0.5 mt-0.5">
              {renderTreeNodes(col.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-hover/80 hover:bg-surface-hover text-content-primary border border-border-subtle transition cursor-pointer"
      >
        <span className="text-amber-400">📁</span>
        <span className="truncate max-w-[140px]">
          {activeCollection ? activeCollection.name : 'Select Collection'}
        </span>
        <span className="text-[10px] text-content-muted">▾</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
          />

          <div className="absolute left-0 mt-2 w-80 bg-surface-popover border border-border-strong rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 z-50 p-3 flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Collections & Folders
              </span>
              <button
                type="button"
                onClick={() => handleStartCreate(null)}
                className="text-[11px] font-semibold text-accent-secondary hover:text-accent-primary cursor-pointer"
              >
                + New Root Collection
              </button>
            </div>

            {isCreating && (
              <form
                onSubmit={handleCreateCollection}
                className="p-2.5 bg-surface border border-accent-primary/40 rounded-lg flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-accent-secondary">
                    {parentCollectionId ? '➕ New Sub-Folder' : '➕ New Root Collection'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-content-muted hover:text-content-primary text-xs"
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Collection Name..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-canvas border border-border-subtle rounded px-2 py-1 text-xs text-content-primary focus:outline-none focus:border-accent-primary"
                />

                <input
                  type="text"
                  placeholder="Description (optional)..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full bg-canvas border border-border-subtle rounded px-2 py-1 text-[11px] text-content-secondary focus:outline-none focus:border-accent-primary"
                />

                {error && <span className="text-[10px] text-rose-400">{error}</span>}

                <div className="flex justify-end gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-[11px] text-content-muted hover:text-content-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !newColName.trim()}
                    className="px-2.5 py-1 bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 text-white rounded text-[11px] font-semibold"
                  >
                    {isSaving ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-64 overflow-y-auto space-y-1">
              {collections.length === 0 ? (
                <div className="text-xs text-content-muted text-center py-4">
                  No collections yet. Click "+ New Root Collection" above.
                </div>
              ) : (
                renderTreeNodes(collectionTree)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}