'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection';

/* ==========================================================================
   1. TYPE DEFINITIONS
   ========================================================================== */

export interface CollectionDropdownProps {
  collections: CollectionRecord[];
  activeCollectionId: number | null;
  onSelectCollection: (id: number) => void;
  onCollectionsUpdated: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRequestDelete?: (collection: CollectionRecord) => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: CollectionDropdown
   Displays a recursive tree of collections and provides inline creation 
   and deletion of root and nested collection containers.
   ========================================================================== */

export default function CollectionDropdown({
  collections,
  activeCollectionId,
  onSelectCollection,
  onCollectionsUpdated,
  isOpen,
  setIsOpen,
  onRequestDelete,
}: CollectionDropdownProps) {
  /* ------------------------------------------------------------------------
     2.1 LOCAL FORM & PERSISTENCE STATES
     ------------------------------------------------------------------------ */
  const [isCreating, setIsCreating] = useState(false);
  const [parentCollectionId, setParentCollectionId] = useState<number | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  /* ------------------------------------------------------------------------
     2.2 TREE CONSTRUCTION
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     2.3 CREATION HANDLERS
     ------------------------------------------------------------------------ */
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
    } catch (err: unknown) {
      console.error('Error creating collection in collections table:', err);
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------------------
     2.4 RECURSIVE NODE RENDERER
     ------------------------------------------------------------------------ */
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
            className={`group col-dropdown-item ${
              isActive ? 'col-dropdown-item-active' : 'col-dropdown-item-inactive'
            }`}
            style={{ paddingLeft: `${level * 14 + 8}px` }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="dropdown-icon text-sm shrink-0">
                {col.icon || '📁'}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs">{col.name}</span>
                {col.description && (
                  <span className="truncate text-[10px] dropdown-muted font-normal">
                    {col.description}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="col-dropdown-active-badge">
                  Active
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-1 ui-invisible transition shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleStartCreate(col.id)}
                className="p-1 dropdown-muted dropdown-control rounded text-[10px]"
                title="Add Sub-Collection"
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
                  className="p-1 dropdown-muted dropdown-control-danger rounded text-[10px]"
                  title="Delete Collection"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {hasChildren && (
            <div className="col-dropdown-branch">
              {renderTreeNodes(col.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  /* ------------------------------------------------------------------------
     2.5 COMPONENT RENDER
     ------------------------------------------------------------------------ */
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="col-dropdown-trigger"
      >
        <span className="dropdown-icon">
          {activeCollection?.icon || '📁'}
        </span>
        <span className="truncate max-w-[140px]">
          {activeCollection ? activeCollection.name : 'Select Collection'}
        </span>
        <span className="text-[10px] dropdown-muted">▾</span>
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

          <div className="col-dropdown-panel">
            <div className="flex items-center justify-between ui-border-bottom-subtle border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider dropdown-muted">
                Collections
              </span>
              <button
                type="button"
                onClick={() => handleStartCreate(null)}
                className="text-[11px] font-semibold dropdown-accent ui-hover-accent cursor-pointer"
              >
                + New Root Collection
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateCollection} className="col-dropdown-form">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold dropdown-accent">
                    {parentCollectionId ? '➕ New Sub-Collection' : '➕ New Root Collection'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="dropdown-muted ui-hover-primary text-xs"
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
                  className="w-full dropdown-input border rounded px-2 py-1 text-xs"
                />

                <input
                  type="text"
                  placeholder="Description (optional)..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full dropdown-input border rounded px-2 py-1 text-[11px]"
                />

                {error && <span className="text-[10px] dropdown-error">{error}</span>}

                <div className="flex justify-end gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-[11px] dropdown-muted ui-hover-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !newColName.trim()}
                    className="px-2.5 py-1 ui-primary-surface rounded text-[11px] font-semibold dropdown-disabled"
                  >
                    {isSaving ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-64 overflow-y-auto space-y-1 col-dropdown-scroll pr-1">
              {collections.length === 0 ? (
                <div className="text-xs dropdown-muted text-center py-4">
                  No collections yet. Click &quot;+ New Root Collection&quot; above.
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