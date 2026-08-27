'use client';

import { useState } from 'react';
import { CollectionRecord } from './CollectionDropdown';
import { ItemRecord } from './TreeNode';

export interface UnifiedCollectionNode extends CollectionRecord {
  items: ItemRecord[];
  subCollections: UnifiedCollectionNode[];
}

interface UnifiedExplorerTreeProps {
  collection: UnifiedCollectionNode;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number) => void;
  onAddSubCollection: (parentCollectionId: number) => void;
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onEditCollection: (collection: CollectionRecord) => void;
  onDeleteCollection: (collection: CollectionRecord) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

export default function UnifiedExplorerTree({
  collection,
  activeCollectionId,
  selectedItemId,
  onSelectCollection,
  onSelectItem,
  onAddSubCollection,
  onAddSubItem,
  onEditCollection,
  onDeleteCollection,
  onEditItem,
  onDeleteItem,
}: UnifiedExplorerTreeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isActiveCollection = activeCollectionId === collection.id;

  const hasChildren =
    (collection.subCollections && collection.subCollections.length > 0) ||
    (collection.items && collection.items.length > 0);

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0">
      {/* COLLECTION / FOLDER ROW */}
      <div
        onClick={() => onSelectCollection(collection.id)}
        title={`Folder: ${collection.name}`}
        className={`group flex items-center justify-between h-7 px-1.5 rounded-md cursor-pointer transition w-full min-w-0 ${
          isActiveCollection
            ? 'bg-accent-primary/15 text-accent-secondary font-medium'
            : 'text-content-secondary hover:bg-surface-hover/60 hover:text-content-primary'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
          {/* Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`w-4 h-4 flex items-center justify-center text-[9px] text-content-muted hover:text-content-primary transition shrink-0 ${
              !hasChildren ? 'opacity-0 cursor-default' : ''
            }`}
          >
            {isOpen ? '▼' : '▶'}
          </button>

          {/* Folder Icon */}
          <span className="w-4 h-4 flex items-center justify-center text-sm text-amber-400 shrink-0 select-none">
            {isOpen ? '📂' : '📁'}
          </span>

          {/* Truncated Collection Name */}
          <span 
            title={`Folder: ${collection.name}`}
            className="text-[13px] tracking-tight font-medium truncate block flex-1 min-w-0"
          >
            {collection.name}
          </span>

          {isActiveCollection && (
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0 ml-1">
              active
            </span>
          )}
        </div>

        {/* Hover Action Triggers */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onAddSubCollection(collection.id)}
            className="p-1 text-content-muted hover:text-amber-300 rounded hover:bg-surface-hover text-xs cursor-pointer"
            title="New Sub-Folder"
          >
            +📁
          </button>
          <button
            type="button"
            onClick={() => onAddSubItem(collection.id, null)}
            className="p-1 text-content-muted hover:text-accent-secondary rounded hover:bg-surface-hover text-xs cursor-pointer"
            title="New Item"
          >
            +📄
          </button>
          <button
            type="button"
            onClick={() => onEditCollection(collection)}
            className="p-1 text-content-muted hover:text-content-primary rounded hover:bg-surface-hover text-xs cursor-pointer"
            title="Edit Folder"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDeleteCollection(collection)}
            className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/50 text-xs cursor-pointer"
            title="Delete Folder"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* NESTED CHILDREN CONTAINER */}
      {isOpen && hasChildren && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 w-[calc(100%-8px)] min-w-0">
          {collection.subCollections?.map((subCol) => (
            <UnifiedExplorerTree
              key={`col-${subCol.id}`}
              collection={subCol}
              activeCollectionId={activeCollectionId}
              selectedItemId={selectedItemId}
              onSelectCollection={onSelectCollection}
              onSelectItem={onSelectItem}
              onAddSubCollection={onAddSubCollection}
              onAddSubItem={onAddSubItem}
              onEditCollection={onEditCollection}
              onDeleteCollection={onDeleteCollection}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))}

          {collection.items?.map((item) => (
            <ItemTreeNode
              key={`item-${item.id}`}
              item={item}
              collectionId={collection.id}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
              onAddSubItem={onAddSubItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* RECURSIVE ITEM NODE COMPONENT                                              */
/* -------------------------------------------------------------------------- */
interface ItemTreeNodeProps {
  item: ItemRecord;
  collectionId: number;
  selectedItemId: number | null;
  onSelectItem: (item: ItemRecord, collectionId: number) => void;
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

function getItemTypeIcon(item: ItemRecord): string {
  const attrs = item.attributes || {};
  if (attrs.cgc_grade || attrs.publisher || attrs.issue_number) return '📚';
  if (attrs.grading_company || attrs.card_number || attrs.rarity) return '🃏';
  if (attrs.platform || attrs.completeness) return '🎮';
  if (attrs.designer || attrs.player_count || attrs.play_time) return '🎲';
  if (attrs.format || attrs.aspect_ratio) return '🎬';
  return '📄';
}

function ItemTreeNode({
  item,
  collectionId,
  selectedItemId,
  onSelectItem,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: ItemTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedItemId === item.id;
  const hasSubItems = item.children && item.children.length > 0;
  const typeIcon = getItemTypeIcon(item);

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0">
      <div
        onClick={() => onSelectItem(item, collectionId)}
        title={item.name}
        className={`group flex items-center justify-between h-7 px-1.5 rounded-md cursor-pointer transition w-full min-w-0 ${
          isSelected
            ? 'bg-accent-primary/25 text-content-primary font-medium border border-accent-primary/40'
            : 'text-content-muted hover:bg-surface-hover/60 hover:text-content-secondary'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
          {/* Sub-item Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`w-4 h-4 flex items-center justify-center text-[9px] text-content-muted hover:text-content-primary transition shrink-0 ${
              !hasSubItems ? 'opacity-0 cursor-default' : ''
            }`}
          >
            {isOpen ? '▼' : '▶'}
          </button>

          {/* Type Icon */}
          <span className="w-4 h-4 flex items-center justify-center text-[13px] leading-none shrink-0 select-none">
            {typeIcon}
          </span>

          {/* Truncated Item Name */}
          <span 
            title={item.name}
            className={`text-[13px] tracking-tight truncate block flex-1 min-w-0 ${isSelected ? 'text-accent-secondary font-medium' : ''}`}
          >
            {item.name}
          </span>
        </div>

        {/* Action Triggers */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onAddSubItem(collectionId, item.id)}
            className="p-1 text-content-muted hover:text-accent-secondary rounded hover:bg-surface-hover text-xs cursor-pointer"
            title="Add Child Sub-Item"
          >
            +↳
          </button>
          <button
            type="button"
            onClick={() => onEditItem(item, collectionId)}
            className="p-1 text-content-muted hover:text-content-primary rounded hover:bg-surface-hover text-xs cursor-pointer"
            title="Edit Item"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDeleteItem(item, collectionId)}
            className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/50 text-xs cursor-pointer"
            title="Delete Item"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* RECURSIVE SUB-ITEMS */}
      {isOpen && hasSubItems && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 w-[calc(100%-8px)] min-w-0">
          {item.children!.map((child) => (
            <ItemTreeNode
              key={`item-${child.id}`}
              item={child}
              collectionId={collectionId}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
              onAddSubItem={onAddSubItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}