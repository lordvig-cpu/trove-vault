'use client';

import { ItemRecord } from './TreeNode';

interface ItemDetailViewProps {
  item: ItemRecord | null;
  onAddSubItem: (parentItem: ItemRecord) => void;
  onEditItem: (item: ItemRecord) => void;
  onDeleteItem: (item: ItemRecord) => void;
}

export default function ItemDetailView({
  item,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: ItemDetailViewProps) {
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
        <span className="text-3xl mb-2">📂</span>
        <p className="text-sm font-medium">Select an item from the hierarchy tree</p>
        <p className="text-xs text-slate-600 mt-1">Click on any item in the left sidebar to view its properties.</p>
      </div>
    );
  }

  const attributeEntries = Object.entries(item.attributes || {});

  return (
    <div className="space-y-6">
      {/* Item Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded">
                ITEM #{item.id}
              </span>
              {item.parent_id ? (
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Parent ID: {item.parent_id}
                </span>
              ) : (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Root Item
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">{item.name}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Created: {new Date(item.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEditItem(item)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onAddSubItem(item)}
              className="px-3 py-1.5 text-xs font-medium text-indigo-200 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/20"
            >
              + Add Sub-Item
            </button>
            <button
              onClick={() => onDeleteItem(item)}
              className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/60 rounded-lg transition"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic JSONB Custom Attributes Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Custom Attributes (JSONB)
          </h3>
          <span className="text-xs text-slate-500">{attributeEntries.length} Defined Fields</span>
        </div>

        {attributeEntries.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No custom attributes recorded for this item.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attributeEntries.map(([key, val]) => (
              <div
                key={key}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{key}</span>
                <span className="text-sm font-semibold text-indigo-300 mt-1">{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Sub-Items Preview */}
      {item.children && item.children.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
            Direct Sub-Items ({item.children.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.children.map((child) => (
              <div
                key={child.id}
                className="bg-slate-950 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 font-medium">{child.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  ID: {child.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}