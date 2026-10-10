'use client';

import React, { useMemo, useState } from 'react';
import type { BuiltinKey } from '@/types/layout';
import type { ItemTemplate } from '@/types/template';
import type { FieldDefinition } from '@/types/field';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import TemplateFieldActionMenu from '@/components/TemplateFieldActionMenu';
import BlueprintBuiltinActionMenu from '@/components/BlueprintBuiltinActionMenu';
import TreeGearButton from '@/components/TreeGearButton';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/PanelIcons';
import { CheckIcon, HourglassIcon } from '@/components/icons/GlyphIcons';
import { BlueprintGroupIcon, CalendarIcon, FieldTypeIcon, FolderIcon, ImageIcon, ListIcon, TextFieldIcon } from '@/components/icons/ContentIcons';
import { activeIconColor } from '@/components/editorBarStyles';
import { blueprintGroups, moveWithinGroup, type BlueprintGroup, type BlueprintGroupId } from '@/lib/blueprintGroups';

/* ==========================================================================
   The template editor's Blueprint tab: which values a template's items have -- the built-in ones every item has
   and the template's own fields -- as one tree grouped by kind of data (lib/blueprintGroups.ts), in the
   Collections tree's look. A row's check says it is already placed in the layout; drag a row onto the canvas or a
   Layout-tree container, or use its gear's Place: action, to place it.
   ========================================================================== */

interface TemplateBlueprintTreeProps {
  template: ItemTemplate | null;
  selectedFieldId: number | null;
  searchQuery?: string;
  /** The groups to show (the Advanced filter); empty = all. */
  filterGroups?: readonly string[];
  /** The header's "missing only" toggle: hide what is already placed. */
  unplacedOnly?: boolean;
  collapsedGroups: ReadonlySet<BlueprintGroupId>;
  onToggleGroup: (id: BlueprintGroupId) => void;
  placedFieldIds: readonly number[];
  placedBuiltins: ReadonlySet<BuiltinKey>;
  /** The name of the container Place: puts things into (the editor's active container). */
  placeTarget: string;
  onSelectField: (fieldId: number | null) => void;
  onUpdateField: (fieldId: number, partial: Partial<FieldDefinition>) => Promise<void> | void;
  onDeleteField: (fieldId: number) => Promise<void> | void;
  onReorderFields: (orderedIds: number[]) => Promise<void> | void;
  onPlaceField: (fieldId: number) => void;
  onPlaceBuiltin: (key: BuiltinKey) => void;
  isLoading?: boolean;
  position?: 'left' | 'right';
}

/** The built-in values' own icons (a group row shows its group's icon instead). */
const BUILTIN_ICONS: Record<BuiltinKey, React.ReactNode> = {
  name: <TextFieldIcon className="w-3.5 h-3.5" />,
  created: <CalendarIcon className="w-3.5 h-3.5" />,
  image: <ImageIcon className="w-3.5 h-3.5" />,
  collections: <FolderIcon className="w-3.5 h-3.5" />,
  subitems: <ListIcon className="w-3.5 h-3.5" />,
};

/** A row's "placed in the layout" mark, in the selected yellow. */
function PlacedCheck() {
  return (
    <span className={`flex shrink-0 ${activeIconColor}`} title="Placed in the layout" aria-label="Placed in the layout">
      <CheckIcon className="w-3 h-3" />
    </span>
  );
}

/* Row geometry shared with UnifiedTree: left-docked rows indent by nesting, right-docked rows carry a
   depth-based paddingLeft (the gear sits at the left edge there). */
const rowPadding = (isRightSide: boolean, depth: number) => (isRightSide ? { paddingLeft: depth * 24.5 + 44 } : undefined);

