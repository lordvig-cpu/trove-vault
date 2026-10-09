'use client';

import React, { useState } from 'react';
import { ItemRecord } from '@/types/item';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { useTreeSelection } from '@/context/TreeSelectionContext';
import TreeCollectionActionMenu from '@/components/TreeCollectionActionMenu';
import TreeTemplateActionMenu from '@/components/TreeTemplateActionMenu';
import TreeItemActionMenu from '@/components/TreeItemActionMenu';
import { STANDALONE_COLLECTION_ID } from '@/lib/treeUtils';
import { CollectionRecord } from '@/types/collection';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/PanelIcons';
import { FileIcon, FolderIcon } from '@/components/icons/ContentIcons';
import TreeGearButton from '@/components/TreeGearButton';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface UnifiedCollectionNode extends CollectionRecord {
  items: ItemRecord[];
  subCollections: UnifiedCollectionNode[];
}

export interface UnifiedTreeProps {
  collection: UnifiedCollectionNode;
  depth?: number;
  treeType?: 'items' | 'collections' | 'templates';
}

/* ==========================================================================
   2. ITEM ROW
   ========================================================================== */

const CHUNK_SIZE = 50;

function TreeLoadMoreNode({
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
      className="tree-load-more group"
      title={`Load ${nextCount} more items (${remainingCount} remaining)`}
    >
      <span className="text-[11px] font-bold transition-transform duration-200 group-hover:translate-y-0.5 select-none">
        <ChevronDownIcon className="w-3 h-3" />
      </span>
      <span className="truncate">Load {nextCount} more...</span>
      <span className="ml-auto text-[10px] opacity-75 font-mono shrink-0 select-none">
        ({remainingCount} left)
      </span>
    </button>
  );
}

