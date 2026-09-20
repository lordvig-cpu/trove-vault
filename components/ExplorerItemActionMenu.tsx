'use client';

import React from 'react';
import { AddSubItemIcon } from '@/components/icons/ExplorerIcons';
import ExplorerActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
} from '@/components/ExplorerActionMenu';
import { useExplorerActions } from '@/context/ExplorerActionsContext';
import { ItemRecord } from '@/types/item';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';

interface ExplorerItemActionMenuProps {
  item: ItemRecord;
  collectionId: number | null;
  menu: ReturnType<typeof useExplorerActionMenu>;
  position?: 'left' | 'right';
}

export default function ExplorerItemActionMenu({
  item,
  collectionId,
  menu,
  position,
}: ExplorerItemActionMenuProps) {
  const { onAddSubItem, onEditItem, onRenameItem, onDeleteItem } = useExplorerActions();

  return (
    <ExplorerActionMenu
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
    </ExplorerActionMenu>
  );
}
