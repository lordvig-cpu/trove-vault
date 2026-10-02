'use client';

import React, { useState } from 'react';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
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
import { TagIcon } from '@/components/icons/GlyphIcons';
import { FileIcon } from '@/components/icons/ContentIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

// Only one tab exists today, so ActionMenuTabs renders this as a plain divider band rather than a
// single oversized tab button -- but it's still the exact same splitBody shell and .menuTabs CSS
// every tabbed flyout uses, so a future Properties tab is a drop-in rather than a rewrite.
const ACTIONS_ONLY_TABS = [{ id: 'actions' as const, label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> }];

interface TreeTemplateActionMenuProps {
  template: CollectionRecord;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
}

export default function TreeTemplateActionMenu({
  template,
  menu,
  position,
}: TreeTemplateActionMenuProps) {
  const {
    onAddSubItem,
    onEditTemplate,
    onRenameTemplate,
    onDeleteTemplate,
  } = useTreeActions();

  const rawTemplateId = Math.abs(template.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      splitBody
      title="Template: Actions"
      titleIcon={<ActionIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={ACTIONS_ONLY_TABS} />}
    >
      <ActionMenuItem
        icon={<FileIcon />}
        label="New Item"
        subtext="Create item with this template"
        onClick={() => {
          onAddSubItem(-rawTemplateId, null);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<TagIcon />}
        label="Rename Template"
        subtext="Inline edit title"
        onClick={() => menu.setIsRenaming((previous: boolean) => !previous)}
      />

      {menu.isRenaming && (
        <ActionMenuRenameForm
          initialValue={template.name}
          onSave={async (nextName) => {
            await onRenameTemplate?.(rawTemplateId, nextName);
            menu.closeMenu();
          }}
          onCancel={() => menu.setIsRenaming(false)}
        />
      )}

      {onEditTemplate && (
        <ActionMenuItem
          icon={<GearIcon className="w-3.5 h-3.5" />}
          label="Edit Template"
          subtext="Configure blueprint & fields schema"
          onClick={() => {
            onEditTemplate(rawTemplateId);
            menu.closeMenu();
          }}
        />
      )}

      <ActionMenuDivider />

      {onDeleteTemplate && (
        <ActionMenuDangerItem
          icon={<TrashCanIcon />}
          label="Delete Template"
          subtext="Permanently remove"
          onClick={() => {
            menu.closeMenu();
            setConfirmingDelete(true);
          }}
        />
      )}
    </TreeSubMenu>
    {confirmingDelete && onDeleteTemplate && (
      <DeleteTemplateModal
        templateName={template.name}
        onConfirm={() => onDeleteTemplate(rawTemplateId)}
        onClose={() => setConfirmingDelete(false)}
      />
    )}
    </>
  );
}

