'use client';

import React, { useState } from 'react';
import { FieldDefinition, FieldType } from '@/types/field';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { ActionIcon, PropertiesIcon } from '@/components/icons/LayoutIcons';
import { CloseIcon, ChevronDownIcon, TrashCanIcon } from '@/components/icons/PanelIcons';
import TreeSubMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuTabs,
} from '@/components/TreeSubMenu';
import { ChevronUpIcon } from '@/components/icons/GlyphIcons';
import { FieldTypeIcon } from '@/components/icons/ContentIcons';
import { PlaceIntoIcon } from '@/components/icons/LayoutIcons';

/** Gear flyout for a field in the template editor's Blueprint tab: a Properties tab (label, key, type,
    required, options) and an Actions tab (place it, move it within its group, delete). Edits are saved
    through `onUpdateField`; a move is offered only in a direction the field can go. */
interface TemplateFieldActionMenuProps {
  field: FieldDefinition;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
  onUpdateField: (fieldId: number, partial: Partial<FieldDefinition>) => Promise<void> | void;
  onDeleteField: (fieldId: number) => Promise<void> | void;
  onMoveField?: (fieldId: number, direction: 'up' | 'down') => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Places the field into the editor's active container, named by `placeTarget`. */
  onPlace?: () => void;
  placeTarget?: string;
}

/** The field types the Type picker offers, in display order. */
const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'select', label: 'Choice' },
  { type: 'boolean', label: 'Yes/No' },
  { type: 'date', label: 'Date' },
];

