'use client';

import { useState, useEffect, useRef } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { GearIcon } from '@/components/icons/ActionIcons';
import ExplorerActionMenu from '@/components/ExplorerActionMenu';
import UnifiedExplorerTreeItem from '@/components/UnifiedExplorerTreeItem';

export interface UnifiedCollectionNode extends CollectionRecord {
  items: ItemRecord[];
  subCollections: UnifiedCollectionNode[];
}

export interface UnifiedExplorerTreeFolderProps {
  collection: UnifiedCollectionNode;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  depth?: number;
  collapsedFolderIds?: Set<number>;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number) => void;
  onAddSubCollection: (parentCollectionId: number) => void;
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onEditCollection: (collection: CollectionRecord) => void;
  onDeleteCollection: (collection: CollectionRecord) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

export default function UnifiedExplorerTreeFolder({
  collection,
  activeCollectionId,
  selectedItemId,
  depth = 0,
  collapsedFolderIds,
  onSelectCollection,
  onSelectItem,
  onAddSubCollection,
  onAddSubItem,
  onEditCollection,
  onDeleteCollection,
  onEditItem,
  onDeleteItem,
}: UnifiedExplorerTreeFolderProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Sync state if current folder ID was toggled
  useEffect(() => {
    if (collapsedFolderIds?.has(collection.id)) {
      setIsOpen(false);
    }
  }, [collapsedFolderIds, collection.id]);

  const isActiveCollection = activeCollectionId === collection.id;

  // React to global collapse / expand triggers
  useEffect(() => {
    if (!collapsedFolderIds) return;

    if (collapsedFolderIds.has(collection.id)) {
      setIsOpen(false);
    } else if (isActiveCollection) {
      setIsOpen(true);
    }
  }, [collapsedFolderIds, collection.id, isActiveCollection]);
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const hasChildren =
    (collection.subCollections && collection.subCollections.length > 0) ||
    (collection.items && collection.items.length > 0);

  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  const handleGearMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();

    const menuHeight = 215;
    const bottomNavReserve = 64;
    const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;
    
    let calculatedTop = Math.round(rect.top - 4);

    if (calculatedTop > maxAllowedTop) {
      calculatedTop = Math.max(16, maxAllowedTop);
    }
    
    setMenuCoords({ 
      top: calculatedTop, 
      left: Math.round(rect.right + 6) 
    });
    
    setIsMenuOpen(true);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 350);
  };

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectCollection(collection.id)}
        title={`Folder: ${collection.name}`}
        style={{
          top: `${stickyTop}px`,
          zIndex: stickyZIndex,
        }}
        className={`group flex items-center h-7 px-1.5 gap-1.5 cursor-pointer transition w-full min-w-0 explorer-folder-sticky-header ${
          isActiveCollection
            ? 'bg-accent-primary/15 text-accent-secondary font-medium'
            : 'text-content-secondary hover:bg-surface-hover/60 hover:text-content-primary'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={[
            'flex items-center justify-center w-4 h-4 shrink-0',
            'text-content-muted hover:text-content-primary',
            'cursor-pointer transition',
            !hasChildren && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px]">
              {/* Down-pointing filled triangle */}
              <polygon points="5,8 19,8 12,18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px]">
              {/* Right-pointing filled triangle */}
              <polygon points="8,5 8,19 18,12" />
            </svg>
          )}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-sm text-amber-400 shrink-0 select-none">
          {isOpen ? '📂' : '📁'}
        </span>

        <span 
          title={`Folder: ${collection.name}`}
          className="text-[13px] tracking-tight font-medium truncate shrink min-w-0"
        >
          {collection.name}
        </span>

        {isActiveCollection && (
          <span
            className={[
              'px-1.5 py-0.5 rounded shrink-0',
              'text-[9px] font-mono',
              'border tree-badge-active',
            ].join(' ')}
          >
            active
          </span>
        )}

        <div className="relative transition shrink-0 ml-auto">
          <div
            onMouseEnter={handleGearMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={[
              'group/gear flex items-center justify-center w-6 h-6 shrink-0',
              'rounded border border-transparent',
              'cursor-pointer transition-colors',
              isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger',
            ].join(' ')}
          >
            <GearIcon 
              isActive={isMenuOpen}
              className={`w-[15px] h-[15px] transition-all duration-300 ease-out ${
                isMenuOpen ? 'text-white rotate-90' : 'text-content-muted group-hover/gear:text-content-primary'
              }`} 
            />
          </div>
        </div>
      </div>

      <ExplorerActionMenu
        isOpen={isMenuOpen}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMouseLeave}
        top={menuCoords.top}
        left={menuCoords.left}
        title="Folder Actions"
        titleIcon="📂"
      >
        <button
          type="button"
          onClick={() => {
            onAddSubCollection(collection.id);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm group-hover/action:scale-105 transition-transform">📁</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-content-primary">New Sub-Folder</span>
            <span className="text-[9px] text-content-muted">Create a nested folder</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onAddSubItem(collection.id, null);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm group-hover/action:scale-105 transition-transform">📄</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-content-primary">New Item</span>
            <span className="text-[9px] text-content-muted">Add record to this folder</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onEditCollection(collection);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm group-hover/action:scale-105 transition-transform">✏️</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-content-primary">Edit Folder</span>
            <span className="text-[9px] text-content-muted">Rename or update</span>
          </div>
        </button>

        <div className="my-1 mx-1 tree-menu-divider" />

        <button
          type="button"
          onClick={() => {
            onDeleteCollection(collection);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item-danger"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm group-hover/action:scale-105 transition-transform">🗑️</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium tree-menu-danger-label">Delete Collection</span>
            <span className="text-[9px] tree-menu-danger-subtext">Permanently remove</span>
          </div>
        </button>
      </ExplorerActionMenu>      

      {isOpen && hasChildren && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 flex flex-col min-w-0">
          {collection.subCollections?.map((subCol) => (
            <UnifiedExplorerTreeFolder
              key={`col-${subCol.id}`}
              collection={subCol}
              activeCollectionId={activeCollectionId}
              selectedItemId={selectedItemId}
              depth={depth + 1}
              collapsedFolderIds={collapsedFolderIds}
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
            <UnifiedExplorerTreeItem
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