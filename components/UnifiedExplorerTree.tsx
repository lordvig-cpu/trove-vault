'use client';

import { useState } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';

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
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      {/* COLLECTION / FOLDER ROW */}
      <div
        onClick={() => onSelectCollection(collection.id)}
        title={`Folder: ${collection.name}`}
        className={`group flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0 ${
          isActiveCollection
            ? 'bg-accent-primary/15 text-accent-secondary font-medium'
            : 'text-content-secondary hover:bg-surface-hover/60 hover:text-content-primary'
        }`}
      >
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
          className="text-[13px] tracking-tight font-medium truncate shrink min-w-0"
        >
          {collection.name}
        </span>

        {isActiveCollection && (
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0">
            active
          </span>
        )}

        {/* Hover Action Menu */}
        <div
          className="relative group/menu opacity-0 group-hover:opacity-100 transition shrink-0 ml-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gear Trigger Button */}
          <div className="w-[22px] h-[22px] flex items-center justify-center rounded border border-transparent group-hover/menu:bg-slate-800/60 group-hover/menu:border-border-subtle transition-colors cursor-default">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[15px] h-[15px] text-content-muted group-hover/menu:text-white transition-all duration-300 ease-out group-hover/menu:rotate-90"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                className="fill-transparent group-hover/menu:fill-current transition-colors duration-300"
                d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.4 5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.7 8.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.5c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 2.6 1.5l.4 3h4l.4-3a8.7 8.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"
              />
            </svg>
          </div>
          
          {/* Hover Bridge & Popup Container */}
          <div className="absolute right-0 bottom-full pb-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 ease-out z-50">
            <div className="explorer-action-popup">
              <button
                type="button"
                onClick={() => onAddSubCollection(collection.id)}
                className="explorer-action-btn explorer-action-btn-accent"
                title="New Sub-Folder"
              >
                +📁
              </button>
              <button
                type="button"
                onClick={() => onAddSubItem(collection.id, null)}
                className="explorer-action-btn explorer-action-btn-accent"
                title="New Item"
              >
                +📄
              </button>
              <button
                type="button"
                onClick={() => onEditCollection(collection)}
                className="explorer-action-btn"
                title="Edit Folder"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => onDeleteCollection(collection)}
                className="explorer-action-btn-danger"
                title="Delete Folder"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NESTED CHILDREN CONTAINER */}
      {isOpen && hasChildren && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 flex flex-col min-w-0">
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
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectItem(item, collectionId)}
        title={item.name}
        className={`group flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0 ${
          isSelected
            ? 'bg-accent-primary/25 text-content-primary font-medium border border-accent-primary/40'
            : 'text-content-muted hover:bg-surface-hover/60 hover:text-content-secondary'
        }`}
      >
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
          className={`text-[13px] tracking-tight truncate shrink min-w-0 ${isSelected ? 'text-accent-secondary font-medium' : ''}`}
        >
          {item.name}
        </span>

        {/* Hover Action Menu */}
        <div
          className="relative group/menu opacity-0 group-hover:opacity-100 transition shrink-0 ml-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gear Trigger Button */}
          <div className="w-[22px] h-[22px] flex items-center justify-center rounded border border-transparent group-hover/menu:bg-slate-800/60 group-hover/menu:border-border-subtle transition-colors cursor-default">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[15px] h-[15px] text-content-muted group-hover/menu:text-white transition-all duration-300 ease-out group-hover/menu:rotate-90"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                className="fill-transparent group-hover/menu:fill-current transition-colors duration-300"
                d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.4 5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.7 8.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.5c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 2.6 1.5l.4 3h4l.4-3a8.7 8.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"
              />
            </svg>
          </div>
          
          {/* Hover Bridge & Popup Container */}
          <div className="absolute right-0 bottom-full pb-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 ease-out z-50">
            <div className="explorer-action-popup">
              {/* buttons */}
              <button
                type="button"
                onClick={() => onAddSubItem(collectionId, item.id)}
                className="explorer-action-btn explorer-action-btn-accent"
                title="Add Child Sub-Item"
              >
                +↳
              </button>
              <button
                type="button"
                onClick={() => onEditItem(item, collectionId)}
                className="explorer-action-btn"
                title="Edit Item"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => onDeleteItem(item, collectionId)}
                className="explorer-action-btn-danger"
                title="Delete Item"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RECURSIVE SUB-ITEMS */}
      {isOpen && hasSubItems && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 flex flex-col min-w-0">
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