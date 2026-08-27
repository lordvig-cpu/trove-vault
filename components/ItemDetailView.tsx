'use client';

import { ItemRecord } from './TreeNode';

interface ItemDetailViewProps {
  item: ItemRecord | null;
  onAddSubItem: (parent: ItemRecord) => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
}

export default function ItemDetailView({
  item,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: ItemDetailViewProps) {
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-subtle rounded-2xl bg-surface/30">
        <span className="text-4xl mb-3">🔍</span>
        <h3 className="text-base font-semibold text-content-primary">No Item Selected</h3>
        <p className="text-xs text-content-muted mt-1 max-w-sm">
          Select an item from the Explorer tree or create a new one to view its attributes, hierarchy, and metadata.
        </p>
      </div>
    );
  }

  const attributes = item.attributes || {};
  const attributeEntries = Object.entries(attributes);
  
  // Safe resolution of image url whether stored at root or in JSONB attributes
  const imageUrl = (item as any).image_url || attributes.image_url || attributes.photo_url;

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="p-6 bg-surface border border-border-subtle rounded-2xl shadow-xl flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-accent-primary/15 text-accent-secondary border border-accent-primary/30">
              ITEM #{item.id}
            </span>
            {item.parent_id ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-content-muted bg-surface-hover border border-border-subtle">
                Parent ID: {item.parent_id}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60">
                Root Item
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">{item.name}</h1>
          {item.created_at && (
            <p className="text-xs text-content-muted">
              Created: {new Date(item.created_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEditItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-hover hover:bg-surface-hover/80 text-content-secondary hover:text-content-primary border border-border-subtle transition cursor-pointer"
          >
            <span>✏️</span> Edit
          </button>
          <button
            type="button"
            onClick={() => onAddSubItem(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-white shadow-md shadow-accent-primary/20 transition cursor-pointer"
          >
            <span>+</span> Add Sub-Item
          </button>
          <button
            type="button"
            onClick={onDeleteItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition cursor-pointer"
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      {/* GRID: IMAGE & ATTRIBUTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Preview Card */}
        <div className="md:col-span-1 p-5 bg-surface border border-border-subtle rounded-2xl flex flex-col items-center justify-center text-center min-h-[200px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="max-h-56 w-auto rounded-lg object-contain border border-border-subtle shadow-md"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-content-muted gap-2 border border-dashed border-border-subtle/80 rounded-xl w-full h-full p-6">
              <span className="text-3xl opacity-40">📷</span>
              <span className="text-xs">No image uploaded</span>
            </div>
          )}
        </div>

        {/* Attributes Card */}
        <div className="md:col-span-2 p-5 bg-surface border border-border-subtle rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Custom Attributes (JSONB)
            </h2>
            <span className="text-xs font-mono text-content-muted">
              {attributeEntries.length} {attributeEntries.length === 1 ? 'Field' : 'Fields'}
            </span>
          </div>

          {attributeEntries.length === 0 ? (
            <p className="text-xs text-content-muted italic py-4">No custom fields assigned to this item.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attributeEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="p-3 bg-canvas/60 border border-border-subtle/80 rounded-xl flex flex-col gap-0.5"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold text-accent-secondary break-words">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SUB-ITEMS LIST CARD */}
      {item.children && item.children.length > 0 && (
        <div className="p-5 bg-surface border border-border-subtle rounded-2xl space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted border-b border-border-subtle pb-2">
            Direct Sub-Items ({item.children.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {item.children.map((child) => (
              <div
                key={child.id}
                className="p-3 bg-canvas/60 border border-border-subtle/80 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs">📄</span>
                  <span className="text-xs font-medium text-content-primary truncate">{child.name}</span>
                </div>
                <span className="text-[10px] font-mono text-content-muted shrink-0">#{child.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}