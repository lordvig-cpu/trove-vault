'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { ActionIcon } from '@/components/icons/LayoutIcons';
import TreeSubMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
  ActionMenuTabs,
} from '@/components/TreeSubMenu';
import { InboxIcon, TagIcon } from '@/components/icons/GlyphIcons';
import { FileIcon, FolderIcon } from '@/components/icons/ContentIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

// Only one tab exists today, so ActionMenuTabs renders this as a plain divider band rather than a
// single oversized tab button -- but it's still the exact same splitBody shell and .menuTabs CSS
// every tabbed flyout uses, so a future Properties tab is a drop-in rather than a rewrite.
const ACTIONS_ONLY_TABS = [{ id: 'actions' as const, label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> }];

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
      <TreeSubMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        position={position}
        splitBody
        title="Category: Actions"
        titleIcon={<ActionIcon className="w-4 h-4" />}
        subheader={<ActionMenuTabs tabs={ACTIONS_ONLY_TABS} />}
      >
        <ActionMenuItem
          icon={<FileIcon />}
          label="New Item"
          subtext="Add record to this category"
          onClick={() => {
            onAddSubItem(collection.id, null);
            menu.closeMenu();
          }}
        />
        <ActionMenuItem
          icon={<GearIcon className="w-3.5 h-3.5" />}
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
      </TreeSubMenu>
    );
  }

  return (
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      splitBody
      title="Collection: Actions"
      titleIcon={<ActionIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={ACTIONS_ONLY_TABS} />}
    >
      <ActionMenuItem
        icon={<FileIcon />}
        label="New Item"
        subtext="Create item in this collection"
        onClick={() => {
          onAddSubItem(collection.id, null);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<InboxIcon />}
        label="Add Existing Item"
        subtext="Link catalog item here"
        onClick={() => {
          // Not implemented yet: linking an existing catalog item to a collection.
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<TagIcon />}
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
          icon={<GearIcon className="w-3.5 h-3.5" />}
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
          icon={<FolderIcon />}
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
          icon={<TrashCanIcon />}
          label="Delete Collection"
          subtext="Permanently remove"
          onClick={() => {
            onDeleteCollection(collection);
            menu.closeMenu();
          }}
        />
      )}
    </TreeSubMenu>
  );
}
