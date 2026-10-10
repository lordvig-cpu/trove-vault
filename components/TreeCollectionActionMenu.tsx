'use client';

import React, { useState } from 'react';
import { UNCATEGORIZED_CATEGORY_ID } from '@/lib/treeUtils';
import { CollectionRecord } from '@/types/collection';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { ActionIcon, PropertiesIcon } from '@/components/icons/LayoutIcons';
import TreeSubMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuTabs,
} from '@/components/TreeSubMenu';
import { NameProperties } from '@/components/TreeMenuProperties';
import type { MenuTab } from '@/lib/menuTabRequest';
import { InboxIcon } from '@/components/icons/GlyphIcons';
import { FileIcon, FolderIcon } from '@/components/icons/ContentIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

// A category (virtual, made from a template) has only Actions, so ActionMenuTabs renders its band as a
// plain divider; a real collection has Actions and Properties.
const ACTIONS_ONLY_TABS = [{ id: 'actions' as const, label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> }];
const TABS = [
  ...ACTIONS_ONLY_TABS,
  { id: 'properties' as const, label: 'Properties', icon: <PropertiesIcon className="w-4 h-4" /> },
];

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
  const [activeTab, setActiveTab] = useState<MenuTab>('actions');

  if (isVirtualCategory) {
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
        title="Category: Actions"
        titleIcon={<ActionIcon className="w-4 h-4" />}
        subheader={<ActionMenuTabs tabs={ACTIONS_ONLY_TABS} />}
      >
        <ActionMenuItem
          icon={<FileIcon />}
          label="New:"
          labelDetail="Item"
          subtext="Add record to this category"
          onClick={() => {
            onAddSubItem(collection.id, null);
            menu.closeMenu();
          }}
        />
        <ActionMenuItem
          icon={<GearIcon className="w-3.5 h-3.5" />}
          label="Edit:"
          labelDetail="Item Template"
          subtext="Manage attributes & schema"
          onClick={() => {
            if (collection.id !== UNCATEGORIZED_CATEGORY_ID) onEditTemplate?.(Math.abs(collection.id));
            menu.closeMenu();
          }}
        />
      </TreeSubMenu>
    );
  }

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
      title="Collection Properties"
      titleIcon={<FolderIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />}
    >
      {activeTab === 'properties' ? (
        <NameProperties name={collection.name} onSave={(nextName) => onRenameCollection?.(collection.id, nextName)} />
      ) : (
      <>
      <ActionMenuItem
        icon={<FileIcon />}
        label="New:"
        labelDetail="Item"
        subtext="Create item in this collection"
        onClick={() => {
          onAddSubItem(collection.id, null);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<InboxIcon />}
        label="Add:"
        labelDetail="Existing Item"
        subtext="Link catalog item here"
        onClick={() => {
          // Not implemented yet: linking an existing catalog item to a collection.
          menu.closeMenu();
        }}
      />

      {onEditCollection && (
        <ActionMenuItem
          icon={<GearIcon className="w-3.5 h-3.5" />}
          label="Edit:"
          labelDetail="Collection Settings"
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
          label="New:"
          labelDetail="Sub-Collection"
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
          label="Delete"
          subtext="Permanently remove"
          onClick={() => {
            onDeleteCollection(collection);
            menu.closeMenu();
          }}
        />
      )}
      </>
      )}
    </TreeSubMenu>
  );
}
