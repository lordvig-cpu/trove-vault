'use client';

import React, { useEffect, useState } from 'react';
import { ItemRecord } from '@/types/item';
import { GearIcon } from '@/components/icons/ActionIcons';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/ExplorerIcons';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import { useExplorerSelection } from '@/context/ExplorerSelectionContext';
import ExplorerCollectionActionMenu from '@/components/ExplorerCollectionActionMenu';
import ExplorerItemActionMenu from '@/components/ExplorerItemActionMenu';
import { STANDALONE_COLLECTION_ID } from '@/lib/explorerUtils';
import { CollectionRecord } from '@/types/collection';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface UnifiedCollectionNode extends CollectionRecord {
  items: ItemRecord[];
  subCollections: UnifiedCollectionNode[];
}

export interface UnifiedExplorerTreeProps {
  collection: UnifiedCollectionNode;
  depth?: number;
}

/* ==========================================================================
   2. ITEM ROW
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
  depth = 0,
}: {
  item: ItemRecord;
  collectionId: number | null;
  depth: number;
}) {
  const { selectedItemId, onSelectItem } = useExplorerSelection();
  const [isOpen, setIsOpen] = useState(true);
  const menu = useExplorerActionMenu(`item-${item.id}`, 215);
  const isSelected = selectedItemId === item.id;
  const hasSubItems = Boolean(item.children && item.children.length > 0);
  const typeIcon = getItemTypeIcon(item);

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectItem(item, collectionId)}
        title={item.name}
        className={[
          'group flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'explorer-tree-item-selected font-medium'
            : 'explorer-tree-item',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={[
            'flex items-center justify-center w-4 h-4 shrink-0',
            'explorer-tree-muted transition',
            !hasSubItems && 'tree-chevron-leaf',
          ].filter(Boolean).join(' ')}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-[13px] leading-none shrink-0 select-none">
          {typeIcon}
        </span>

        <span
          title={item.name}
          className={[
            'text-[13px] tracking-tight truncate shrink min-w-0',
            isSelected ? 'explorer-tree-item-selected-name font-medium' : '',
          ].join(' ')}
        >
          {item.name}
        </span>

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
                  ? 'explorer-tree-gear-open rotate-90'
                  : 'explorer-tree-gear-closed',
              ].join(' ')}
            />
          </div>
        </div>
      </div>

      <ExplorerItemActionMenu item={item} collectionId={collectionId} menu={menu} />

      {isOpen && hasSubItems && (
        <div className="explorer-tree-branch border-l space-y-0.5 ml-[13.5px] pl-2.5 my-0.5 flex flex-col min-w-0">
          {item.children?.map((child) => (
            <UnifiedExplorerTreeItem
              key={`subitem-${child.id}`}
              item={child}
              collectionId={collectionId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   3. COLLECTION / CATEGORY ROW
   ========================================================================== */

export default function UnifiedExplorerTree({
  collection,
  depth = 0,
}: UnifiedExplorerTreeProps) {
  const {
    activeCollectionId,
    expandedCategoryIds,
    onToggleCategory,
    onSelectCollection,
  } = useExplorerSelection();
  const menu = useExplorerActionMenu(`node-${collection.id}`, 240);

  const isVirtualCategory = collection.id < 0;
  const effectiveCollectionId =
    collection.id === STANDALONE_COLLECTION_ID ? null : collection.id;
  const [localIsOpen, setLocalIsOpen] = useState(
    expandedCategoryIds ? expandedCategoryIds.has(collection.id) : true
  );

  useEffect(() => {
    if (expandedCategoryIds !== undefined) {
      setLocalIsOpen(expandedCategoryIds.has(collection.id));
    }
  }, [expandedCategoryIds, collection.id]);

  const hasChildren =
    Boolean(collection.subCollections?.length) || Boolean(collection.items?.length);
  const isActiveCollection = activeCollectionId === collection.id;
  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const nextState = !localIsOpen;
    setLocalIsOpen(nextState);
    onToggleCategory?.(collection.id, nextState);
  };

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectCollection(collection.id)}
        title={`${isVirtualCategory ? 'Category' : 'Collection'}: ${collection.name}`}
        style={{ top: `${stickyTop}px`, zIndex: stickyZIndex }}
        className={[
          'group flex items-center h-8 px-2 gap-1.5 cursor-pointer transition w-full min-w-0 explorer-category-sticky-header',
          isActiveCollection
            ? 'explorer-category-row-active font-medium'
            : 'explorer-category-row',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={handleToggle}
          className={[
            'flex items-center justify-center w-4 h-4 shrink-0',
            'text-[9px] explorer-tree-muted',
            'cursor-pointer transition select-none',
            !hasChildren && 'explorer-tree-hidden pointer-events-none cursor-default',
          ].filter(Boolean).join(' ')}
          title={localIsOpen ? 'Collapse category' : 'Expand category'}
        >
          {localIsOpen ? '▼' : '▶\uFE0E'}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-sm explorer-category-icon shrink-0 select-none">
          {collection.icon || (localIsOpen ? '📂' : '📁')}
        </span>

        <span
          title={`${isVirtualCategory ? 'Category' : 'Collection'}: ${collection.name}`}
          className="text-[13px] tracking-tight font-medium truncate shrink min-w-0"
        >
          {collection.name}
        </span>

        {collection.items?.length ? (
          <span
            title={`${collection.items.length} ${collection.items.length === 1 ? 'item' : 'items'}`}
            className="explorer-tree-badge px-2 py-0.5 rounded-full text-[10.5px] font-mono shrink-0 select-none"
          >
            {collection.items.length}
          </span>
        ) : null}

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
                  ? 'explorer-tree-primary rotate-90'
                  : 'explorer-tree-action-icon',
              ].join(' ')}
            />
          </div>
        </div>
      </div>

      <ExplorerCollectionActionMenu
        collection={collection}
        isVirtualCategory={isVirtualCategory}
        menu={menu}
      />

      {localIsOpen && hasChildren && (
        <div className="explorer-tree-branch border-l space-y-0.5 ml-[13.5px] pl-2.5 my-0.5 flex flex-col min-w-0">
          {collection.subCollections?.map((subCollection) => (
            <UnifiedExplorerTree
              key={`col-${subCollection.id}`}
              collection={subCollection}
              depth={depth + 1}
            />
          ))}
          {collection.items?.map((item) => (
            <UnifiedExplorerTreeItem
              key={`item-${item.id}`}
              item={item}
              collectionId={effectiveCollectionId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
