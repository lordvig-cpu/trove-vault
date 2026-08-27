'use client';

import { useState } from 'react';

export interface ItemRecord {
  id: number;
  collection_id: number;
  parent_id: number | null;
  image_url?: string | null;
  name: string;
  attributes: Record<string, any>;
  created_at: string;
  children?: ItemRecord[];
}

interface TreeNodeProps {
  item: ItemRecord;
  level?: number;
  selectedItemId: number | null;
  onSelectItem: (item: ItemRecord) => void;
}

export default function TreeNode({
  item,
  level = 0,
  selectedItemId,
  onSelectItem,
}: TreeNodeProps) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isSelected = selectedItemId === item.id;

  return (
    <div className="flex flex-col select-none">
      {/* Node Row */}
      <div
        onClick={() => {
          console.log('Selected item:', item);
          onSelectItem(item);
        }}
        className={`group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-150 border text-xs ${
          isSelected
            ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-sm'
            : level === 0
            ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
        style={{ marginLeft: `${level * 18}px` }}
      >
        {/* Expand / Collapse Toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevents triggering row selection when just toggling expand/collapse
              setIsExpanded(!isExpanded);
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <span
              className={`transform transition-transform text-[10px] inline-block ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-slate-600 text-[10px]">
            •
          </span>
        )}

        {/* Item Label */}
        <span className={`truncate ${isSelected ? 'text-indigo-200' : ''}`}>
          {item.name}
        </span>

        {/* Sub-item Count Badge */}
        {hasChildren && (
          <span className="ml-auto text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
            {item.children!.length} sub
          </span>
        )}
      </div>

      {/* Recursive Nested Sub-items */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-1 mt-1 border-l border-slate-800 ml-3.5 pl-1">
          {item.children!.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}