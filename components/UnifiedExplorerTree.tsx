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
    <div className="select-none text-xs font-sans min-w-max">
      {/* COLLECTION / FOLDER ROW */}
      <div
        onClick={() => onSelectCollection(collection.id)}
        className={`group flex items-center justify-between h-6 px-1.5 rounded cursor-pointer transition whitespace-nowrap ${
          isActiveCollection
            ? 'bg-indigo-950/70 text-indigo-100 font-medium'
            : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-1 shrink-0 pr-2">
          {/* Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] text-slate-500 hover:text-slate-200 transition shrink-0 ${
              !hasChildren ? 'opacity-0 cursor-default' : ''
            }`}
          >
            {isOpen ? '▼' : '▶'}
          </button>

          {/* Folder Icon */}
          <span className="text-xs text-amber-400 shrink-0">
            {isOpen ? '📂' : '📁'}
          </span>

          {/* Collection Name */}
          <span className="text-xs tracking-tight">{collection.name}</span>

          {isActiveCollection && (
            <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1 py-0 rounded shrink-0 ml-1">
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
            className="p-0.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 text-[10px]"
            title="New Sub-Folder"
          >
            +📁
          </button>
          <button
            type="button"
            onClick={() => onAddSubItem(collection.id, null)}
            className="p-0.5 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 text-[10px]"
            title="New Item"
          >
            +📄
          </button>
          <button
            type="button"
            onClick={() => onEditCollection(collection)}
            className="p-0.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 text-[10px]"
            title="Edit Folder"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDeleteCollection(collection)}
            className="p-0.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/50 text-[10px]"
            title="Delete Folder"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* NESTED CHILDREN CONTAINER (Single Linear 12px Step) */}
      {isOpen && hasChildren && (
        <div className="border-l border-slate-800/80 space-y-0.5 ml-[7px] pl-[5px]">
          {/* Sub-Collections */}
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

          {/* Items */}
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

  const imageUrl = item.attributes?.image_url ? String(item.attributes.image_url) : null;

  return (
    <div className="select-none text-xs font-sans min-w-max">
      <div
        onClick={() => onSelectItem(item, collectionId)}
        className={`group flex items-center justify-between h-6 px-1.5 rounded cursor-pointer transition whitespace-nowrap ${
          isSelected
            ? 'bg-indigo-600/30 text-indigo-100 font-medium'
            : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-1 shrink-0 pr-2">
          {/* Sub-item Expand / Collapse */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] text-slate-500 hover:text-slate-200 transition shrink-0 ${
              !hasSubItems ? 'opacity-0 cursor-default' : ''
            }`}
          >
            {isOpen ? '▼' : '▶'}
          </button>

          {/* Thumbnail / Avatar */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-3.5 h-3.5 rounded object-cover border border-slate-700/80 shrink-0"
            />
          ) : (
            <span className="text-[11px] text-slate-500 shrink-0">📄</span>
          )}

          {/* Name */}
          <span className="text-xs tracking-tight">{item.name}</span>
        </div>

        {/* Action Triggers */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onAddSubItem(collectionId, item.id)}
            className="p-0.5 text-slate-500 hover:text-indigo-300 rounded hover:bg-slate-800 text-[10px]"
            title="Add Child Sub-Item"
          >
            +↳
          </button>
          <button
            type="button"
            onClick={() => onEditItem(item, collectionId)}
            className="p-0.5 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 text-[10px]"
            title="Edit Item"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDeleteItem(item, collectionId)}
            className="p-0.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/50 text-[10px]"
            title="Delete Item"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* RECURSIVE SUB-ITEMS (Single Linear 12px Step with Guide Line) */}
      {isOpen && hasSubItems && (
        <div className="border-l border-slate-800/80 space-y-0.5 ml-[7px] pl-[5px]">
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