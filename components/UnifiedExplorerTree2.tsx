'use client';

import React, { useState, useRef } from 'react';
import { CollectionRecord } from '@/types/collection2';
import { ItemRecord } from '@/types/item2';
import { GearIcon, AddSubItemIcon } from '@/components/icons/ActionIcons';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/ExplorerIcons';
import ExplorerActionMenu, {
  ActionMenuItem,
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuRenameForm,
} from '@/components/ExplorerActionMenu2';
import { STANDALONE_COLLECTION_ID } from '@/lib/explorerUtils2';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface UnifiedCollectionNode extends CollectionRecord {
  items: ItemRecord[];
  subCollections: UnifiedCollectionNode[];
}

export interface UnifiedExplorerTreeProps {
  collection: UnifiedCollectionNode;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  depth?: number;
  expandedFolderIds?: Set<number>;
  onToggleFolder?: (folderId: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number | null) => void;
  onAddSubItem: (collectionId: number | null, parentItemId?: number | null) => void;
  onAddSubCollection?: (parentCollectionId: number) => void;
  onEditCollection?: (collection: CollectionRecord) => void;
  onDeleteCollection?: (collection: CollectionRecord) => void;
  onRenameCollection?: (id: number, nextName: string) => Promise<void> | void;
  onEditItem: (item: ItemRecord, collectionId: number | null) => void;
  onRenameItem?: (id: number, nextName: string) => Promise<void> | void;
  onDeleteItem: (item: ItemRecord, collectionId: number | null) => void;
}

/* ==========================================================================
   2. REUSABLE MENU FLYOUT CONTROLLER HOOK
   ========================================================================== */

function useActionMenuLifecycle() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleGearMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();

    const menuHeight = 220;
    const bottomNavReserve = 64;
    const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;

    let calculatedTop = Math.round(rect.top - 4);
    if (calculatedTop > maxAllowedTop) {
      calculatedTop = Math.max(16, maxAllowedTop);
    }

    setMenuCoords({
      top: calculatedTop,
      left: Math.round(rect.right + 6),
    });
    setIsMenuOpen(true);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (isRenaming) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsRenaming(false);
    }, 350);
  };

  const closeMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMenuOpen(false);
    setIsRenaming(false);
  };

  return {
    isMenuOpen,
    menuCoords,
    isRenaming,
    setIsRenaming,
    handleGearMouseEnter,
    handleMenuMouseEnter,
    handleMouseLeave,
    closeMenu,
  };
}

/* ==========================================================================
   3. ITEM ROW SUBCOMPONENT: UnifiedExplorerTreeItem
   ========================================================================== */

function getItemTypeIcon(item: ItemRecord): string {
  const attrs = item.attributes || {};
  if (attrs.cgc_grade || attrs.publisher || attrs.issue_number) return '📚';
  if (attrs.grading_company || attrs.card_number || attrs.rarity) return '🃏';
  if (attrs.platform || attrs.completeness) return '🎮';
  if (attrs.designer || attrs.player_count || attrs.play_time) return '🎲';
  if (attrs.format || attrs.aspect_ratio) return '🎬';
  return '📄';
}

