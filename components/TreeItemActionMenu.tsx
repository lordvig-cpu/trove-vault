'use client';

import React from 'react';
import { AddSubItemIcon } from '@/components/icons/TreeIcons';
import TreeActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
} from '@/components/TreeActionMenu';
import { useTreeActions } from '@/context/TreeActionsContext';
import { ItemRecord } from '@/types/item';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';

interface TreeItemActionMenuProps {
  item: ItemRecord;
  collectionId: number | null;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
}

export default function TreeItemActionMenu({
  item,
  collectionId,
  menu,
  position,
}: TreeItemActionMenuProps) {
  const { onAddSubItem, onEditItem, onRenameItem, onDeleteItem } = useTreeActions();

  return (
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title="Item Actions"
      titleIcon="📄"
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
    </TreeActionMenu>
  );
}
