'use client';

import React, { useState, createContext, useContext } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { GearIcon, AddSubItemIcon } from '@/components/icons/ActionIcons';
import ExplorerActionMenu, {
  ActionMenuItem,
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuRenameForm,
} from '@/components/ExplorerActionMenu';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/ExplorerIcons';
import { useActionMenu } from '@/hooks/useActionMenu';

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
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onAddSubCollection?: (parentCollectionId: number) => void;
  onEditCollection?: (collection: CollectionRecord) => void;
  onRenameCollection?: (id: number, nextName: string) => Promise<void> | void;
  onDeleteCollection?: (collection: CollectionRecord) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onRenameItem?: (id: number, nextName: string) => Promise<void> | void;
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

function getItemTypeIcon(item: ItemRecord): string {
  const attrs = item.attributes || {};
  if (attrs.cgc_grade || attrs.publisher || attrs.issue_number) return '📚';
  if (attrs.grading_company || attrs.card_number || attrs.rarity) return '🃏';
  if (attrs.platform || attrs.completeness) return '🎮';
  if (attrs.designer || attrs.player_count || attrs.play_time) return '🎲';
  if (attrs.format || attrs.aspect_ratio) return '🎬';
  return '📄';
}

// ==========================================
// ITEM COMPONENT
// ==========================================

function UnifiedExplorerTreeItem({ item, collectionId }: { item: ItemRecord; collectionId: number }) {
  const ctx = useTreeContext();
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = ctx.selectedItemId === item.id;
  const hasSubItems = item.children && item.children.length > 0;
  const typeIcon = getItemTypeIcon(item);

  const menu = useActionMenu(`item-${item.id}`, 215);

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
            'text-content-muted hover:text-content-primary cursor-pointer transition',
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
            onMouseEnter={(e) => menu.handleGearMouseEnter(e, menu.isRenaming ? 257 : 215)}
            onMouseLeave={menu.handleMouseLeave}
            className={`group/gear flex items-center justify-center w-6 h-6 shrink-0 rounded border border-transparent cursor-pointer transition-colors ${
              menu.isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger'
            }`}
          >
            <GearIcon
              isActive={menu.isMenuOpen}
              className={`w-[15px] h-[15px] transition-all duration-300 ease-out ${
                menu.isMenuOpen ? 'text-white rotate-90' : 'text-content-muted group-hover/gear:text-content-primary'
              }`}
            />
          </div>
        </div>
      </div>

      <ExplorerActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        title="Item Actions"
        titleIcon="📄"
      >
        <ActionMenuItem
          icon={<AddSubItemIcon className="w-3.5 h-3.5 text-content-muted group-hover/action:text-content-primary" />}
          label="Add Sub-Item"
          subtext="Create a nested record"
          onClick={() => {
            ctx.onAddSubItem(collectionId, item.id);
            menu.closeMenu();
          }}
        />

        <ActionMenuItem
          icon="🏷️"
          label="Rename Item"
          subtext="Update name"
          onClick={() => menu.setIsRenaming((prev) => !prev)}
        />

        {menu.isRenaming && (
          <ActionMenuRenameForm
            initialValue={item.name}
            onSave={async (val) => {
              await ctx.onRenameItem?.(item.id, val);
              menu.closeMenu();
            }}
            onCancel={() => menu.setIsRenaming(false)}
          />
        )}

        <ActionMenuItem
          icon="✏️"
          label="Edit Item"
          subtext="Open Item Details"
          onClick={() => {
            ctx.onEditItem(item, collectionId);
            menu.closeMenu();
          }}
        />

        <ActionMenuDivider />

        <ActionMenuDangerItem
          icon="🗑️"
          label="Delete Item"
          subtext="Permanently remove"
          onClick={() => {
            ctx.onDeleteItem(item, collectionId);
            menu.closeMenu();
          }}
        />
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
  const hasChildren = (collection.subCollections?.length ?? 0) > 0 || (collection.items?.length ?? 0) > 0;

  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  const menu = useActionMenu(`col-${collection.id}`, 255);

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
            'text-content-muted hover:text-content-primary cursor-pointer transition',
            !hasChildren && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-sm shrink-0 select-none">
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
            onMouseEnter={(e) => menu.handleGearMouseEnter(e, menu.isRenaming ? 297 : 255)}
            onMouseLeave={menu.handleMouseLeave}
            className={`group/gear flex items-center justify-center w-6 h-6 shrink-0 rounded border border-transparent cursor-pointer transition-colors ${
              menu.isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger'
            }`}
          >
            <GearIcon
              isActive={menu.isMenuOpen}
              className={`w-[15px] h-[15px] transition-all duration-300 ease-out ${
                menu.isMenuOpen ? 'text-white rotate-90' : 'text-content-muted group-hover/gear:text-content-primary'
              }`}
            />
          </div>
        </div>
      </div>

      <ExplorerActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        title="Folder Actions"
        titleIcon="📂"
      >
        <ActionMenuItem
          icon="📁"
          label="New Sub-Folder"
          subtext="Create a nested folder"
          onClick={() => {
            ctx.onAddSubCollection?.(collection.id);
            menu.closeMenu();
          }}
        />

        <ActionMenuItem
          icon="📄"
          label="New Item"
          subtext="Add record to this folder"
          onClick={() => {
            ctx.onAddSubItem(collection.id, null);
            menu.closeMenu();
          }}
        />

        <ActionMenuItem
          icon="🏷️"
          label="Rename Folder"
          subtext="Update name"
          onClick={() => menu.setIsRenaming((prev) => !prev)}
        />

        {menu.isRenaming && (
          <ActionMenuRenameForm
            initialValue={collection.name}
            onSave={async (val) => {
              await ctx.onRenameCollection?.(collection.id, val);
              menu.closeMenu();
            }}
            onCancel={() => menu.setIsRenaming(false)}
          />
        )}

        <ActionMenuItem
          icon="✏️"
          label="Edit Folder"
          subtext="Open Folder Details"
          onClick={() => {
            ctx.onEditCollection?.(collection);
            menu.closeMenu();
          }}
        />

        <ActionMenuDivider />

        <ActionMenuDangerItem
          icon="🗑️"
          label="Delete Collection"
          subtext="Permanently remove"
          onClick={() => {
            ctx.onDeleteCollection?.(collection);
            menu.closeMenu();
          }}
        />
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