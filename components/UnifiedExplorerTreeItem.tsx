'use client';

import { useState, useRef } from 'react';
import { ItemRecord } from '@/types/item';
import { GearIcon, AddSubItemIcon } from '@/components/icons/ActionIcons';
import ExplorerActionMenu from '@/components/ExplorerActionMenu';

export interface UnifiedExplorerTreeItemProps {
  item: ItemRecord;
  collectionId: number;
  selectedItemId: number | null;
  animationsEnabled?: boolean;
  isPinned?: boolean;
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

export default function UnifiedExplorerTreeItem({
  item,
  collectionId,
  selectedItemId,
  animationsEnabled = true,
  isPinned = true,
  onSelectItem,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: UnifiedExplorerTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const isSelected = selectedItemId === item.id;
  const hasSubItems = item.children && item.children.length > 0;
  const typeIcon = getItemTypeIcon(item);

  const handleGearMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    
    setMenuCoords({ 
      top: Math.round(rect.top - 4), 
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
        onClick={() => onSelectItem(item, collectionId)}
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
          className={`w-4 h-4 flex items-center justify-center text-[9px] text-content-muted hover:text-content-primary transition shrink-0 ${
            !hasSubItems ? 'opacity-0 cursor-default' : ''
          }`}
        >
          {isOpen ? '▼' : '▶'}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-[13px] leading-none shrink-0 select-none">
          {typeIcon}
        </span>

        <span 
          title={item.name}
          className={`text-[13px] tracking-tight truncate shrink min-w-0 ${isSelected ? 'text-accent-secondary font-medium' : ''}`}
        >
          {item.name}
        </span>

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
        title="Item Actions"
        titleIcon="📄"
        animationsEnabled={animationsEnabled}
        isPinned={isPinned}
      >
        <button
          type="button"
          onClick={() => { onAddSubItem(collectionId, item.id); setIsMenuOpen(false); }}
          className="group/action flex items-center gap-2.5 px-3 py-1.5 hover:bg-amber-500/15 text-left transition-all duration-150 w-full rounded"
        >
          <span className="w-5 shrink-0 flex items-center justify-center">
            <AddSubItemIcon className="w-3.5 h-3.5 text-amber-200/90 group-hover/action:text-amber-100 group-hover/action:scale-105 transition-transform" />
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-amber-100 group-hover/action:text-white">Add Sub-Item</span>
            <span className="text-[9px] text-amber-300/60 group-hover/action:text-amber-300/80">Create a nested record</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { onEditItem(item, collectionId); setIsMenuOpen(false); }}
          className="group/action flex items-center gap-2.5 px-3 py-1.5 hover:bg-amber-500/15 text-left transition-all duration-150 w-full rounded"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">
            ✏️
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-amber-100 group-hover/action:text-white">Edit Item</span>
            <span className="text-[9px] text-amber-300/60 group-hover/action:text-amber-300/80">Update attributes</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { onDeleteItem(item, collectionId); setIsMenuOpen(false); }}
          className="group/action flex items-center gap-2.5 px-3 py-1.5 hover:bg-rose-500/15 text-left transition-all duration-150 group/btn border-t border-amber-500/20 mt-1 pt-2 w-full rounded"
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">
            🗑️
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-rose-400 group-hover/btn:text-rose-300">Delete Item</span>
            <span className="text-[9px] text-rose-400/70 group-hover/btn:text-rose-300/80">Permanently remove</span>
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