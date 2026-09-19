'use client';

import React, { useState, useEffect } from 'react';
import { FieldDefinition, FieldType } from '@/types/field';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import ExplorerActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
} from '@/components/ExplorerActionMenu';

interface TemplateFieldActionMenuProps {
  field: FieldDefinition;
  menu: ReturnType<typeof useExplorerActionMenu>;
  position?: 'left' | 'right';
  onUpdateField: (fieldId: number, partial: Partial<FieldDefinition>) => Promise<void> | void;
  onDeleteField: (fieldId: number) => Promise<void> | void;
  onMoveField?: (fieldId: number, direction: 'up' | 'down') => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'select', label: 'Select', icon: '📋' },
  { type: 'boolean', label: 'Boolean', icon: '🔘' },
  { type: 'date', label: 'Date', icon: '📅' },
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
}: TemplateFieldActionMenuProps) {
  const [label, setLabel] = useState(field.label);
  const [key, setKey] = useState(field.name);
  const [fieldType, setFieldType] = useState<FieldType>(field.field_type);
  const [isRequired, setIsRequired] = useState(field.is_required);
  const [newOption, setNewOption] = useState('');

  // Sync state when field prop updates
  useEffect(() => {
    setLabel(field.label);
    setKey(field.name);
    setFieldType(field.field_type);
    setIsRequired(field.is_required);
  }, [field]);

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
    <ExplorerActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title="Field Properties"
      titleIcon={activeTypeMeta.icon}
      className="menuShellWide"
    >
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
            className="w-full px-2 py-1 bg-surface-panel border border-[var(--primary-border-strong,#334155)] rounded-md text-xs text-strong focus:border-blue-400 focus:outline-none transition"
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
            className="w-full px-2 py-1 font-mono bg-surface-panel border border-[var(--primary-border-strong,#334155)] rounded-md text-[11px] text-muted focus:text-strong focus:border-blue-400 focus:outline-none transition"
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
                    ? 'bg-blue-500/20 border-blue-500/50 text-white font-bold'
                    : 'bg-surface-panel border-subtle text-muted hover:text-strong hover:bg-slate-800'
                }`}
              >
                <span>{ft.icon}</span>
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
            className="w-3.5 h-3.5 rounded border-subtle text-blue-500 focus:ring-0 cursor-pointer"
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
              <span className="font-mono text-[9px] text-amber-400">
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
                    className="text-[10px] text-muted hover:text-red-400 cursor-pointer leading-none"
                    title={`Remove "${opt}"`}
                  >
                    ✕
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
                className="flex-1 min-w-0 px-2 py-0.5 bg-surface-panel border border-subtle rounded text-[11px] text-strong focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={!newOption.trim()}
                className="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 disabled:opacity-40 rounded text-[11px] font-bold border border-blue-500/30 cursor-pointer"
              >
                +
              </button>
            </form>
          </div>
        )}
      </div>

      <ActionMenuDivider />

      {/* Move Actions */}
      {onMoveField && (
        <div className="flex flex-col">
          <ActionMenuItem
            icon={<span>▲</span>}
            label="Move Up"
            subtext="Shift field earlier in order"
            onClick={() => {
              if (canMoveUp) {
                onMoveField(field.id, 'up');
              }
            }}
          />
          <ActionMenuItem
            icon={<span>▼</span>}
            label="Move Down"
            subtext="Shift field later in order"
            onClick={() => {
              if (canMoveDown) {
                onMoveField(field.id, 'down');
              }
            }}
          />
        </div>
      )}

      <ActionMenuDivider />

      {/* Delete Field */}
      <ActionMenuDangerItem
        icon={<span>🗑️</span>}
        label="Delete Field"
        subtext="Remove from template schema"
        onClick={() => {
          onDeleteField(field.id);
          menu.closeMenu();
        }}
      />
    </ExplorerActionMenu>
  );
}

