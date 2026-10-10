'use client';

import React, { useState } from 'react';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
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
import { PackageIcon } from '@/components/icons/GlyphIcons';
import { FileIcon } from '@/components/icons/ContentIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';

const TABS = [
  { id: 'actions' as const, label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> },
  { id: 'properties' as const, label: 'Properties', icon: <PropertiesIcon className="w-4 h-4" /> },
];

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
  const [activeTab, setActiveTab] = useState<MenuTab>('actions');

  return (
    <>
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      closeInstantly={menu.closedWithPanel}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      splitBody
      className="menuShellXWide"
      title="Template Properties"
      titleIcon={<PackageIcon className="w-4 h-4" />}
      subheader={<ActionMenuTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />}
    >
      {activeTab === 'properties' ? (
        <NameProperties name={template.name} onSave={(nextName) => onRenameTemplate?.(rawTemplateId, nextName)} />
      ) : (
      <>
      <ActionMenuItem
        icon={<FileIcon />}
        label="New:"
        labelDetail="Item"
        subtext="Create item with this template"
        onClick={() => {
          onAddSubItem(-rawTemplateId, null);
          menu.closeMenu();
        }}
      />

      {onEditTemplate && (
        <ActionMenuItem
          icon={<GearIcon className="w-3.5 h-3.5" />}
          label="Edit:"
          labelDetail="Template"
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
          label="Delete"
          subtext="Permanently remove"
          onClick={() => {
            menu.closeMenu();
            setConfirmingDelete(true);
          }}
        />
      )}
      </>
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

