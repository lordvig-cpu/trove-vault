'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CollectionRecord {
  id: number;
  parent_id?: number | null;
  name: string;
  description: string | null;
  icon?: string;
  created_at?: string;
  children?: CollectionRecord[];
}

interface CollectionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionRecord[];
  activeCollectionId: number | null;
  onSelectCollection: (id: number) => void;
  onCollectionsUpdated: () => void;
  onRequestDeleteCollection: (col: CollectionRecord) => void;
}

export function buildCollectionHierarchy(
  cols: CollectionRecord[],
  parentId: number | null = null
): CollectionRecord[] {
  return cols
    .filter((col) => (col.parent_id || null) === parentId)
    .map((col) => ({
      ...col,
      children: buildCollectionHierarchy(cols, col.id),
    }));
}

export default function CollectionDropdown({
  isOpen,
  onClose,
  collections,
  activeCollectionId,
  onSelectCollection,
  onCollectionsUpdated,
  onRequestDeleteCollection,
}: CollectionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartCreate = (parentId: number | null = null) => {
    setIsCreating(true);
    setEditingCollectionId(null);
    setName('');
    setDescription('');
    setSelectedParentId(parentId);
    setError(null);
  };

  const handleStartEdit = (col: CollectionRecord) => {
    setEditingCollectionId(col.id);
    setIsCreating(false);
    setName(col.name);
    setDescription(col.description || '');
    setSelectedParentId(col.parent_id || null);
    setError(null);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingCollectionId(null);
    setName('');
    setDescription('');
    setSelectedParentId(null);
    setError(null);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (isCreating) {
        const { data, error: insertError } = await supabase
          .from('collections')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            parent_id: selectedParentId || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) onSelectCollection(data.id);
      } else if (editingCollectionId) {
        const { error: updateError } = await supabase
          .from('collections')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            parent_id: selectedParentId || null,
          })
          .eq('id', editingCollectionId);

        if (updateError) throw updateError;
      }

      handleCancelForm();
      onCollectionsUpdated();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err?.message || 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const nestedHierarchy = buildCollectionHierarchy(collections, null);

  const renderCollectionTree = (nodes: CollectionRecord[], depth = 0) => {
    return nodes.map((col) => {
      const isActive = col.id === activeCollectionId;
      return (
        <div key={col.id} className="space-y-1">
          <div
            onClick={() => {
              onSelectCollection(col.id);
              onClose();
            }}
            className={`group px-3 py-2 rounded-xl border transition flex items-center justify-between cursor-pointer ${
              isActive
                ? 'bg-indigo-950/60 border-indigo-800/80'
                : 'bg-slate-950/40 border-transparent hover:bg-slate-800/60 hover:border-slate-800'
            }`}
            style={{ marginLeft: `${depth * 14}px` }}
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{depth === 0 ? '📂' : '📁'}</span>
                <span
                  className={`text-xs truncate ${
                    isActive ? 'text-indigo-200 font-bold' : 'text-slate-200 font-medium'
                  }`}
                >
                  {col.name}
                </span>
                {isActive && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              {col.description && (
                <p className="text-[10px] text-slate-500 truncate ml-4 mt-0.5">
                  {col.description}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleStartCreate(col.id)}
                className="p-1 text-indigo-400 hover:text-white rounded hover:bg-indigo-950/60 text-[11px]"
                title="Add Sub-Collection"
              >
                +📁
              </button>
              <button
                onClick={() => handleStartEdit(col)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 text-xs"
                title="Edit Collection"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  onRequestDeleteCollection(col);
                  onClose();
                }}
                className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/60 text-xs"
                title="Delete Collection"
              >
                🗑️
              </button>
            </div>
          </div>

          {col.children && col.children.length > 0 && (
            <div className="border-l border-slate-800/60 ml-3 pl-1 space-y-1">
              {renderCollectionTree(col.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-12 left-0 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header Bar */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Collections & Folders
        </span>
        {!isCreating && !editingCollectionId && (
          <button
            onClick={() => handleStartCreate(null)}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            + New Root Collection
          </button>
        )}
      </div>

      <div className="p-3 max-h-96 overflow-y-auto space-y-2">
        {error && (
          <div className="p-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] rounded-lg">
            {error}
          </div>
        )}

        {/* Inline Create / Edit Form */}
        {(isCreating || editingCollectionId) && (
          <form
            onSubmit={handleSaveCollection}
            className="bg-slate-950 border border-indigo-900/60 rounded-xl p-3 space-y-2.5 mb-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">
                {isCreating
                  ? selectedParentId
                    ? `+ Add Sub-Collection under #${selectedParentId}`
                    : '+ Create Root Collection'
                  : `Edit Collection #${editingCollectionId}`}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              placeholder="Collection name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />

            <input
              type="text"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />

            {/* Parent Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">Parent Container</label>
              <select
                value={selectedParentId || ''}
                onChange={(e) =>
                  setSelectedParentId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">None (Top-Level Root Collection)</option>
                {collections
                  .filter((c) => c.id !== editingCollectionId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (ID: #{c.id})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : isCreating ? 'Create' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Render Nested Hierarchy Tree */}
        <div className="space-y-1">
          {nestedHierarchy.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No collections found.</p>
          ) : (
            renderCollectionTree(nestedHierarchy)
          )}
        </div>
      </div>
    </div>
  );
}