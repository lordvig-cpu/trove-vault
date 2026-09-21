'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import TreeActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
} from '@/components/TreeActionMenu';

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

  return (
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title="Template Actions"
      titleIcon={template.icon || '📑'}
    >
      <ActionMenuItem
        icon={<span>📄</span>}
        label="New Item"
        subtext="Create item with this template"
        onClick={() => {
          onAddSubItem(-rawTemplateId, null);
          menu.closeMenu();
        }}
      />

      <ActionMenuItem
        icon={<span>🏷️</span>}
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
          icon={<span>⚙️</span>}
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
          icon={<span>🗑️</span>}
          label="Delete Template"
          subtext="Permanently remove"
          onClick={() => {
            onDeleteTemplate(rawTemplateId);
            menu.closeMenu();
          }}
        />
      )}
    </TreeActionMenu>
  );
}