function UnifiedExplorerTreeItem({
  item,
  collectionId,
  selectedItemId,
  depth = 0,
  onSelectItem,
  onAddSubItem,
  onEditItem,
  onRenameItem,
  onDeleteItem,
}: {
  item: ItemRecord;
  collectionId: number | null;
  selectedItemId: number | null;
  depth: number;
  onSelectItem: (item: ItemRecord, collectionId: number | null) => void;
  onAddSubItem: (collectionId: number | null, parentItemId?: number | null) => void;
  onEditItem: (item: ItemRecord, collectionId: number | null) => void;
  onRenameItem?: (id: number, nextName: string) => Promise<void> | void;
  onDeleteItem: (item: ItemRecord, collectionId: number | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const menu = useActionMenuLifecycle();

  const isSelected = selectedItemId === item.id;
  const hasSubItems = Boolean(item.children && item.children.length > 0);
  const typeIcon = getItemTypeIcon(item);

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      {/* Primary Item Row Surface */}
      <div
        onClick={() => onSelectItem(item, collectionId)}
        title={item.name}
        className={[
          'group flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'bg-accent-primary/25 text-content-primary font-medium border border-accent-primary/40'
            : 'text-content-muted hover:bg-surface-hover/60 hover:text-content-secondary',
        ].join(' ')}
      >
        {/* Accordion Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={[
            'flex items-center justify-center w-4 h-4 shrink-0',
            'text-content-muted hover:text-content-primary transition',
            !hasSubItems && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        {/* Category Glyph Icon */}
        <span className="w-4 h-4 flex items-center justify-center text-[13px] leading-none shrink-0 select-none">
          {typeIcon}
        </span>

        {/* Truncated Item Title */}
        <span
          title={item.name}
          className={[
            'text-[13px] tracking-tight truncate shrink min-w-0',
            isSelected ? 'text-accent-secondary font-medium' : '',
          ].join(' ')}
        >
          {item.name}
        </span>

        {/* Action Gear Trigger */}
        <div className="relative transition shrink-0 ml-auto">
          <div
            onMouseEnter={menu.handleGearMouseEnter}
            onMouseLeave={menu.handleMouseLeave}
            className={[
              'group/gear flex items-center justify-center w-6 h-6 shrink-0',
              'rounded border border-transparent cursor-pointer transition-colors',
              menu.isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger',
            ].join(' ')}
          >
            <GearIcon
              isActive={menu.isMenuOpen}
              className={[
                'w-[15px] h-[15px] transition-all duration-300 ease-out',
                menu.isMenuOpen
                  ? 'text-content-primary rotate-90'
                  : 'text-content-muted group-hover/gear:text-content-primary',
              ].join(' ')}
            />
          </div>
        </div>
      </div>

      {/* Item Context Menu Popover Portal */}
      <ExplorerActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        title="Item Actions"
        titleIcon="📄"
      >
        {menu.isRenaming ? (
          <ActionMenuRenameForm
            initialValue={item.name}
            onSave={async (newName) => {
              if (onRenameItem) await onRenameItem(item.id, newName);
              menu.closeMenu();
            }}
            onCancel={() => menu.setIsRenaming(false)}
          />
        ) : (
          <>
            <ActionMenuItem
              icon={<AddSubItemIcon className="w-3.5 h-3.5 text-accent-secondary" />}
              label="Add Sub-Item"
              subtext="Create a nested child record"
              onClick={() => {
                onAddSubItem(collectionId, item.id);
                menu.closeMenu();
              }}
            />

            <ActionMenuItem
              icon={<span>✏️</span>}
              label="Rename Item"
              subtext="Quick inline rename"
              onClick={() => menu.setIsRenaming(true)}
            />

            <ActionMenuItem
              icon={<span>📝</span>}
              label="Edit Properties"
              subtext="Configure detailed attributes"
              onClick={() => {
                onEditItem(item, collectionId);
                menu.closeMenu();
              }}
            />

            <ActionMenuDivider />

            <ActionMenuDangerItem
              icon={<span>🗑️</span>}
              label="Delete Item"
              subtext="Permanently remove record"
              onClick={() => {
                onDeleteItem(item, collectionId);
                menu.closeMenu();
              }}
            />
          </>
        )}
      </ExplorerActionMenu>

      {/* Recursive Sub-Items */}
      {isOpen && hasSubItems && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 flex flex-col min-w-0">
          {item.children?.map((child) => (
            <UnifiedExplorerTreeItem
              key={`subitem-${child.id}`}
              item={child}
              collectionId={collectionId}
              selectedItemId={selectedItemId}
              depth={depth + 1}
              onSelectItem={onSelectItem}
              onAddSubItem={onAddSubItem}
              onEditItem={onEditItem}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   4. MAIN COMPONENT: UnifiedExplorerTree2 (Collection / Folder Root)
   ========================================================================== */

export default function UnifiedExplorerTree2({
  collection,
  activeCollectionId,
  selectedItemId,
  depth = 0,
  expandedFolderIds,
  onToggleFolder,
  onSelectCollection,
  onSelectItem,
  onAddSubItem,
  onAddSubCollection,
  onEditCollection,
  onDeleteCollection,
  onRenameCollection,
  onEditItem,
  onRenameItem,
  onDeleteItem,
}: UnifiedExplorerTreeProps) {
  const menu = useActionMenuLifecycle();

  const isStandalone = collection.id === STANDALONE_COLLECTION_ID;
  const effectiveCollectionId = isStandalone ? null : collection.id;

  const isOpen = expandedFolderIds ? expandedFolderIds.has(collection.id) : true;
  const isActiveCollection = activeCollectionId === collection.id;
  const hasChildren =
    Boolean(collection.subCollections && collection.subCollections.length > 0) ||
    Boolean(collection.items && collection.items.length > 0);

  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      {/* Collection / Folder Row Surface (Sticky Stack) */}
      <div
        onClick={() => onSelectCollection(collection.id)}
        title={`Folder: ${collection.name}`}
        style={{
          top: `${stickyTop}px`,
          zIndex: stickyZIndex,
        }}
        className={[
          'group flex items-center h-7 px-1.5 gap-1.5 cursor-pointer transition w-full min-w-0 explorer-folder-sticky-header',
          isActiveCollection
            ? 'bg-accent-primary/15 text-accent-secondary font-medium'
            : 'text-content-secondary hover:bg-surface-hover/60 hover:text-content-primary',
        ].join(' ')}
      >
        {/* Accordion Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFolder?.(collection.id, !isOpen);
          }}
          className={[
            'flex items-center justify-center w-4 h-4 shrink-0',
            'text-content-muted hover:text-content-primary transition',
            !hasChildren && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        {/* Folder Graphic or Custom Container Icon */}
        <span className="w-4 h-4 flex items-center justify-center text-sm text-amber-400 shrink-0 select-none">
          {collection.icon ? collection.icon : (isOpen ? '📂' : '📁')}
        </span>

        {/* Truncated Folder Name */}
        <span
          title={`Folder: ${collection.name}`}
          className="text-[13px] tracking-tight font-medium truncate shrink min-w-0"
        >
          {collection.name}
        </span>

        {/* Item Count Pill Badge */}
        {Boolean(collection.items && collection.items.length > 0) && (
          <span
            title={`${collection.items.length} ${
              collection.items.length === 1 ? 'item' : 'items'
            }`}
            className="px-1.5 py-0.2 rounded text-[10px] font-mono text-amber-400 bg-surface-hover/60 border border-border-subtle/50 shrink-0 select-none"
          >
            {collection.items.length}
          </span>
        )}

        {/* Action Gear Trigger */}
        <div className="relative transition shrink-0 ml-auto">
          <div
            onMouseEnter={menu.handleGearMouseEnter}
            onMouseLeave={menu.handleMouseLeave}
            className={[
              'group/gear flex items-center justify-center w-6 h-6 shrink-0',
              'rounded border border-transparent cursor-pointer transition-colors',
              menu.isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger',
            ].join(' ')}
          >
            <GearIcon
              isActive={menu.isMenuOpen}
              className={[
                'w-[15px] h-[15px] transition-all duration-300 ease-out',
                menu.isMenuOpen
                  ? 'text-content-primary rotate-90'
                  : 'text-content-muted group-hover/gear:text-content-primary',
              ].join(' ')}
            />
          </div>
        </div>
      </div>

      {/* Folder Context Menu Popover Portal */}
      <ExplorerActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        title={isStandalone ? 'Container Actions' : 'Folder Actions'}
        titleIcon={collection.icon ? collection.icon : '📂'}
      >
        {isStandalone ? (
          <ActionMenuItem
            icon={<span>📄</span>}
            label="New Item"
            subtext="Add standalone item"
            onClick={() => {
              onAddSubItem(null, null);
              menu.closeMenu();
            }}
          />
        ) : menu.isRenaming ? (
          <ActionMenuRenameForm
            initialValue={collection.name}
            onSave={async (newName) => {
              if (onRenameCollection) await onRenameCollection(collection.id, newName);
              menu.closeMenu();
            }}
            onCancel={() => menu.setIsRenaming(false)}
          />
        ) : (
          <>
            {onAddSubCollection && (
              <ActionMenuItem
                icon={<span>📁</span>}
                label="New Sub-Folder"
                subtext="Create a nested collection"
                onClick={() => {
                  onAddSubCollection(collection.id);
                  menu.closeMenu();
                }}
              />
            )}

            <ActionMenuItem
              icon={<span>📄</span>}
              label="New Item"
              subtext="Add record to this folder"
              onClick={() => {
                onAddSubItem(collection.id, null);
                menu.closeMenu();
              }}
            />

            <ActionMenuItem
              icon={<span>✏️</span>}
              label="Rename Folder"
              subtext="Quick inline rename"
              onClick={() => menu.setIsRenaming(true)}
            />

            {onEditCollection && (
              <ActionMenuItem
                icon={<span>⚙️</span>}
                label="Folder Settings"
                subtext="Manage folder templates"
                onClick={() => {
                  onEditCollection(collection);
                  menu.closeMenu();
                }}
              />
            )}

            {onDeleteCollection && (
              <>
                <ActionMenuDivider />
                <ActionMenuDangerItem
                  icon={<span>🗑️</span>}
                  label="Delete Folder"
                  subtext="Remove collection & contents"
                  onClick={() => {
                    onDeleteCollection(collection);
                    menu.closeMenu();
                  }}
                />
              </>
            )}
          </>
        )}
      </ExplorerActionMenu>

      {/* Nested Hierarchy: Sub-Collections and Items */}
      {isOpen && hasChildren && (
        <div className="border-l border-border-subtle space-y-0.5 ml-2 pl-1.5 my-0.5 flex flex-col min-w-0">
          {collection.subCollections?.map((subCol) => (
            <UnifiedExplorerTree2
              key={`col-${subCol.id}`}
              collection={subCol}
              activeCollectionId={activeCollectionId}
              selectedItemId={selectedItemId}
              depth={depth + 1}
              expandedFolderIds={expandedFolderIds}
              onToggleFolder={onToggleFolder}
              onSelectCollection={onSelectCollection}
              onSelectItem={onSelectItem}
              onAddSubItem={onAddSubItem}
              onAddSubCollection={onAddSubCollection}
              onEditCollection={onEditCollection}
              onDeleteCollection={onDeleteCollection}
              onRenameCollection={onRenameCollection}
              onEditItem={onEditItem}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
            />
          ))}

          {collection.items?.map((item) => (
            <UnifiedExplorerTreeItem
              key={`item-${item.id}`}
              item={item}
              collectionId={effectiveCollectionId}
              selectedItemId={selectedItemId}
              depth={depth + 1}
              onSelectItem={onSelectItem}
              onAddSubItem={onAddSubItem}
              onEditItem={onEditItem}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}