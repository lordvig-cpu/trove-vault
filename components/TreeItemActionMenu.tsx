'use client';

import React from 'react';
import { AddSubItemIcon } from '@/components/icons/TreeIcons';
import { ActionIcon } from '@/components/icons/LayoutIcons';
import TreeSubMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
  ActionMenuTabs,
} from '@/components/TreeSubMenu';
import { useTreeActions } from '@/context/TreeActionsContext';
import { ItemRecord } from '@/types/item';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';

interface TreeItemActionMenuProps {
  item: ItemRecord;
  collectionId: number | null;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
}

/** Gear-icon flyout for an Item row in the tree: add sub-item, edit, rename, delete. Actions come
    from TreeActionsContext; open/close/position state comes from the caller's useTreeActionMenu. */
export default function TreeItemActionMenu({
  item,
  collectionId,
  menu,
  position,
}: TreeItemActionMenuProps) {
  const { onAddSubItem, onEditItem, onRenameItem, onDeleteItem } = useTreeActions();

  return (
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      splitBody
      title="Item: Actions"
      titleIcon={<ActionIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={[{ id: 'actions', label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> }]} />}
    >
      <ActionMenuItem
        icon={<AddSubItemIcon className="w-3.5 h-3.5" />}
        label="Add Sub-Item"
        subtext="Create a nested record"
        onClick={() => {
          onAddSubItem(collectionId, item.id);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<span>🏷️</span>}
        label="Rename Item"
        subtext="Inline edit title"
        onClick={() => menu.setIsRenaming((previous: boolean) => !previous)}
      />

      {menu.isRenaming && (
        <ActionMenuRenameForm
          initialValue={item.name}
          onSave={async (nextName) => {
            await onRenameItem?.(item.id, nextName);
            menu.closeMenu();
          }}
          onCancel={() => menu.setIsRenaming(false)}
        />
      )}

      <ActionMenuItem
        icon={<span>✏️</span>}
        label="Edit Item"
        subtext="Update attributes & template"
        onClick={() => {
          onEditItem(item, collectionId);
          menu.closeMenu();
        }}
      />

      <ActionMenuDivider />

      <ActionMenuDangerItem
        icon={<span>🗑️</span>}
        label="Delete Item"
        subtext="Permanently remove"
        onClick={() => {
          onDeleteItem(item, collectionId);
          menu.closeMenu();
        }}
      />
    </TreeSubMenu>
  );
}
