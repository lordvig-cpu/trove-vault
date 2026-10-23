'use client';

import React from 'react';
import { UNCATEGORIZED_CATEGORY_ID } from '@/lib/treeUtils';
import { CollectionRecord } from '@/types/collection';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { ActionIcon } from '@/components/icons/LayoutIcons';
import TreeSubMenu, {
  ActionMenuItem,
  ActionMenuTabs,
  ACTIONS_ONLY_TABS,
  MenuActionBar,
} from '@/components/TreeSubMenu';
import { NameProperties } from '@/components/TreeMenuProperties';
import { InboxIcon } from '@/components/icons/GlyphIcons';
import { FileIcon, FolderIcon } from '@/components/icons/ContentIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

// A category (virtual, made from a template) has only actions, so it keeps them as labelled rows under a single
// Actions tab; a real collection has an action bar over its Properties (MenuActionBar).

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
        closeInstantly={menu.closedWithPanel}
        floating={menu.floatingChrome}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left}
        position={position}
        splitBody
        title="Category"
        titleIcon={<ActionIcon className="w-4 h-4" />}
        subheader={<ActionMenuTabs tabs={ACTIONS_ONLY_TABS} />}
      >
        <ActionMenuItem
          icon={<FileIcon />}
          label="New item"
          subtext="Add record to this category"
          onClick={() => {
            onAddSubItem(collection.id, null);
            menu.closeMenu();
          }}
        />
        <ActionMenuItem
          icon={<GearIcon className="w-3.5 h-3.5" />}
          label="Edit item template"
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
      title="Collection"
      titleIcon={<FolderIcon className="w-4 h-4" />}
      subheader={
        <MenuActionBar
          actions={[
            {
              id: 'new-item',
              label: 'New item',
              description: 'Create item in this collection',
              Icon: FileIcon,
              onClick: () => {
                onAddSubItem(collection.id, null);
                menu.closeMenu();
              },
            },
            {
              id: 'add-existing',
              label: 'Add existing item',
              description: 'Link catalog item here',
              Icon: InboxIcon,
              onClick: () => {
                // Not implemented yet: linking an existing catalog item to a collection.
                menu.closeMenu();
              },
            },
            ...(onEditCollection
              ? [
                  {
                    id: 'edit-settings',
                    label: 'Edit collection settings',
                    description: 'Manage collection metadata',
                    Icon: GearIcon,
                    onClick: () => {
                      onEditCollection(collection);
                      menu.closeMenu();
                    },
                  },
                ]
              : []),
            ...(onAddSubCollection
              ? [
                  {
                    id: 'new-sub-collection',
                    label: 'New sub-collection',
                    description: 'Create a nested collection',
                    Icon: FolderIcon,
                    onClick: () => {
                      onAddSubCollection(collection.id);
                      menu.closeMenu();
                    },
                  },
                ]
              : []),
            ...(onDeleteCollection
              ? [
                  {
                    id: 'delete',
                    label: 'Delete',
                    description: 'Permanently remove',
                    Icon: TrashCanIcon,
                    danger: true,
                    onClick: () => {
                      onDeleteCollection(collection);
                      menu.closeMenu();
                    },
                  },
                ]
              : []),
          ]}
        />
      }
    >
      <NameProperties name={collection.name} onSave={(nextName) => onRenameCollection?.(collection.id, nextName)} />
    </TreeSubMenu>
  );
}
