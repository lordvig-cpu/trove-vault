'use client';

import React, { useState } from 'react';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
import { CollectionRecord } from '@/types/collection';
import { useTreeActions } from '@/context/TreeActionsContext';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import TreeSubMenu, { MenuActionBar } from '@/components/TreeSubMenu';
import { NameProperties } from '@/components/TreeMenuProperties';
import { PackageIcon } from '@/components/icons/GlyphIcons';
import { FileIcon } from '@/components/icons/ContentIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

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
      closeInstantly={menu.closedWithPanel}
      floating={menu.floatingChrome}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      splitBody
      className="menuShellXWide"
      title="Template"
      titleIcon={<PackageIcon className="w-4 h-4" />}
      subheader={
        <MenuActionBar
          actions={[
            {
              id: 'new-item',
              label: 'New item',
              caption: 'Create item with this template',
              Icon: FileIcon,
              onClick: () => {
                onAddSubItem(-rawTemplateId, null);
                menu.closeMenu();
              },
            },
            ...(onEditTemplate
              ? [
                  {
                    id: 'edit-template',
                    label: 'Edit template',
                    caption: 'Configure blueprint & fields schema',
                    Icon: GearIcon,
                    onClick: () => {
                      onEditTemplate(rawTemplateId);
                      menu.closeMenu();
                    },
                  },
                ]
              : []),
            ...(onDeleteTemplate
              ? [
                  {
                    id: 'delete',
                    label: 'Delete',
                    caption: 'Permanently remove',
                    Icon: TrashCanIcon,
                    danger: true,
                    onClick: () => {
                      menu.closeMenu();
                      setConfirmingDelete(true);
                    },
                  },
                ]
              : []),
          ]}
        />
      }
    >
      <NameProperties name={template.name} onSave={(nextName) => onRenameTemplate?.(rawTemplateId, nextName)} />
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

