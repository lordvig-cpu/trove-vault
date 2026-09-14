'use client';

import { ItemRecord } from '@/types/item';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

interface ItemDetailViewProps {
  item: ItemRecord | null;
  onAddSubItem: (parent: ItemRecord) => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: ItemDetailView
   Displays active record details, schema properties, media attachments,
   and direct child items on the workspace canvas.
   ========================================================================== */

export default function ItemDetailView({
  item,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: ItemDetailViewProps) {
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 content-card">
        <span className="text-4xl mb-3">🔍</span>
        <h3 className="text-base font-semibold detail-heading">No Item Selected</h3>
        <p className="text-xs detail-muted mt-1 max-w-sm">
          Select an item from the Explorer tree or create a new one to view its attributes, hierarchy, and metadata.
        </p>
      </div>
    );
  }

  const attributes = item.attributes || {};
  const attributeEntries = Object.entries(attributes);
  const imageUrl = (item as any).image_url || attributes.image_url || attributes.photo_url;

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="content-card p-5 flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="detail-item-badge px-2 py-0.5 rounded text-[11px] font-mono font-medium">
              ITEM #{item.id}
            </span>
            {item.parent_id ? (
              <span className="detail-parent-badge px-2 py-0.5 rounded text-[11px] font-mono">
                Parent ID: {item.parent_id}
              </span>
            ) : (
              <span className="badge-root-item">
                Root Item
              </span>
            )}
            {item.collection_id === null && (
              <span className="detail-standalone-badge px-2 py-0.5 rounded text-[11px] font-mono">
                Standalone
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold detail-heading tracking-tight">{item.name}</h1>
          {item.created_at && (
            <p className="text-xs detail-muted">
              Created: {new Date(item.created_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEditItem}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5',
              'text-xs font-semibold detail-action-secondary rounded-lg',
              'cursor-pointer transition',
            ].join(' ')}
          >
            <span>✏️</span> Edit
          </button>

          <button
            type="button"
            onClick={() => onAddSubItem(item)}
            className="content-btn-primary"
          >
            <span>+</span> Add Sub-Item
          </button>

          <button
            type="button"
            onClick={onDeleteItem}
            className="content-btn-danger"
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      {/* GRID: IMAGE & ATTRIBUTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Preview Card */}
        <div className="md:col-span-1 content-card p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="detail-image max-h-56 w-auto rounded-lg object-contain border"
            />
          ) : (
            <div
              className={[
                'flex flex-col items-center justify-center gap-2 w-full h-full p-6',
                'detail-empty-image border border-dashed rounded-xl',
              ].join(' ')}
            >
              <span className="text-3xl detail-empty-icon">📷</span>
              <span className="text-xs">No image uploaded</span>
            </div>
          )}
        </div>

        {/* Attributes Card */}
        <div className="md:col-span-2 content-card p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between detail-divider border-b pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider detail-muted">
              Custom Attributes (JSONB)
            </h2>
            <span className="text-xs font-mono detail-muted">
              {attributeEntries.length} {attributeEntries.length === 1 ? 'Field' : 'Fields'}
            </span>
          </div>

          {attributeEntries.length === 0 ? (
            <p className="text-xs detail-muted italic py-4">No custom fields assigned to this item.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attributeEntries.map(([key, value]) => (
                <div key={key} className="content-pill flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider detail-muted">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold detail-accent break-words">
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
        <div className="content-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider detail-muted detail-divider border-b pb-2">
            Direct Sub-Items ({item.children.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {item.children.map((child) => (
              <div key={child.id} className="content-pill flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs">📄</span>
                  <span className="text-xs font-medium detail-heading truncate">{child.name}</span>
                </div>
                <span className="text-[10px] font-mono detail-muted shrink-0">#{child.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}