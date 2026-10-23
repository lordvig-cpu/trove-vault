'use client';

import React, { useState } from 'react';
import { AddSubItemIcon } from '@/components/icons/TreeIcons';
import { FileIcon } from '@/components/icons/ContentIcons';
import TreeSubMenu, { MenuActionBar } from '@/components/TreeSubMenu';
import TreeItemProperties, { type ItemPropertySection } from '@/components/TreeItemProperties';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useItemEditor } from '@/hooks/useItemEditor';
import { ItemRecord } from '@/types/item';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

interface TreeItemActionMenuProps {
  item: ItemRecord;
  collectionId: number | null;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
}

/** Gear-icon flyout for an Item row in the tree: its actions (add a sub-item, delete) as an icon bar under the title
    (MenuActionBar), over everything about the item (TreeItemProperties), saved with Save -- one view, no tabs.
    Actions come from TreeActionsContext; open / close / position state comes from the caller's useTreeActionMenu. */
export default function TreeItemActionMenu({
  item,
  collectionId,
  menu,
  position,
}: TreeItemActionMenuProps) {
  const { onAddSubItem, onDeleteItem, onItemSaved } = useTreeActions();

  // Kept here (this component stays mounted with its row, unlike the menu's own contents) so the open cards and
  // any unsaved edits survive the flyout closing and reopening.
  const [openSections, setOpenSections] = useState<Record<ItemPropertySection, boolean>>({
    template: false,
    photo: true,
    fields: true,
    custom: false,
  });
  // Loads the item once the menu is open (each load fetches the template catalog), not for every row up front
  const editor = useItemEditor(item, menu.isMenuOpen);

  return (
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      closeInstantly={menu.closedWithPanel}
      floating={menu.floatingChrome}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      splitBody
      className="menuShellXWide"
      title="Item"
      titleIcon={<FileIcon className="w-4 h-4" />}
      subheader={
        <MenuActionBar
          actions={[
            {
              id: 'add-child',
              label: 'Add child item',
              caption: 'Create a nested record',
              Icon: AddSubItemIcon,
              onClick: () => {
                onAddSubItem(collectionId, item.id);
                menu.closeMenu();
              },
            },
            {
              id: 'delete',
              label: 'Delete',
              caption: 'Permanently remove',
              Icon: TrashCanIcon,
              danger: true,
              onClick: () => {
                onDeleteItem(item, collectionId);
                menu.closeMenu();
              },
            },
          ]}
        />
      }
    >
      <TreeItemProperties
        editor={editor}
        openSections={openSections}
        onToggleSection={(section) => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))}
        onSaved={() => onItemSaved?.(collectionId)}
      />
    </TreeSubMenu>
  );
}
