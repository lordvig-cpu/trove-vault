'use client';

import React, { useState, useRef, createContext, useContext } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { GearIcon, AddSubItemIcon } from '@/components/icons/ActionIcons';
import ExplorerActionMenu from '@/components/ExplorerActionMenu';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/ExplorerIcons';

// ==========================================
// TYPES & CONTEXT
// ==========================================

export interface UnifiedCollectionNode extends CollectionRecord {
  items: ItemRecord[];
  subCollections: UnifiedCollectionNode[];
}

interface TreeContextType {
  activeCollectionId: number | null;
  selectedItemId: number | null;
  expandedFolderIds?: Set<number>;
  onToggleFolder?: (folderId: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number) => void;
  onAddSubCollection: (parentCollectionId: number) => void;
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onEditCollection: (collection: CollectionRecord) => void;
  onDeleteCollection: (collection: CollectionRecord) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

export interface UnifiedExplorerTreeProps extends TreeContextType {
  collection: UnifiedCollectionNode;
}

const TreeContext = createContext<TreeContextType | null>(null);

function useTreeContext() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('useTreeContext must be used within UnifiedExplorerTree');
  return ctx;
}

// ==========================================
// ITEM COMPONENT
// ==========================================

function getItemTypeIcon(item: ItemRecord): string {
  const attrs = item.attributes || {};
  if (attrs.cgc_grade || attrs.publisher || attrs.issue_number) return '📚';
  if (attrs.grading_company || attrs.card_number || attrs.rarity) return '🃏';
  if (attrs.platform || attrs.completeness) return '🎮';
  if (attrs.designer || attrs.player_count || attrs.play_time) return '🎲';
  if (attrs.format || attrs.aspect_ratio) return '🎬';
  return '📄';
}

function UnifiedExplorerTreeItem({ item, collectionId }: { item: ItemRecord; collectionId: number }) {
  const ctx = useTreeContext();
  const [isOpen, setIsOpen] = useState(true);
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const isSelected = ctx.selectedItemId === item.id;
  const hasSubItems = item.children && item.children.length > 0;
  const typeIcon = getItemTypeIcon(item);

  const handleGearMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    
    const menuHeight = 175;
    const bottomNavReserve = 64;
    const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;
    
    let calculatedTop = Math.round(rect.top - 4);
    if (calculatedTop > maxAllowedTop) calculatedTop = Math.max(16, maxAllowedTop);
    
    setMenuCoords({ top: calculatedTop, left: Math.round(rect.right + 6) });
    setIsMenuOpen(true);
  };
  
  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsMenuOpen(false), 350);
  };

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => ctx.onSelectItem(item, collectionId)}
        title={item.name}
        className={`group flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0 ${
          isSelected
            ? 'bg-accent-primary/25 text-content-primary font-medium border border-accent-primary/40'
            : 'text-content-muted hover:bg-surface-hover/60 hover:text-content-secondary'
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
            !hasSubItems && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-[13px] leading-none shrink-0 select-none">
          {typeIcon}
        </span>

        <span className={`text-[13px] tracking-tight truncate shrink min-w-0 ${isSelected ? 'text-accent-secondary font-medium' : ''}`}>
          {item.name}
        </span>

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
        title="Item Actions"
        titleIcon="📄"
      >
        <button
          type="button"
          onClick={() => {
            ctx.onAddSubItem(collectionId, item.id);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item"
        >
          <span className="w-5 shrink-0 flex items-center justify-center">
            <AddSubItemIcon className="w-3.5 h-3.5 tree-menu-icon-amber group-hover/action:scale-105 transition-transform" />
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium tree-menu-amber-label">Add Sub-Item</span>
            <span className="text-[9px] tree-menu-amber-subtext">Create a nested record</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            ctx.onEditItem(item, collectionId);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">✏️</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium tree-menu-amber-label">Edit Item</span>
            <span className="text-[9px] tree-menu-amber-subtext">Update attributes</span>
          </div>
        </button>

        <div className="my-1 mx-1 tree-menu-divider" />

        <button
          type="button"
          onClick={() => {
            ctx.onDeleteItem(item, collectionId);
            setIsMenuOpen(false);
          }}
          className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item-danger"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">🗑️</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium tree-menu-danger-label">Delete Item</span>
            <span className="text-[9px] tree-menu-danger-subtext">Permanently remove</span>
          </div>
        </button>
      </ExplorerActionMenu>            

      {isOpen && hasSubItems && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 flex flex-col min-w-0">
          {item.children!.map((child) => (
            <UnifiedExplorerTreeItem
              key={`item-${child.id}`}
              item={child}
              collectionId={collectionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// FOLDER COMPONENT
// ==========================================

function UnifiedExplorerTreeFolder({ collection, depth = 0 }: { collection: UnifiedCollectionNode; depth?: number }) {
  const ctx = useTreeContext();
  const isActiveCollection = ctx.activeCollectionId === collection.id;
  const isOpen = ctx.expandedFolderIds?.has(collection.id) ?? false;
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const hasChildren = (collection.subCollections && collection.subCollections.length > 0) || (collection.items && collection.items.length > 0);

  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  const handleGearMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();

    const menuHeight = 215;
    const bottomNavReserve = 64;
    const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;
    
    let calculatedTop = Math.round(rect.top - 4);
    if (calculatedTop > maxAllowedTop) calculatedTop = Math.max(16, maxAllowedTop);
    
    setMenuCoords({ top: calculatedTop, left: Math.round(rect.right + 6) });
    setIsMenuOpen(true);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsMenuOpen(false), 350);
  };

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => ctx.onSelectCollection(collection.id)}
        title={`Folder: ${collection.name}`}
        style={{ top: `${stickyTop}px`, zIndex: stickyZIndex }}
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
            ctx.onToggleFolder?.(collection.id, !isOpen);
          }}
          className={[
            'flex items-center justify-center w-4 h-4 shrink-0',
            'text-content-muted hover:text-content-primary',
            'cursor-pointer transition',
            !hasChildren && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-sm text-amber-400 shrink-0 select-none">
          {isOpen ? '📂' : '📁'}
        </span>

        <span title={`Folder: ${collection.name}`} className="text-[13px] tracking-tight font-medium truncate shrink min-w-0">
          {collection.name}
        </span>

        {Boolean(collection.items && collection.items.length > 0) && (
          <span
            title={`${collection.items.length} ${collection.items.length === 1 ? 'item' : 'items'}`}
            className="px-1.5 py-0.2 rounded text-[10px] font-mono text-content-muted bg-surface-hover/60 border border-border-subtle/50 shrink-0 select-none"
          >
            {collection.items.length}
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
            ctx.onAddSubCollection(collection.id);
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
            ctx.onAddSubItem(collection.id, null);
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
            ctx.onEditCollection(collection);
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
            ctx.onDeleteCollection(collection);
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
              depth={depth + 1}
            />
          ))}

          {collection.items?.map((item) => (
            <UnifiedExplorerTreeItem
              key={`item-${item.id}`}
              item={item}
              collectionId={collection.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROOT PROVIDER (EXPORT)
// ==========================================

export default function UnifiedExplorerTree({
  collection,
  ...contextProps
}: UnifiedExplorerTreeProps) {
  return (
    <TreeContext.Provider value={contextProps}>
      <UnifiedExplorerTreeFolder collection={collection} depth={0} />
    </TreeContext.Provider>
  );
}