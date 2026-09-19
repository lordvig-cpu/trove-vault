'use client';

import React, { useState } from 'react';
import { ItemRecord } from '@/types/item';
import { GearIcon } from '@/components/icons/ActionIcons';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import { useExplorerSelection } from '@/context/ExplorerSelectionContext';
import ExplorerCollectionActionMenu from '@/components/ExplorerCollectionActionMenu';
import ExplorerTemplateActionMenu from '@/components/ExplorerTemplateActionMenu';
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
  treeType?: 'items' | 'collections' | 'templates';
}

/* ==========================================================================
   2. ITEM ROW
   ========================================================================== */

const CHUNK_SIZE = 50;

function getItemTypeIcon(item: ItemRecord): string {
  const attrs = item.attributes || {};
  if (attrs.cgc_grade || attrs.publisher || attrs.issue_number) return '📚';
  if (attrs.grading_company || attrs.card_number || attrs.rarity) return '🃏';
  if (attrs.platform || attrs.completeness) return '🎮';
  if (attrs.designer || attrs.player_count || attrs.play_time) return '🎲';
  if (attrs.format || attrs.aspect_ratio) return '🎬';
  return '📄';
}

function ExplorerLoadMoreNode({
  remainingCount,
  onLoadMore,
}: {
  remainingCount: number;
  onLoadMore: () => void;
}) {
  const nextCount = Math.min(CHUNK_SIZE, remainingCount);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onLoadMore();
      }}
      className="explorer-tree-load-more group"
      title={`Load ${nextCount} more items (${remainingCount} remaining)`}
    >
      <span className="text-[11px] font-bold transition-transform duration-200 group-hover:translate-y-0.5 select-none">
        ⇣
      </span>
      <span className="truncate">Load {nextCount} more...</span>
      <span className="ml-auto text-[10px] opacity-75 font-mono shrink-0 select-none">
        ({remainingCount} left)
      </span>
    </button>
  );
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
  const { selectedItemId, searchHighlight, onSelectItem, position = 'left' } = useExplorerSelection();
  const isRightSide = position === 'right';
  const [isOpen, setIsOpen] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(CHUNK_SIZE);
  const menu = useExplorerActionMenu(`item-${item.id}`, 215, position);
  const isSelected = (searchHighlight?.itemId ?? selectedItemId) === item.id;
  const effectiveIsOpen = isOpen || !!searchHighlight?.ancestorItemIds.has(item.id);
  const childrenList = item.children || [];
  const hasSubItems = childrenList.length > 0;
  const visibleChildren = searchHighlight ? childrenList : childrenList.slice(0, displayLimit);
  const remainingChildren = childrenList.length - visibleChildren.length;
  const typeIcon = getItemTypeIcon(item);

  const gearElement = (
    <div className={`transition shrink-0 ${isRightSide ? 'absolute left-2' : 'relative ml-auto'}`}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Open actions"
        aria-expanded={menu.isMenuOpen}
        onKeyDown={menu.handleGearKeyDown}
        onClick={event => { event.stopPropagation(); menu.handleGearMouseEnter(event); }}
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
  );

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectItem(item, collectionId)}
        title={item.name}
        style={isRightSide ? { paddingLeft: depth * 24.5 + 44 } : undefined}
        className={[
          'group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'explorer-tree-item-selected font-medium'
            : 'explorer-tree-item',
        ].join(' ')}
      >
        {isRightSide && gearElement}

        <button
          type="button"
          aria-label={effectiveIsOpen ? "Collapse item" : "Expand item"}
          aria-expanded={hasSubItems ? effectiveIsOpen : undefined}
          disabled={!hasSubItems}
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={[
            'flex items-center justify-center w-3.5 h-3.5 shrink-0',
            'text-[9px] explorer-tree-muted',
            'cursor-pointer transition select-none',
            !hasSubItems && 'explorer-tree-hidden pointer-events-none cursor-default',
          ].filter(Boolean).join(' ')}
          title={effectiveIsOpen ? 'Collapse item' : 'Expand item'}
        >
          {effectiveIsOpen ? '▼' : '▶\uFE0E'}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-xs opacity-80 shrink-0 select-none">
          {typeIcon}
        </span>

        <span className="text-[13px] tracking-tight truncate flex-1 min-w-0">
          {item.name}
        </span>

        {childrenList.length > 0 && (
          <span
            title={`${childrenList.length} sub-items`}
            className={`explorer-tree-badge px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 select-none ${
              isRightSide ? 'ml-auto' : ''
            }`}
          >
            {childrenList.length}
          </span>
        )}

        {!isRightSide && gearElement}
      </div>

      <ExplorerItemActionMenu
        item={item}
        collectionId={collectionId}
        menu={menu}
        position={position}
      />

      {effectiveIsOpen && hasSubItems && (
        <div className={`explorer-tree-branch space-y-0.5 my-0.5 flex flex-col min-w-0 ${isRightSide ? '' : 'border-l ml-[13.5px] pl-2.5'}`}>
          {visibleChildren.map((child) => (
            <UnifiedExplorerTreeItem
              key={`subitem-${child.id}`}
              item={child}
              collectionId={collectionId}
              depth={depth + 1}
            />
          ))}
          {remainingChildren > 0 && (
            <ExplorerLoadMoreNode
              remainingCount={remainingChildren}
              onLoadMore={() => setDisplayLimit((prev) => prev + CHUNK_SIZE)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   3. COLLECTION / CATEGORY / TEMPLATE ROW
   ========================================================================== */

export default function UnifiedExplorerTree({
  collection,
  depth = 0,
  treeType = 'items',
}: UnifiedExplorerTreeProps) {
  const {
    activeCollectionId,
    searchHighlight,
    expandedCategoryIds,
    onToggleCategory,
    onSelectCollection,
    position = 'left',
  } = useExplorerSelection();
  const isRightSide = position === 'right';
  const menu = useExplorerActionMenu(`node-${collection.id}`, 240, position);
  const [displayLimit, setDisplayLimit] = useState(CHUNK_SIZE);

  const isVirtualCategory = collection.id < 0;
  const effectiveCollectionId =
    collection.id === STANDALONE_COLLECTION_ID ? null : collection.id;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);
  const localIsOpen = expandedCategoryIds?.has(collection.id) ?? uncontrolledOpen;

  const rawItems = collection.items || [];
  const rawSubCollections = collection.subCollections || [];
  const hasChildren = rawSubCollections.length > 0 || rawItems.length > 0;
  const visibleItems = searchHighlight ? rawItems : rawItems.slice(0, displayLimit);
  const remainingItems = rawItems.length - visibleItems.length;

  const isActiveCollection = searchHighlight
    ? searchHighlight.collectionIds.has(collection.id)
    : activeCollectionId === collection.id;
  const stickyTop = depth * 28;
  const stickyZIndex = 20 - depth;

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const nextState = !localIsOpen;
    setUncontrolledOpen(nextState);
    onToggleCategory?.(collection.id, nextState);
  };

  const gearElement = (
    <div className={`transition shrink-0 ${isRightSide ? 'absolute left-2' : 'relative ml-auto'}`}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Open actions"
        aria-expanded={menu.isMenuOpen}
        onKeyDown={menu.handleGearKeyDown}
        onClick={event => { event.stopPropagation(); menu.handleGearMouseEnter(event); }}
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
  );

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectCollection(collection.id)}
        title={`${treeType === 'templates' ? 'Template' : isVirtualCategory ? 'Category' : 'Collection'}: ${collection.name}`}
        style={{ top: `${stickyTop}px`, zIndex: stickyZIndex, ...(isRightSide ? { paddingLeft: depth * 24.5 + 44 } : {}) }}
        className={[
          'group flex items-center h-8 px-2 gap-1.5 cursor-pointer transition w-full min-w-0 explorer-category-sticky-header',
          isActiveCollection
            ? 'explorer-category-row-active font-medium'
            : 'explorer-category-row',
        ].join(' ')}
      >
        {isRightSide && gearElement}

        <button
          type="button"
          aria-expanded={hasChildren ? localIsOpen : undefined}
          disabled={!hasChildren}
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

        <button
          type="button"
          aria-label={collection.name}
          aria-pressed={isActiveCollection}
          onClick={event => { event.stopPropagation(); onSelectCollection(collection.id); }}
          title={`${treeType === 'templates' ? 'Template' : isVirtualCategory ? 'Category' : 'Collection'}: ${collection.name}`}
          className="text-left cursor-pointer text-[13px] tracking-tight font-medium truncate shrink min-w-0"
        >
          {collection.name}
        </button>

        {collection.items?.length ? (
          <span
            title={`${collection.items.length} ${collection.items.length === 1 ? 'item' : 'items'}`}
            className={`explorer-tree-badge px-2 py-0.5 rounded-full text-[10.5px] font-mono shrink-0 select-none ${
              isRightSide ? 'ml-auto' : ''
            }`}
          >
            {collection.items.length}
          </span>
        ) : null}

        {!isRightSide && gearElement}
      </div>

      {treeType === 'templates' ? (
        <ExplorerTemplateActionMenu
          template={collection}
          menu={menu}
          position={position}
        />
      ) : (
        <ExplorerCollectionActionMenu
          collection={collection}
          isVirtualCategory={isVirtualCategory}
          menu={menu}
          position={position}
        />
      )}

      {localIsOpen && hasChildren && (
        <div className={`explorer-tree-branch space-y-0.5 my-0.5 flex flex-col min-w-0 ${isRightSide ? '' : 'border-l ml-[13.5px] pl-2.5'}`}>
          {rawSubCollections.map((subCollection) => (
            <UnifiedExplorerTree
              key={`col-${subCollection.id}`}
              collection={subCollection}
              depth={depth + 1}
              treeType={treeType}
            />
          ))}
          {visibleItems.map((item) => (
            <UnifiedExplorerTreeItem
              key={`item-${item.id}`}
              item={item}
              collectionId={effectiveCollectionId}
              depth={depth + 1}
            />
          ))}
          {remainingItems > 0 && (
            <ExplorerLoadMoreNode
              remainingCount={remainingItems}
              onLoadMore={() => setDisplayLimit((prev) => prev + CHUNK_SIZE)}
            />
          )}
        </div>
      )}
    </div>
  );
}