export default function TemplateFieldActionMenu({
  field,
  menu,
  position,
  onUpdateField,
  onDeleteField,
  onMoveField,
  canMoveUp = false,
  canMoveDown = false,
  onPlace,
  placeTarget,
}: TemplateFieldActionMenuProps) {
  const [label, setLabel] = useState(field.label);
  const [key, setKey] = useState(field.name);
  const [fieldType, setFieldType] = useState<FieldType>(field.field_type);
  const [isRequired, setIsRequired] = useState(field.is_required);
  const [newOption, setNewOption] = useState('');
  const [activeTab, setActiveTab] = useState<'actions' | 'properties'>('actions');

  // Sync state when field prop updates (adjusting state during render, not in an effect,
  // per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevField, setPrevField] = useState(field);
  if (prevField !== field) {
    setPrevField(field);
    setLabel(field.label);
    setKey(field.name);
    setFieldType(field.field_type);
    setIsRequired(field.is_required);
  }

  const handleSaveFieldProps = (partial: Partial<FieldDefinition>) => {
    onUpdateField(field.id, partial);
  };

  const handleLabelBlur = () => {
    if (label.trim() && label !== field.label) {
      handleSaveFieldProps({ label: label.trim() });
    }
  };

  const handleKeyBlur = () => {
    const formatted = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (formatted && formatted !== field.name) {
      setKey(formatted);
      handleSaveFieldProps({ name: formatted });
    }
  };

  const handleTypeChange = (nextType: FieldType) => {
    setFieldType(nextType);
    const updates: Partial<FieldDefinition> = { field_type: nextType };
    if (nextType === 'select' && (!field.options || field.options.length === 0)) {
      updates.options = ['Option 1', 'Option 2'];
    }
    handleSaveFieldProps(updates);
  };

  const handleToggleRequired = () => {
    const nextVal = !isRequired;
    setIsRequired(nextVal);
    handleSaveFieldProps({ is_required: nextVal });
  };

  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOption.trim()) return;
    const currentOptions = field.options || [];
    const trimmed = newOption.trim();
    if (!currentOptions.includes(trimmed)) {
      handleSaveFieldProps({ options: [...currentOptions, trimmed] });
      setNewOption('');
    }
  };

  const handleRemoveOption = (optionToRemove: string) => {
    const currentOptions = field.options || [];
    handleSaveFieldProps({
      options: currentOptions.filter((opt) => opt !== optionToRemove),
    });
  };

  const activeTypeMeta = FIELD_TYPES.find((t) => t.type === field.field_type) || FIELD_TYPES[0];

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
      title={field.label}
      titleIcon={<FieldTypeIcon type={activeTypeMeta.type} className="w-3.5 h-3.5" />}
      className="menuShellWide"
      subheader={
        <ActionMenuTabs
          tabs={[
            { id: 'actions', label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> },
            { id: 'properties', label: 'Properties', icon: <PropertiesIcon className="w-4 h-4" /> },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      {activeTab === 'properties' && (
      <div className="flex flex-col gap-2.5 p-2 text-xs">
        {/* Field Label Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Field Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelBlur();
            }}
            placeholder="e.g. Player Count"
            className="w-full px-2 py-1 bg-surface-panel border border-[var(--primary-border-strong)] rounded-md text-xs text-strong focus:border-[var(--primary-accent)] focus:outline-none transition"
          />
        </div>

        {/* Database Key Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Attribute Key
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onBlur={handleKeyBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleKeyBlur();
            }}
            placeholder="e.g. player_count"
            className="w-full px-2 py-1 font-mono bg-surface-panel border border-[var(--primary-border-strong)] rounded-md text-[11px] text-muted focus:text-strong focus:border-[var(--primary-accent)] focus:outline-none transition"
          />
        </div>

        {/* Field Type Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Field Type
          </label>
          <div className="grid grid-cols-2 gap-1">
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                type="button"
                onClick={() => handleTypeChange(ft.type)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border transition cursor-pointer text-left ${
                  fieldType === ft.type
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] border-[var(--primary-accent)] text-[var(--text-strong)] font-bold'
                    : 'bg-surface-panel border-subtle text-muted hover:text-strong hover:bg-surface-hover'
                }`}
              >
                <FieldTypeIcon type={ft.type} className="w-3.5 h-3.5" />
                <span className="truncate">{ft.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Required Field Checkbox */}
        <label className="flex items-center gap-2 mt-0.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={handleToggleRequired}
            className="w-3.5 h-3.5 rounded border-subtle text-[var(--primary-accent)] focus:ring-0 cursor-pointer accent-[var(--primary-accent)]"
          />
          <span className="text-[11px] font-medium text-strong">
            Required attribute for items
          </span>
        </label>

        {/* Dropdown Options Manager (if select type) */}
        {fieldType === 'select' && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-subtle">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
              <span>Dropdown Options</span>
              <span className="font-mono text-[9px] text-accent-secondary">
                {field.options?.length || 0} choices
              </span>
            </label>

            {/* Existing Option Chips */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto primary-panel-scroll">
              {(field.options || []).map((opt) => (
                <span
                  key={opt}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-panel border border-subtle text-[10px] text-strong"
                >
                  <span className="truncate max-w-[110px]">{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(opt)}
                    className="text-[10px] text-muted hover:text-danger-text cursor-pointer leading-none"
                    title={`Remove "${opt}"`}
                  >
                    <CloseIcon />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Option Input */}
            <form onSubmit={handleAddOption} className="flex gap-1 mt-1">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option..."
                className="flex-1 min-w-0 px-2 py-0.5 bg-surface-panel border border-subtle rounded text-[11px] text-strong focus:outline-none focus:border-[var(--primary-accent)]"
              />
              <button
                type="submit"
                disabled={!newOption.trim()}
                className="px-2 py-0.5 bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-[var(--primary-accent)] disabled:opacity-40 rounded text-[11px] font-bold border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] cursor-pointer"
              >
                +
              </button>
            </form>
          </div>
        )}
      </div>
      )}

      {activeTab === 'actions' && (
      <>
      {onPlace && (
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
      )}
      {/* Moves within its Blueprint group (the field order the item forms follow) */}
      {onMoveField && canMoveUp && (
        <ActionMenuItem
          icon={<ChevronUpIcon />}
          label="Move:"
          labelDetail="Up"
          subtext="Earlier in its group"
          onClick={() => onMoveField(field.id, 'up')}
        />
      )}
      {onMoveField && canMoveDown && (
        <ActionMenuItem
          icon={<ChevronDownIcon className="w-3 h-3" />}
          label="Move:"
          labelDetail="Down"
          subtext="Later in its group"
          onClick={() => onMoveField(field.id, 'down')}
        />
      )}

      <ActionMenuDivider />

      {/* Delete Field */}
      <ActionMenuDangerItem
        icon={<TrashCanIcon />}
        label="Delete"
        subtext="Remove from template schema"
        onClick={() => {
          onDeleteField(field.id);
          menu.closeMenu();
        }}
      />
      </>
      )}
    </TreeSubMenu>
  );
}

