'use client';

import React, { useState, useMemo } from 'react';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition, FieldType } from '@/types/field';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import { GearIcon } from '@/components/icons/TreeIcons';
import TemplateFieldActionMenu from '@/components/TemplateFieldActionMenu';
import TemplateRootActionMenu from '@/components/TemplateRootActionMenu';
import '@/app/styles/components/templateFieldInspector.css';

interface TemplateFieldInspectorProps {
  template: ItemTemplate | null;
  selectedFieldId: number | null;
  isRootSelected?: boolean;
  searchQuery?: string;
  filterFieldTypes?: FieldType[];
  onSelectField: (fieldId: number | null) => void;
  onSelectRoot: () => void;
  onUpdateField: (fieldId: number, partial: Partial<FieldDefinition>) => Promise<void> | void;
  onAddField: (type?: FieldType, label?: string) => Promise<void> | void;
  onDeleteField: (fieldId: number) => Promise<void> | void;
  onReorderFields: (orderedIds: number[]) => Promise<void> | void;
  onUpdateTemplateMeta: (name: string, description: string | null, icon: string) => Promise<void> | void;
  onCloseEditor?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  successMsg?: string | null;
  position?: 'left' | 'right';
  placedFieldIds?: Set<number> | number[];
  onPlaceField?: (fieldId: number) => void;
  /** Not bound to a real field: drops 2 paragraphs of filler text, to preview how text actually
      flows/wraps inside a container (e.g. while testing a Split). */
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
}

const FIELD_TYPE_CONFIG: Record<
  FieldType,
  { label: string; icon: string; badgeClass: string; desc: string }
> = {
  text: { label: 'Text', icon: '📝', badgeClass: 'tmpl-type-badge-text', desc: 'Single-line or multi-line strings' },
  number: { label: 'Number', icon: '🔢', badgeClass: 'tmpl-type-badge-number', desc: 'Numeric integers or decimals' },
  select: { label: 'Dropdown / Select', icon: '📋', badgeClass: 'tmpl-type-badge-select', desc: 'Predefined list of choices' },
  boolean: { label: 'Boolean (Yes/No)', icon: '🔘', badgeClass: 'tmpl-type-badge-boolean', desc: 'True/False binary toggle' },
  date: { label: 'Date', icon: '📅', badgeClass: 'tmpl-type-badge-date', desc: 'Calendar date/time picker' },
};

/* --------------------------------------------------------------------------
   Sub-Component: Root Blueprint Tree Row with Gear Trigger & Action Menu
   -------------------------------------------------------------------------- */
function TemplateRootTreeRow({
  template,
  isRootSelected,
  onSelectRoot,
  onUpdateTemplateMeta,
  onAddField,
  onCloseEditor,
  position = 'left',
}: {
  template: ItemTemplate;
  isRootSelected: boolean;
  onSelectRoot: () => void;
  onUpdateTemplateMeta: (name: string, description: string | null, icon: string) => Promise<void> | void;
  onAddField: (type?: FieldType) => Promise<void> | void;
  onCloseEditor?: () => void;
  position?: 'left' | 'right';
}) {
  const isRightSide = position === 'right';
  const menu = useTreeActionMenu(`template-root-${template.id}`, 280, position, 272);
  const fields = template.fields || [];

  const gearTrigger = (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open template blueprint settings"
      aria-expanded={menu.isMenuOpen}
      onKeyDown={menu.handleGearKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        menu.handleGearMouseEnter(e);
      }}
      onMouseEnter={menu.handleGearMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      className={[
        'flex items-center justify-center w-6 h-6 shrink-0 rounded border border-transparent cursor-pointer transition-colors',
        menu.isMenuOpen
          ? 'tree-gear-trigger-active opacity-100'
          : 'tree-gear-trigger opacity-0 group-hover:opacity-100',
      ].join(' ')}
      title="Configure Blueprint Settings"
    >
      <GearIcon
        isActive={menu.isMenuOpen}
        className={[
          'w-[15px] h-[15px] transition-all duration-300 ease-out',
          menu.isMenuOpen
            ? 'tree-gear-open rotate-90'
            : 'tree-gear-closed',
        ].join(' ')}
      />
    </div>
  );

  return (
    <>
      <div
        onClick={onSelectRoot}
        className={`tmpl-tree-root group relative ${isRootSelected ? 'tmpl-tree-root-selected' : ''}`}
        title="Click to select blueprint container"
      >
        {isRightSide && gearTrigger}

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg shrink-0 select-none">{template.icon || '📦'}</span>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-strong truncate block">
              {template.name}
            </span>
            <span className="text-[10px] text-muted truncate block">
              {template.is_system_preset ? 'System Blueprint' : 'Custom Blueprint'} • {fields.length} Fields
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold text-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] px-1.5 py-0.5 rounded border border-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] shrink-0 select-none">
            ROOT
          </span>
          {onCloseEditor && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseEditor();
              }}
              title="Done editing template (restores workspace pins & tabs)"
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--primary-accent)] text-white hover:opacity-90 transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <span>✓</span>
              <span>Done</span>
            </button>
          )}
          {!isRightSide && gearTrigger}
        </div>
      </div>

      {/* Floating Action Menu Portal */}
      <TemplateRootActionMenu
        template={template}
        menu={menu}
        position={position}
        onUpdateMeta={onUpdateTemplateMeta}
        onAddField={onAddField}
        onCloseEditor={onCloseEditor}
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Sub-Component: Field Tree Row with Gear Trigger & Action Menu
   -------------------------------------------------------------------------- */
