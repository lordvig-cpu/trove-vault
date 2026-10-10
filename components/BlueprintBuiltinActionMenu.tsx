'use client';

import React from 'react';
import type { TreeActionMenuApi } from '@/hooks/useTreeActionMenu';
import TreeSubMenu, { ActionMenuItem, ActionMenuTabs } from '@/components/TreeSubMenu';
import { ActionIcon, PlaceIntoIcon } from '@/components/icons/LayoutIcons';

const ACTIONS_ONLY_TABS = [{ id: 'actions' as const, label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> }];

interface BlueprintBuiltinActionMenuProps {
  /** The built-in value's name ("Name", "Created", ...). */
  label: string;
  menu: TreeActionMenuApi;
  position?: 'left' | 'right';
  /** Places it into the editor's active container, named by `placeTarget`. */
  onPlace: () => void;
  placeTarget?: string;
}

/** Gear flyout for a built-in value's row in the Blueprint tree (Name, Created, Image, ...). Every item has these
 *  values, so there is nothing to rename, retype, move or delete: the one action is placing it in the layout. */
export default function BlueprintBuiltinActionMenu({ label, menu, position, onPlace, placeTarget }: BlueprintBuiltinActionMenuProps) {
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
      title={`${label}: Actions`}
      titleIcon={<ActionIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={ACTIONS_ONLY_TABS} />}
    >
      <ActionMenuItem
        icon={<PlaceIntoIcon className="w-3.5 h-3.5" />}
        label="Place:"
        labelDetail={placeTarget ?? 'Selected container'}
        subtext="Add it to the selected container"
        onClick={() => {
          onPlace();
          menu.closeMenu();
        }}
      />
    </TreeSubMenu>
  );
}
