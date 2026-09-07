'use client';

import { useState, useRef } from 'react';
import { ItemRecord } from '@/types/item';
import { GearIcon, AddSubItemIcon } from '@/components/icons/ActionIcons';
import ExplorerActionMenu from '@/components/ExplorerActionMenu';

export interface UnifiedExplorerTreeItemProps {
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

export default function UnifiedExplorerTreeItem({
  item,
  collectionId,
  selectedItemId,
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
    
    const menuHeight = 175; // Approximate height of the menu with padding
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
          className={[
            // Layout & Sizing
            'flex items-center justify-center w-4 h-4 shrink-0',
            // Typography & Content
            'text-[9px] text-content-muted hover:text-content-primary',
            // Interaction & Transitions
            'cursor-pointer transition',
            // Dynamic Leaf State
            !hasSubItems && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px]">
              <polygon points="5,8 19,8 12,18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px]">
              <polygon points="8,5 8,19 18,12" />
            </svg>
          )}
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
            className={[
              // Layout & Sizing
              'group/gear flex items-center justify-center w-6 h-6 shrink-0',
              // Surface & Borders
              'rounded border border-transparent',
              // Interaction & Transitions
              'cursor-pointer transition-colors',
              // Menu Open State vs Default Hover State
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
            onAddSubItem(collectionId, item.id);
            setIsMenuOpen(false);
          }}
          className={[
            'group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded',
            'tree-menu-item',
          ].join(' ')}
        >
          <span className="w-5 shrink-0 flex items-center justify-center">
            <AddSubItemIcon
              className={[
                'w-3.5 h-3.5',
                'tree-menu-icon-amber',
                'group-hover/action:scale-105 transition-transform',
              ].join(' ')}
            />
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className={['text-xs font-medium', 'tree-menu-amber-label'].join(' ')}>Add Sub-Item</span>
            <span className={['text-[9px]', 'tree-menu-amber-subtext'].join(' ')}>Create a nested record</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onEditItem(item, collectionId);
            setIsMenuOpen(false);
          }}
          className={[
            'group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded',
            'tree-menu-item',
          ].join(' ')}
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">✏️</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className={['text-xs font-medium', 'tree-menu-amber-label'].join(' ')}>Edit Item</span>
            <span className={['text-[9px]', 'tree-menu-amber-subtext'].join(' ')}>Update attributes</span>
          </div>
        </button>

        <div className={['my-1 mx-1', 'tree-menu-divider'].join(' ')} />

        <button
          type="button"
          onClick={() => {
            onDeleteItem(item, collectionId);
            setIsMenuOpen(false);
          }}
          className={[
            'group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded',
            'tree-menu-item-danger',
          ].join(' ')}
        >
          <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform">🗑️</span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className={['text-xs font-medium', 'tree-menu-danger-label'].join(' ')}>Delete Item</span>
            <span className={['text-[9px]', 'tree-menu-danger-subtext'].join(' ')}>Permanently remove</span>
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