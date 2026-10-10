'use client';

import React, { useState } from 'react';
import { AddSubItemIcon } from '@/components/icons/TreeIcons';
import { ActionIcon, PropertiesIcon } from '@/components/icons/LayoutIcons';
import { FileIcon } from '@/components/icons/ContentIcons';
import TreeSubMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuTabs,
} from '@/components/TreeSubMenu';
import TreeItemProperties, { type ItemPropertySection } from '@/components/TreeItemProperties';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useItemEditor } from '@/hooks/useItemEditor';
import { ItemRecord } from '@/types/item';
import type { MenuTab } from '@/lib/menuTabRequest';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

interface TreeItemActionMenuProps {
  item: ItemRecord;
  collectionId: number | null;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
}

const TABS = [
  { id: 'actions' as const, label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> },
  { id: 'properties' as const, label: 'Properties', icon: <PropertiesIcon className="w-4 h-4" /> },
];

/** Gear-icon flyout for an Item row in the tree. Actions: add a sub-item, delete. Properties: everything
    about the item (TreeItemProperties), saved with Save. Actions come from TreeActionsContext; open / close
    / position state comes from the caller's useTreeActionMenu. */
export default function TreeItemActionMenu({
  item,
  collectionId,
  menu,
  position,
}: TreeItemActionMenuProps) {
  const { onAddSubItem, onDeleteItem, onItemSaved } = useTreeActions();

  // Kept here (this component stays mounted with its row, unlike the menu's own contents) so the active
  // tab, the open cards and any unsaved edits survive the flyout closing and reopening.
  const [activeTab, setActiveTab] = useState<MenuTab>('actions');
  const [openSections, setOpenSections] = useState<Record<ItemPropertySection, boolean>>({
    template: false,
    photo: true,
    fields: true,
    custom: false,
  });
  // Loads the item only once Properties is actually showing (each load fetches the template catalog)
  const editor = useItemEditor(item, menu.isMenuOpen && activeTab === 'properties');

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
      title="Item Properties"
      titleIcon={<FileIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />}
    >
      {activeTab === 'actions' ? (
        <>
          <ActionMenuItem
            icon={<AddSubItemIcon className="w-3.5 h-3.5" />}
            label="Add:"
            labelDetail="Child Item"
            subtext="Create a nested record"
            onClick={() => {
              onAddSubItem(collectionId, item.id);
              menu.closeMenu();
            }}
          />

          <ActionMenuDivider />

          <ActionMenuDangerItem
            icon={<TrashCanIcon />}
            label="Delete"
            subtext="Permanently remove"
            onClick={() => {
              onDeleteItem(item, collectionId);
              menu.closeMenu();
            }}
          />
        </>
      ) : (
        <TreeItemProperties
          editor={editor}
          openSections={openSections}
          onToggleSection={(section) => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))}
          onSaved={() => onItemSaved?.(collectionId)}
        />
      )}
    </TreeSubMenu>
  );
}
