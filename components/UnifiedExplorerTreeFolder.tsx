'use client';

import { useState, useRef } from 'react';
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
  animationsEnabled?: boolean;
  isPinned?: boolean;
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
  animationsEnabled = true,
  isPinned = true,
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
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const isActiveCollection = activeCollectionId === collection.id;
  const hasChildren =
    (collection.subCollections && collection.subCollections.length > 0) ||
    (collection.items && collection.items.length > 0);

  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  const handleGearMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();

    const menuHeight = 215; // Approximate height of the menu with padding
    const bottomNavReserve = 64; // Height of bottom status bar + padding
    const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;
    
    // Default top aligns slightly above the gear icon
    let calculatedTop = Math.round(rect.top - 4);

    // If opening downwards would clip under the bottom bar, clamp it upwards
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
          className={`w-4 h-4 flex items-center justify-center text-[9px] text-content-muted hover:text-content-primary transition shrink-0 ${
            !hasChildren ? 'opacity-0 cursor-default' : ''
          }`}
        >
          {isOpen ? '▼' : '▶'}
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
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0">
            active
          </span>
        )}

        <div className="relative transition shrink-0 ml-auto">
          <div
            onMouseEnter={handleGearMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`group/gear w-6 h-6 flex items-center justify-center rounded border border-transparent transition-colors cursor-pointer ${
              isMenuOpen 
                ? 'opacity-100 bg-slate-800/60 border-[var(--panel-border-subtle)]' 
                : 'opacity-0 group-hover:opacity-100 hover:bg-slate-800/60 hover:border-[var(--panel-border-subtle)]'
            }`}
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
        animationsEnabled={animationsEnabled}
        isPinned={isPinned}
      >
        <button
          type="button"
          onClick={() => { onAddSubCollection(collection.id); setIsMenuOpen(false); }}
          className="flex items-center gap-3 px-3 py-1.5 hover:bg-amber-500/15 text-left transition-colors"
        >
          <span className="text-sm shrink-0">📁</span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-content-primary">New Sub-Folder</span>
            <span className="text-[9px] text-content-muted">Create a nested folder</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { onAddSubItem(collection.id, null); setIsMenuOpen(false); }}
          className="flex items-center gap-3 px-3 py-1.5 hover:bg-amber-500/15 text-left transition-colors"
        >
          <span className="text-sm shrink-0">📄</span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-content-primary">New Item</span>
            <span className="text-[9px] text-content-muted">Add record to this folder</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { onEditCollection(collection); setIsMenuOpen(false); }}
          className="flex items-center gap-3 px-3 py-1.5 hover:bg-amber-500/15 text-left transition-colors"
        >
          <span className="text-sm shrink-0">✏️</span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-content-primary">Edit Folder</span>
            <span className="text-[9px] text-content-muted">Rename or update</span>
          </div>
        </button>

        {/* Standalone divider line with equal vertical spacing */}
        <div className="border-t border-amber-500/20 my-1 mx-1" />

        <button
          type="button"
          onClick={() => { onDeleteCollection(collection); setIsMenuOpen(false); }}
          className="group/action flex items-center gap-2.5 px-3 py-1.5 hover:bg-rose-500/15 text-left transition-all duration-150 group/btn w-full rounded"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">
            🗑️
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-rose-400 group-hover/btn:text-rose-300">Delete Collection</span>
            <span className="text-[9px] text-rose-400/70 group-hover/btn:text-rose-300/80">Permanently remove</span>
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
              animationsEnabled={animationsEnabled}
              isPinned={isPinned}
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
              animationsEnabled={animationsEnabled}
              isPinned={isPinned}
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