function GroupRow({
  group,
  isOpen,
  onToggle,
  isRightSide,
  children,
}: {
  group: BlueprintGroup;
  isOpen: boolean;
  onToggle: () => void;
  isRightSide: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={onToggle}
        title={`${group.label}: ${group.rows.length} ${group.rows.length === 1 ? 'value' : 'values'}`}
        style={{ top: 0, zIndex: 20, ...rowPadding(isRightSide, 0) }}
        className="group flex items-center h-8 px-2 gap-1.5 cursor-pointer transition w-full min-w-0 tree-category-sticky-header tree-category-row"
      >
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex items-center justify-center w-4 h-4 shrink-0 text-[9px] tree-muted cursor-pointer transition select-none"
        >
          {isOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>
        <span className="w-4 h-4 flex items-center justify-center tree-category-icon shrink-0">
          <BlueprintGroupIcon type={group.id} className="w-3.5 h-3.5" />
        </span>
        <span className="text-[13px] tracking-tight font-medium truncate shrink min-w-0">{group.label}</span>
        <span className="tree-badge px-2 py-0.5 rounded-full text-[10.5px] font-mono shrink-0 select-none ml-auto">
          {group.rows.length}
        </span>
      </div>

      {isOpen && (
        <div className={`tree-branch space-y-0.5 my-0.5 flex flex-col min-w-0 relative ${isRightSide ? '' : 'border-l ml-[13.5px] pl-2.5'}`}>
          {isRightSide && (
            <div aria-hidden="true" className="tree-branch absolute top-0 bottom-0 border-l pointer-events-none" style={{ left: 52.5 }} />
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function BuiltinRow({
  builtinKey,
  label,
  placed,
  isRightSide,
  position,
  placeTarget,
  onPlace,
}: {
  builtinKey: BuiltinKey;
  label: string;
  placed: boolean;
  isRightSide: boolean;
  position: 'left' | 'right';
  placeTarget: string;
  onPlace: () => void;
}) {
  const menu = useTreeActionMenu(`blueprint-builtin-${builtinKey}`, 140, position, 224);
  const [isDragging, setIsDragging] = useState(false);
  const gear = (
    <div className={`transition shrink-0 ${isRightSide ? 'absolute left-2' : 'relative'}`}>
      <TreeGearButton menu={menu} label={`Open actions for ${label}`} />
    </div>
  );

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-trove-builtin', builtinKey);
          e.dataTransfer.effectAllowed = 'copy';
          setIsDragging(true);
        }}
        onDragEnd={() => setIsDragging(false)}
        onContextMenu={menu.handleRowContextMenu}
        title={`${label} (every item has it): drag it into the layout`}
        style={rowPadding(isRightSide, 1)}
        className={`group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-grab active:cursor-grabbing transition w-full min-w-0 tree-item ${
          isDragging ? 'opacity-40' : ''
        }`}
      >
        {isRightSide && gear}
        <span className="w-4 h-4 flex items-center justify-center opacity-80 shrink-0">{BUILTIN_ICONS[builtinKey]}</span>
        <span className="text-[13px] tracking-tight truncate min-w-0">{label}</span>
        <span className="blueprint-builtin-tag shrink-0 select-none">Built-in</span>
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          {placed && <PlacedCheck />}
          {!isRightSide && gear}
        </span>
      </div>
      <BlueprintBuiltinActionMenu label={label} menu={menu} position={position} onPlace={onPlace} placeTarget={placeTarget} />
    </>
  );
}

function FieldRow({
  field,
  fields,
  placed,
  isSelected,
  isRightSide,
  position,
  placeTarget,
  onSelect,
  onPlace,
  onUpdateField,
  onDeleteField,
  onReorderFields,
}: {
  field: FieldDefinition;
  fields: FieldDefinition[];
  placed: boolean;
  isSelected: boolean;
  isRightSide: boolean;
  position: 'left' | 'right';
  placeTarget: string;
  onSelect: () => void;
  onPlace: () => void;
  onUpdateField: TemplateBlueprintTreeProps['onUpdateField'];
  onDeleteField: TemplateBlueprintTreeProps['onDeleteField'];
  onReorderFields: TemplateBlueprintTreeProps['onReorderFields'];
}) {
  const menu = useTreeActionMenu(`template-field-${field.id}`, 480, position, 272);
  const [isDragging, setIsDragging] = useState(false);
  const gear = (
    <div className={`transition shrink-0 ${isRightSide ? 'absolute left-2' : 'relative'}`}>
      <TreeGearButton menu={menu} label={`Open properties for ${field.label}`} />
    </div>
  );
  const move = (direction: 'up' | 'down') => {
    const order = moveWithinGroup(fields, field.id, direction);
    if (order) void onReorderFields(order);
  };

  return (
    <>
      <div
        onClick={onSelect}
        onContextMenu={(e) => {
          if (!e.shiftKey) onSelect();
          menu.handleRowContextMenu(e);
        }}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('application/x-trove-field-id', String(field.id));
          e.dataTransfer.setData('text/plain', String(field.id));
          e.dataTransfer.effectAllowed = 'copyMove';
          setIsDragging(true);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          setIsDragging(false);
        }}
        title={`${field.label} (${field.name}): drag it into the layout`}
        style={rowPadding(isRightSide, 1)}
        className={`group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0 ${
          isSelected ? 'tree-item-selected font-medium' : 'tree-item'
        } ${isDragging ? 'opacity-40' : ''}`}
      >
        {isRightSide && gear}
        <span className="w-4 h-4 flex items-center justify-center opacity-80 shrink-0">
          <FieldTypeIcon type={field.field_type} className="w-3.5 h-3.5" />
        </span>
        <span className="text-[13px] tracking-tight truncate min-w-0">{field.label}</span>
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          {field.is_required && (
            <span className="blueprint-required-tag select-none" title="Required field">
              REQ
            </span>
          )}
          {field.field_type === 'select' && (
            <span className="blueprint-builtin-tag select-none" title={`${field.options?.length || 0} choices`}>
              {field.options?.length || 0} opts
            </span>
          )}
          {placed && <PlacedCheck />}
          {!isRightSide && gear}
        </span>
      </div>
      <TemplateFieldActionMenu
        field={field}
        menu={menu}
        position={position}
        onUpdateField={onUpdateField}
        onDeleteField={onDeleteField}
        onMoveField={(_, direction) => move(direction)}
        canMoveUp={moveWithinGroup(fields, field.id, 'up') !== null}
        canMoveDown={moveWithinGroup(fields, field.id, 'down') !== null}
        onPlace={onPlace}
        placeTarget={placeTarget}
      />
    </>
  );
}

export default function TemplateBlueprintTree({
  template,
  selectedFieldId,
  searchQuery = '',
  filterGroups = [],
  unplacedOnly = false,
  collapsedGroups,
  onToggleGroup,
  placedFieldIds,
  placedBuiltins,
  placeTarget,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onReorderFields,
  onPlaceField,
  onPlaceBuiltin,
  isLoading = false,
  position = 'left',
}: TemplateBlueprintTreeProps) {
  const isRightSide = position === 'right';
  const fields = useMemo(() => template?.fields ?? [], [template?.fields]);
  const groups = useMemo(
    () =>
      blueprintGroups({
        fields,
        placedFieldIds: new Set(placedFieldIds),
        placedBuiltins,
        query: searchQuery,
        filter: filterGroups,
        unplacedOnly,
      }),
    [fields, placedFieldIds, placedBuiltins, searchQuery, filterGroups, unplacedOnly]
  );
  // A search shows every match, so it opens the groups it leaves
  const isSearching = searchQuery.trim().length > 0;

  if (!template) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center gap-2 text-xs text-content-muted">
        {isLoading ? (
          <>
            <HourglassIcon className="w-5 h-5 animate-spin" />
            <span>Loading the template&apos;s fields...</span>
          </>
        ) : (
          <span>No template is open for editing.</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto primary-panel-scroll p-1 flex flex-col gap-1 select-none">
      {groups.length === 0 ? (
        <div className="py-4 px-2 text-center text-xs text-content-muted italic">
          {unplacedOnly && !isSearching && filterGroups.length === 0
            ? 'Everything is placed in the layout.'
            : 'Nothing matches the search / filter.'}
        </div>
      ) : (
        groups.map((group) => (
          <GroupRow
            key={group.id}
            group={group}
            isOpen={isSearching || !collapsedGroups.has(group.id)}
            onToggle={() => onToggleGroup(group.id)}
            isRightSide={isRightSide}
          >
            {group.rows.map((row) =>
              row.kind === 'builtin' ? (
                <BuiltinRow
                  key={row.key}
                  builtinKey={row.key}
                  label={row.label}
                  placed={row.placed}
                  isRightSide={isRightSide}
                  position={position}
                  placeTarget={placeTarget}
                  onPlace={() => onPlaceBuiltin(row.key)}
                />
              ) : (
                <FieldRow
                  key={row.field.id}
                  field={row.field}
                  fields={fields}
                  placed={row.placed}
                  isSelected={selectedFieldId === row.field.id}
                  isRightSide={isRightSide}
                  position={position}
                  placeTarget={placeTarget}
                  onSelect={() => onSelectField(row.field.id)}
                  onPlace={() => onPlaceField(row.field.id)}
                  onUpdateField={onUpdateField}
                  onDeleteField={onDeleteField}
                  onReorderFields={onReorderFields}
                />
              )
            )}
          </GroupRow>
        ))
      )}
    </div>
  );
}