function UnifiedTreeItem({
  item,
  collectionId,
  depth = 0,
}: {
  item: ItemRecord;
  collectionId: number | null;
  depth: number;
}) {
  const { selectedItemId, searchHighlight, onSelectItem, position = 'left', templateIcons } = useTreeSelection();
  const isRightSide = position === 'right';
  const [isOpen, setIsOpen] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(CHUNK_SIZE);
  // 280px: the item flyout is the wide two-tab shell (menuShellXWide), which a right-docked panel opens leftward by
  const menu = useTreeActionMenu(`item-${item.id}`, 215, position, 280);
  const isSelected = (searchHighlight?.itemId ?? selectedItemId) === item.id;
  const effectiveIsOpen = isOpen || !!searchHighlight?.ancestorItemIds.has(item.id);
  const childrenList = item.children || [];
  const hasSubItems = childrenList.length > 0;
  const visibleChildren = searchHighlight ? childrenList : childrenList.slice(0, displayLimit);
  const remainingChildren = childrenList.length - visibleChildren.length;
  // The item's template icon (user data), or a plain file icon for an item with no template
  const typeIcon = (item.template_id != null && templateIcons?.get(item.template_id)) || <FileIcon className="w-3.5 h-3.5" />;

  const gearElement = (
    <div className={`transition shrink-0 ${isRightSide ? 'absolute left-2' : 'relative ml-auto'}`}>
      <TreeGearButton menu={menu} label="Open actions" />
    </div>
  );

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectItem(item, collectionId)}
        onContextMenu={menu.handleRowContextMenu}
        title={item.name}
        style={isRightSide ? { paddingLeft: depth * 24.5 + 44 } : undefined}
        className={[
          'group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'tree-item-selected font-medium'
            : 'tree-item',
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
            'text-[9px] tree-muted',
            'cursor-pointer transition select-none',
            !hasSubItems && 'tree-hidden pointer-events-none cursor-default',
          ].filter(Boolean).join(' ')}
          title={effectiveIsOpen ? 'Collapse item' : 'Expand item'}
        >
          {effectiveIsOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
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
            className={`tree-badge px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 select-none ${
              isRightSide ? 'ml-auto' : ''
            }`}
          >
            {childrenList.length}
          </span>
        )}

        {!isRightSide && gearElement}
      </div>

      <TreeItemActionMenu
        item={item}
        collectionId={collectionId}
        menu={menu}
        position={position}
      />

      {effectiveIsOpen && hasSubItems && (
        <div className={`tree-branch space-y-0.5 my-0.5 flex flex-col min-w-0 relative ${isRightSide ? '' : 'border-l ml-[13.5px] pl-2.5'}`}>
          {/* Left-docked indents by nesting this wrapper (ml/pl), so its own border-l is the
              continuous guide for this depth -- 16px left of each child row's own chevron (10px
              wrapper pl-2.5 + 6px row px-1.5). Right-docked rows carry their own absolute
              depth-based paddingLeft instead (no nested pl to reuse), so the guide is a full-height
              overlay at that child chevron x minus that same 16px, one continuous line per depth. */}
          {isRightSide && (
            <div
              aria-hidden="true"
              className="tree-branch absolute top-0 bottom-0 border-l pointer-events-none"
              style={{ left: depth * 24.5 + 52.5 }}
            />
          )}
          {visibleChildren.map((child) => (
            <UnifiedTreeItem
              key={`subitem-${child.id}`}
              item={child}
              collectionId={collectionId}
              depth={depth + 1}
            />
          ))}
          {remainingChildren > 0 && (
            <TreeLoadMoreNode
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

export default function UnifiedTree({
  collection,
  depth = 0,
  treeType = 'items',
}: UnifiedTreeProps) {
  const {
    activeCollectionId,
    searchHighlight,
    expandedCategoryIds,
    onToggleCategory,
    onSelectCollection,
    position = 'left',
  } = useTreeSelection();
  const isRightSide = position === 'right';
  const [displayLimit, setDisplayLimit] = useState(CHUNK_SIZE);

  const isVirtualCategory = collection.id < 0;
  // Collection and template flyouts are the wide two-tab shell; a category's (Actions only) is the narrow one
  const menu = useTreeActionMenu(`node-${collection.id}`, 240, position, treeType === 'templates' || !isVirtualCategory ? 280 : 224);
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
      <TreeGearButton menu={menu} label="Open actions" />
    </div>
  );

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectCollection(collection.id)}
        onContextMenu={menu.handleRowContextMenu}
        title={`${treeType === 'templates' ? 'Template' : isVirtualCategory ? 'Category' : 'Collection'}: ${collection.name}`}
        style={{ top: `${stickyTop}px`, zIndex: stickyZIndex, ...(isRightSide ? { paddingLeft: depth * 24.5 + 44 } : {}) }}
        className={[
          'group flex items-center h-8 px-2 gap-1.5 cursor-pointer transition w-full min-w-0 tree-category-sticky-header',
          isActiveCollection
            ? 'tree-category-row-active font-medium'
            : 'tree-category-row',
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
            'text-[9px] tree-muted',
            'cursor-pointer transition select-none',
            !hasChildren && 'tree-hidden pointer-events-none cursor-default',
          ].filter(Boolean).join(' ')}
          title={localIsOpen ? 'Collapse category' : 'Expand category'}
        >
          {localIsOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>

        <span className="w-4 h-4 flex items-center justify-center text-sm tree-category-icon shrink-0 select-none">
          {collection.icon || <FolderIcon className="w-3.5 h-3.5" />}
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
            className={`tree-badge px-2 py-0.5 rounded-full text-[10.5px] font-mono shrink-0 select-none ${
              isRightSide ? 'ml-auto' : ''
            }`}
          >
            {collection.items.length}
          </span>
        ) : null}

        {!isRightSide && gearElement}
      </div>

      {treeType === 'templates' ? (
        <TreeTemplateActionMenu
          template={collection}
          menu={menu}
          position={position}
        />
      ) : (
        <TreeCollectionActionMenu
          collection={collection}
          isVirtualCategory={isVirtualCategory}
          menu={menu}
          position={position}
        />
      )}

      {localIsOpen && hasChildren && (
        <div className={`tree-branch space-y-0.5 my-0.5 flex flex-col min-w-0 relative ${isRightSide ? '' : 'border-l ml-[13.5px] pl-2.5'}`}>
          {/* See the matching comment in UnifiedTreeItem above. */}
          {isRightSide && (
            <div
              aria-hidden="true"
              className="tree-branch absolute top-0 bottom-0 border-l pointer-events-none"
              style={{ left: depth * 24.5 + 52.5 }}
            />
          )}
          {rawSubCollections.map((subCollection) => (
            <UnifiedTree
              key={`col-${subCollection.id}`}
              collection={subCollection}
              depth={depth + 1}
              treeType={treeType}
            />
          ))}
          {visibleItems.map((item) => (
            <UnifiedTreeItem
              key={`item-${item.id}`}
              item={item}
              collectionId={effectiveCollectionId}
              depth={depth + 1}
            />
          ))}
          {remainingItems > 0 && (
            <TreeLoadMoreNode
              remainingCount={remainingItems}
              onLoadMore={() => setDisplayLimit((prev) => prev + CHUNK_SIZE)}
            />
          )}
        </div>
      )}
    </div>
  );
}
