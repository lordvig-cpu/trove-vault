'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { ActionIcon } from '@/components/icons/LayoutIcons';
import TreeActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
} from '@/components/TreeActionMenu';

interface TreeCollectionActionMenuProps {
  collection: CollectionRecord;
  isVirtualCategory: boolean;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
}

export default function TreeCollectionActionMenu({
  collection,
  isVirtualCategory,
  menu,
  position,
}: TreeCollectionActionMenuProps) {
  const {
    onAddSubItem,
    onEditTemplate,
    onRenameCollection,
    onDeleteCollection,
    onEditCollection,
    onAddSubCollection,
  } = useTreeActions();

  if (isVirtualCategory) {
    return (
      <TreeActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        position={position}
        title="Category Actions"
        titleIcon={<ActionIcon className="w-4 h-4" />}
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
            const rawTemplateId = Math.abs(collection.id);
            if (rawTemplateId !== 999) {
              onEditTemplate?.(rawTemplateId);
            }
            menu.closeMenu();
          }}
        />
      </TreeActionMenu>
    );
  }

  return (
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title="Collection Actions"
      titleIcon={<ActionIcon className="w-4 h-4" />}
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
    </TreeActionMenu>
  );
}
