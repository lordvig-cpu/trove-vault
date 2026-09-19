'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import { useExplorerActions } from '@/context/ExplorerActionsContext';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import ExplorerActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuRenameForm,
} from '@/components/ExplorerActionMenu';

interface ExplorerTemplateActionMenuProps {
  template: CollectionRecord;
  menu: ReturnType<typeof useExplorerActionMenu>;
  position?: 'left' | 'right';
}

export default function ExplorerTemplateActionMenu({
  template,
  menu,
  position,
}: ExplorerTemplateActionMenuProps) {
  const {
    onAddSubItem,
    onEditTemplate,
    onRenameTemplate,
    onDeleteTemplate,
  } = useExplorerActions();

  const rawTemplateId = Math.abs(template.id);

  return (
    <ExplorerActionMenu
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
          label="Template Settings"
          subtext="Manage template schema & metadata"
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
    </ExplorerActionMenu>
  );
}

