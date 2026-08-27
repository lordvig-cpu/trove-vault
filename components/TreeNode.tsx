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

// Calculate dynamic padding so deep levels (e.g. 5 to 20) don't push text off-screen
const getIndentPadding = (depth: number) => {
  if (depth <= 3) return depth * 12;            // 0px, 12px, 24px, 36px
  if (depth <= 6) return 36 + (depth - 3) * 8;  // 44px, 52px, 60px
  return Math.min(60 + (depth - 6) * 4, 90);    // Capped maximum indent at 90px
};

export default function TreeNode({
  item,
  level = 0,
  selectedItemId,
  onSelectItem,
}: TreeNodeProps) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isSelected = selectedItemId === item.id;
  const indent = getIndentPadding(level);

  return (
    <div className="flex flex-col select-none w-full min-w-0">
      {/* Node Row */}
      <div
        onClick={() => {
          onSelectItem(item);
        }}
        style={{ paddingLeft: `${indent + 6}px` }}
        className={`group flex items-center justify-between gap-1.5 py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 border text-xs min-w-0 w-full ${
          isSelected
            ? 'bg-accent-primary/20 border-accent-primary text-white font-semibold shadow-sm'
            : level === 0
            ? 'bg-surface/80 border-border-subtle text-content-primary hover:bg-surface-hover hover:border-border-strong'
            : 'bg-transparent border-transparent text-content-secondary hover:bg-surface-hover hover:text-content-primary'
        }`}
      >
        {/* Leading Toggle / Icon + Truncated Label */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Expand / Collapse Toggle */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevents triggering row selection when toggling
                setIsExpanded(!isExpanded);
              }}
              className="w-4 h-4 flex items-center justify-center shrink-0 rounded text-content-muted hover:text-content-primary hover:bg-surface-hover transition cursor-pointer"
            >
              <span
                className={`transform transition-transform text-[9px] inline-block ${
                  isExpanded ? 'rotate-90' : 'rotate-0'
                }`}
              >
                ▶
              </span>
            </button>
          ) : (
            <span className="w-4 h-4 flex items-center justify-center shrink-0 text-content-muted/60 text-[9px]">
              •
            </span>
          )}

          {/* Item Label with Native Tooltip */}
          <span 
            title={item.name}
            className={`truncate block ${isSelected ? 'text-accent-secondary font-medium' : ''}`}
          >
            {item.name}
          </span>
        </div>

        {/* Sub-item Count Badge */}
        {hasChildren && (
          <span className="shrink-0 text-[10px] font-mono bg-canvas/80 text-content-muted px-1.5 py-0.2 rounded border border-border-subtle">
            {item.children!.length}
          </span>
        )}
      </div>

      {/* Recursive Nested Sub-items */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-0.5 mt-0.5 w-full min-w-0">
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