function TemplateFieldTreeRow({
  field,
  idx,
  totalCount,
  isSelected,
  position = 'left',
  onSelectField,
  onUpdateField,
  onDeleteField,
  onMoveField,
}: {
  field: FieldDefinition;
  idx: number;
  totalCount: number;
  isSelected: boolean;
  position?: 'left' | 'right';
  onSelectField: (id: number) => void;
  onUpdateField: (fieldId: number, partial: Partial<FieldDefinition>) => Promise<void> | void;
  onDeleteField: (fieldId: number) => Promise<void> | void;
  onMoveField: (fieldId: number, direction: 'up' | 'down') => void;
}) {
  const isRightSide = position === 'right';
  const menu = useTreeActionMenu(`template-field-${field.id}`, 480, position, 272);
  const typeCfg = FIELD_TYPE_CONFIG[field.field_type] || FIELD_TYPE_CONFIG.text;

  const gearTrigger = (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open properties for ${field.label}`}
      aria-expanded={menu.isMenuOpen}
      onKeyDown={menu.handleGearKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        menu.handleGearMouseEnter(e);
      }}
      onMouseEnter={menu.handleGearMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      className={[
        'flex items-center justify-center w-6 h-6 shrink-0 rounded border border-transparent cursor-pointer transition-colors',
        menu.isMenuOpen
          ? 'tree-gear-trigger-active opacity-100'
          : 'tree-gear-trigger opacity-0 group-hover:opacity-100',
      ].join(' ')}
      title="Configure Field Properties"
    >
      <GearIcon
        isActive={menu.isMenuOpen}
        className={[
          'w-[15px] h-[15px] transition-all duration-300 ease-out',
          menu.isMenuOpen
            ? 'tree-gear-open rotate-90'
            : 'tree-gear-closed',
        ].join(' ')}
      />
    </div>
  );

  const [isRowDragging, setIsRowDragging] = useState(false);

  return (
    <>
      <div
        onClick={() => onSelectField(field.id)}
        draggable={true}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('application/x-trove-field-id', String(field.id));
          e.dataTransfer.setData('text/plain', String(field.id));
          e.dataTransfer.effectAllowed = 'copyMove';
          setIsRowDragging(true);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          setIsRowDragging(false);
        }}
        className={`tmpl-field-item group relative transition-opacity ${
          isSelected ? 'tmpl-field-item-selected' : ''
        } ${isRowDragging ? 'opacity-40 ring-1 ring-[var(--primary-accent)]' : ''}`}
      >
        {/* Left Side: If docked on right panel, show gear on the left */}
        {isRightSide && gearTrigger}

        {/* Drag Handle & Field Identifiers */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[10px] text-muted/50 group-hover:text-muted cursor-grab active:cursor-grabbing tracking-tighter shrink-0 select-none p-0.5 rounded hover:bg-slate-800"
            title="Drag to place in container"
            aria-label="Drag handle"
          >
            ⋮⋮
          </span>
          <span className={`tmpl-type-badge ${typeCfg.badgeClass} shrink-0`}>
            <span>{typeCfg.icon}</span>
            <span>{typeCfg.label.split(' ')[0]}</span>
          </span>
          <div className="min-w-0 flex-1">
            <span
              className={`text-xs font-medium truncate block ${
                isSelected ? 'text-white font-bold' : 'text-slate-200'
              }`}
            >
              {field.label}
            </span>
            <span className="text-[9.5px] font-mono text-muted truncate block">
              {field.name}
            </span>
          </div>
        </div>

        {/* Right Side: Badges, Quick Move Actions & Gear (if docked on left) */}
        <div className="flex items-center gap-1 shrink-0">
          {field.is_required && (
            <span className="tmpl-badge-required shrink-0 select-none" title="Required field">
              REQ
            </span>
          )}
          {field.field_type === 'select' && (
            <span className="text-[9px] font-mono text-amber-400/80 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20 select-none">
              {field.options?.length || 0} opts
            </span>
          )}

          {/* Quick Move buttons on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveField(field.id, 'up');
              }}
              disabled={idx === 0}
              className="p-1 text-[10px] text-muted hover:text-white disabled:opacity-20 cursor-pointer"
              title="Move Up"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveField(field.id, 'down');
              }}
              disabled={idx === totalCount - 1}
              className="p-1 text-[10px] text-muted hover:text-white disabled:opacity-20 cursor-pointer"
              title="Move Down"
            >
              ▼
            </button>
          </div>

          {!isRightSide && gearTrigger}
        </div>
      </div>

      {/* Floating Action Menu Portal */}
      <TemplateFieldActionMenu
        field={field}
        menu={menu}
        position={position}
        onUpdateField={onUpdateField}
        onDeleteField={onDeleteField}
        onMoveField={onMoveField}
        canMoveUp={idx > 0}
        canMoveDown={idx < totalCount - 1}
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Main Component: TemplateFieldInspector (Full-Height Hierarchy Tree)
   -------------------------------------------------------------------------- */
export default function TemplateFieldInspector({
  template,
  selectedFieldId,
  isRootSelected = false,
  searchQuery = '',
  filterFieldTypes = [],
  onSelectField,
  onSelectRoot,
  onUpdateField,
  onAddField,
  onDeleteField,
  onReorderFields,
  onUpdateTemplateMeta,
  onCloseEditor,
  isLoading = false,
  error = null,
  successMsg = null,
  position = 'left',
  placedFieldIds,
  onPlaceField,
  onPlaceLoremIpsum,
}: TemplateFieldInspectorProps) {
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [isLoremDragging, setIsLoremDragging] = useState(false);

  const fields = useMemo(() => template?.fields || [], [template?.fields]);

  const unplacedFields = useMemo(() => {
    if (!placedFieldIds) return [];
    const set = placedFieldIds instanceof Set ? placedFieldIds : new Set(placedFieldIds);
    return fields.filter((f) => !set.has(f.id));
  }, [fields, placedFieldIds]);

  // Filtered Fields according to query & type filter
  const filteredFields = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fields.filter((f) => {
      const matchesQuery =
        !q ||
        f.label.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.field_type.toLowerCase().includes(q);
      const matchesType =
        filterFieldTypes.length === 0 || filterFieldTypes.includes(f.field_type);
      return matchesQuery && matchesType;
    });
  }, [fields, searchQuery, filterFieldTypes]);

  const handleMoveField = (fieldId: number, direction: 'up' | 'down') => {
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === fields.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const nextFields = [...fields];
    const [moved] = nextFields.splice(idx, 1);
    nextFields.splice(targetIdx, 0, moved);
    onReorderFields(nextFields.map((f) => f.id));
  };

  if (!template && isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center gap-2 text-xs text-muted">
        <div className="animate-spin text-lg">⏳</div>
        <span>Loading template schema...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center gap-2 text-xs text-muted">
        <span>No template selected for editing.</span>
      </div>
    );
  }

  return (
    <div className="tmpl-inspector-container p-1 flex flex-col gap-2.5 min-h-0 h-full flex-1 overflow-y-auto primary-panel-scroll select-none">
      {/* --------------------------------------------------------------------
          1. SYSTEM ALERTS / NOTICES
          -------------------------------------------------------------------- */}
      {error && (
        <div className="tmpl-alert-error text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="tmpl-alert-success text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* --------------------------------------------------------------------
          2. LOREM IPSUM GRABBABLE (not a real field -- drag or click to drop 2 paragraphs of
          filler text into a container, to preview how text actually flows/wraps)
          -------------------------------------------------------------------- */}
      {onPlaceLoremIpsum && (
        <div className="p-2.5 rounded-xl bg-[color-mix(in_oklch,var(--primary-accent)_10%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] flex items-center gap-2 shrink-0">
          <span
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/x-trove-lorem-ipsum', '1');
              e.dataTransfer.effectAllowed = 'copy';
              setIsLoremDragging(true);
            }}
            onDragEnd={() => setIsLoremDragging(false)}
            className={`text-[10px] text-muted/50 hover:text-muted cursor-grab active:cursor-grabbing tracking-tighter shrink-0 select-none p-0.5 rounded hover:bg-slate-800 ${
              isLoremDragging ? 'opacity-40' : ''
            }`}
            title="Drag to place in a container"
            aria-label="Drag handle"
          >
            ⋮⋮
          </span>
          <span className="text-[11px] font-medium text-strong flex-1 min-w-0 truncate">
            Lorem Ipsum <span className="text-muted font-normal">(filler text)</span>
          </span>
          <button
            type="button"
            onClick={() => onPlaceLoremIpsum()}
            className="px-2 py-1 text-[11px] font-medium rounded-lg bg-[color-mix(in_oklch,var(--primary-accent)_18%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_32%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] text-[var(--primary-accent)] hover:text-white transition cursor-pointer shrink-0"
            title="Place into the active container"
          >
            + Place
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------
          3. UNPLACED SCHEMA FIELDS TRAY (when fields remain to place)
          -------------------------------------------------------------------- */}
      {unplacedFields.length > 0 && onPlaceField && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Unplaced Fields ({unplacedFields.length})</span>
            </span>
            <span className="text-[9.5px] text-muted">Click to place</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unplacedFields.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onPlaceField(f.id)}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title={`Place ${f.label} into active container`}
              >
                <span className="font-bold text-amber-400">+</span>
                <span className="truncate max-w-[120px]">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          4. TEMPLATE SCHEMA HIERARCHY TREE
          -------------------------------------------------------------------- */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Template Hierarchy
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu((p) => !p)}
              className="text-[10px] font-semibold text-[var(--primary-accent)] hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] hover:bg-[var(--primary-accent)] border border-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] transition cursor-pointer"
            >
              <span>➕</span>
              <span>Add Field</span>
            </button>

            {/* Quick Add Field Type Menu */}
            {showAddMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 bg-[var(--surface-panel,#0f172a)] border border-[var(--primary-border-strong,#334155)] rounded-xl shadow-2xl z-50 p-1 flex flex-col gap-0.5"
                onMouseLeave={() => setShowAddMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-subtle mb-1">
                  Add Field Type
                </div>
                {(['text', 'number', 'select', 'boolean', 'date'] as FieldType[]).map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => {
                      onAddField(ft);
                      setShowAddMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-strong hover:bg-slate-800 transition cursor-pointer text-left"
                  >
                    <span>{FIELD_TYPE_CONFIG[ft].icon}</span>
                    <span>{FIELD_TYPE_CONFIG[ft].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Root Node: The Template Container */}
        <TemplateRootTreeRow
          template={template}
          isRootSelected={isRootSelected}
          onSelectRoot={onSelectRoot}
          onUpdateTemplateMeta={onUpdateTemplateMeta}
          onAddField={onAddField}
          onCloseEditor={onCloseEditor}
          position={position}
        />

        {/* Children: Template Fields */}
        <div className="tmpl-tree-children flex-1 min-h-0 overflow-y-auto primary-panel-scroll">
          {filteredFields.length === 0 ? (
            <div className="py-4 px-2 text-center text-xs text-muted italic">
              {searchQuery || filterFieldTypes.length > 0
                ? 'No fields matching current search / type filter.'
                : 'No fields defined yet. Click "+ Add Field" above.'}
            </div>
          ) : (
            filteredFields.map((field, idx) => {
              const isSelected = selectedFieldId === field.id && !isRootSelected;

              return (
                <TemplateFieldTreeRow
                  key={field.id}
                  field={field}
                  idx={idx}
                  totalCount={fields.length}
                  isSelected={isSelected}
                  position={position}
                  onSelectField={onSelectField}
                  onUpdateField={onUpdateField}
                  onDeleteField={onDeleteField}
                  onMoveField={handleMoveField}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
