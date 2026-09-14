'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import { useExplorerActions } from '@/context/ExplorerActionsContext';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import ExplorerActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
} from '@/components/ExplorerActionMenu';

interface ExplorerCollectionActionMenuProps {
  collection: CollectionRecord;
  isVirtualCategory: boolean;
  menu: ReturnType<typeof useExplorerActionMenu>;
}

export default function ExplorerCollectionActionMenu({
  collection,
  isVirtualCategory,
  menu,
}: ExplorerCollectionActionMenuProps) {
  const {
    onAddSubItem,
    onEditTemplate,
    onRenameCollection,
    onDeleteCollection,
    onEditCollection,
    onAddSubCollection,
  } = useExplorerActions();

  if (isVirtualCategory) {
    return (
      <ExplorerActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        title="Category Actions"
        titleIcon="🏷️"
      >
        <ActionMenuItem
          icon={<span>📄</span>}
          label="New Item"
          subtext="Add record to this category"
          onClick={() => {
            onAddSubItem(collection.id, null);
            menu.closeMenu();
          }}
        />
        <ActionMenuItem
          icon={<span>⚙️</span>}
          label="Edit Item Template"
          subtext="Manage attributes & schema"
          onClick={() => {
            onEditTemplate?.(collection.id);
            menu.closeMenu();
          }}
        />
      </ExplorerActionMenu>
    );
  }

  return (
    <ExplorerActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      title="Collection Actions"
      titleIcon="📁"
    >
      <ActionMenuItem
        icon={<span>📄</span>}
        label="New Item"
        subtext="Create item in this collection"
        onClick={() => {
          onAddSubItem(collection.id, null);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<span>📥</span>}
        label="Add Existing Item"
        subtext="Link catalog item here"
        onClick={() => {
          console.log('Add Existing Item to collection:', collection.id);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<span>🏷️</span>}
        label="Rename Collection"
        subtext="Inline edit title"
        onClick={() => menu.setIsRenaming((previous: boolean) => !previous)}
      />

      {menu.isRenaming && (
        <ActionMenuRenameForm
          initialValue={collection.name}
          onSave={async (nextName) => {
            await onRenameCollection?.(collection.id, nextName);
            menu.closeMenu();
          }}
          onCancel={() => menu.setIsRenaming(false)}
        />
      )}

      {onEditCollection && (
        <ActionMenuItem
          icon={<span>⚙️</span>}
          label="Collection Settings"
          subtext="Manage collection metadata"
          onClick={() => {
            onEditCollection(collection);
            menu.closeMenu();
          }}
        />
      )}

      {onAddSubCollection && (
        <ActionMenuItem
          icon={<span>📁</span>}
          label="New Sub-Collection"
          subtext="Create a nested collection"
          onClick={() => {
            onAddSubCollection(collection.id);
            menu.closeMenu();
          }}
        />
      )}

      <ActionMenuDivider />

      {onDeleteCollection && (
        <ActionMenuDangerItem
          icon={<span>🗑️</span>}
          label="Delete Collection"
          subtext="Permanently remove"
          onClick={() => {
            onDeleteCollection(collection);
            menu.closeMenu();
          }}
        />
      )}
    </ExplorerActionMenu>
  );
}
