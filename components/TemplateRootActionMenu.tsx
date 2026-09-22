'use client';

import React, { useState } from 'react';
import { ItemTemplate } from '@/types/template';
import { FieldType } from '@/types/field';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
import TreeActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
} from '@/components/TreeActionMenu';

interface TemplateRootActionMenuProps {
  template: ItemTemplate;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
  onUpdateMeta: (name: string, description: string | null, icon: string) => Promise<void> | void;
  onAddField: (type?: FieldType) => Promise<void> | void;
  onDeleteTemplate?: (templateId: number) => Promise<void> | void;
  onCloseEditor?: () => void;
}

export default function TemplateRootActionMenu({
  template,
  menu,
  position,
  onUpdateMeta,
  onAddField,
  onDeleteTemplate,
  onCloseEditor,
}: TemplateRootActionMenuProps) {
  const [name, setName] = useState(template.name);
  const [icon, setIcon] = useState(template.icon || '📦');
  const [description, setDescription] = useState(template.description || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Adjust state during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevTemplate, setPrevTemplate] = useState(template);
  if (prevTemplate !== template) {
    setPrevTemplate(template);
    setName(template.name);
    setIcon(template.icon || '📦');
    setDescription(template.description || '');
  }

  const handleSaveMeta = () => {
    if (
      name.trim() !== template.name ||
      icon.trim() !== (template.icon || '📦') ||
      description.trim() !== (template.description || '')
    ) {
      onUpdateMeta(
        name.trim() || template.name,
        description.trim() || null,
        icon.trim() || '📦'
      );
    }
  };

  return (
    <>
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title="Blueprint Settings"
      titleIcon={icon || '📦'}
      className="menuShellWide"
    >
      <div className="flex flex-col gap-2.5 p-2 text-xs">
        {/* Template Name & Icon Row */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col gap-1 w-12 shrink-0">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Icon
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              onBlur={handleSaveMeta}
              maxLength={4}
              className="w-full px-1.5 py-1 text-center bg-surface-panel border border-[var(--primary-border-strong,#334155)] rounded-md text-sm text-strong focus:border-[var(--primary-accent)] focus:outline-none transition"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Blueprint Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveMeta}
              placeholder="e.g. Board Game"
              className="w-full px-2 py-1 bg-surface-panel border border-[var(--primary-border-strong,#334155)] rounded-md text-xs text-strong focus:border-[var(--primary-accent)] focus:outline-none transition"
            />
          </div>
        </div>

        {/* Description Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSaveMeta}
            placeholder="Blueprint description..."
            className="w-full px-2 py-1 bg-surface-panel border border-[var(--primary-border-strong,#334155)] rounded-md text-xs text-strong focus:border-[var(--primary-accent)] focus:outline-none transition resize-none primary-panel-scroll"
          />
        </div>
      </div>

      <ActionMenuDivider />

      {/* Quick Add Field Action */}
      <ActionMenuItem
        icon={<span>➕</span>}
        label="Add New Field"
        subtext="Add attribute to this blueprint"
        onClick={() => {
          onAddField('text');
          menu.closeMenu();
        }}
      />

      {onCloseEditor && (
        <>
          <ActionMenuDivider />
          <ActionMenuItem
            icon={<span>✓</span>}
            label="Done Editing"
            subtext="Exit blueprint editor & restore pins"
            onClick={() => {
              menu.closeMenu();
              onCloseEditor();
            }}
          />
        </>
      )}

      {/* Delete Blueprint if custom and available */}
      {onDeleteTemplate && !template.is_system_preset && (
        <>
          <ActionMenuDivider />
          <ActionMenuDangerItem
            icon={<span>🗑️</span>}
            label="Delete Blueprint"
            subtext="Permanently remove template"
            onClick={() => {
              menu.closeMenu();
              setConfirmingDelete(true);
            }}
          />
        </>
      )}
    </TreeActionMenu>
    {confirmingDelete && onDeleteTemplate && (
      <DeleteTemplateModal
        templateName={template.name}
        onConfirm={() => onDeleteTemplate(template.id)}
        onClose={() => setConfirmingDelete(false)}
      />
    )}
    </>
  );
}

