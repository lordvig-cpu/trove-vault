import type { FieldDefinition, FieldType } from '@/types/field';
import type { BuiltinKey } from '@/types/layout';
import { BUILTIN_LABELS } from '@/lib/layoutContent';

/* ==========================================================================
   The Blueprint panel's tree: every value a template's items have -- the built-in ones every item has (Name,
   Created, Image, Collections, Sub-items) and the template's own fields -- grouped by the kind of data it
   holds. Pure, so the grouping, search, filter and "missing only" rules are testable on their own.
   ========================================================================== */

export type BlueprintGroupId = 'text' | 'number' | 'select' | 'boolean' | 'date' | 'image' | 'collections' | 'subitems';

/** The groups in tree order, with the label each shows (also the filter menu's options). */
export const BLUEPRINT_GROUPS: { type: BlueprintGroupId; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'select', label: 'Choice' },
  { type: 'boolean', label: 'Yes/No' },
  { type: 'date', label: 'Date' },
  { type: 'image', label: 'Image' },
  { type: 'collections', label: 'Collections' },
  { type: 'subitems', label: 'Sub-Items' },
];

/** The built-in values, in the order they lead their groups, and the group each belongs to. */
export const BLUEPRINT_BUILTINS: { key: BuiltinKey; group: BlueprintGroupId }[] = [
  { key: 'name', group: 'text' },
  { key: 'created', group: 'date' },
  { key: 'image', group: 'image' },
  { key: 'collections', group: 'collections' },
  { key: 'subitems', group: 'subitems' },
];

/** A field's group is its type (an unknown type reads as text, as it does everywhere else). */
export function blueprintGroupOf(type: FieldType): BlueprintGroupId {
  return BLUEPRINT_GROUPS.some((g) => g.type === type) ? (type as BlueprintGroupId) : 'text';
}

export type BlueprintRow =
  | { kind: 'builtin'; key: BuiltinKey; label: string; placed: boolean }
  | { kind: 'field'; field: FieldDefinition; placed: boolean };

export interface BlueprintGroup {
  id: BlueprintGroupId;
  label: string;
  rows: BlueprintRow[];
}

export interface BlueprintOptions {
  fields: FieldDefinition[];
  placedFieldIds: ReadonlySet<number>;
  placedBuiltins: ReadonlySet<BuiltinKey>;
  /** Matches a row's label (and a field's key), case-insensitively. */
  query?: string;
  /** The groups to show; empty means every group (the filter menus' "empty = everything" convention). */
  filter?: readonly string[];
  /** Leave out what is already placed in the layout. */
  unplacedOnly?: boolean;
}

/** The groups to show, in order, each with its visible rows (built-ins first, then fields in field order).
 *  A group with no visible rows is left out. */
export function blueprintGroups({
  fields,
  placedFieldIds,
  placedBuiltins,
  query = '',
  filter = [],
  unplacedOnly = false,
}: BlueprintOptions): BlueprintGroup[] {
  const q = query.trim().toLowerCase();
  const matches = (...text: string[]) => !q || text.some((t) => t.toLowerCase().includes(q));
  const keep = (row: BlueprintRow) =>
    !(unplacedOnly && row.placed) &&
    (row.kind === 'builtin' ? matches(row.label) : matches(row.field.label, row.field.name));

  return BLUEPRINT_GROUPS.filter((group) => filter.length === 0 || filter.includes(group.type))
    .map((group) => {
      const builtins: BlueprintRow[] = BLUEPRINT_BUILTINS.filter((b) => b.group === group.type).map((b) => ({
        kind: 'builtin',
        key: b.key,
        label: BUILTIN_LABELS[b.key],
        placed: placedBuiltins.has(b.key),
      }));
      const own: BlueprintRow[] = fields
        .filter((field) => blueprintGroupOf(field.field_type) === group.type)
        .map((field) => ({ kind: 'field', field, placed: placedFieldIds.has(field.id) }));
      return { id: group.type, label: group.label, rows: [...builtins, ...own].filter(keep) };
    })
    .filter((group) => group.rows.length > 0);
}

/** How many values each group holds (built-ins included), for the filter menu's counts. */
export function blueprintGroupCounts(fields: FieldDefinition[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of BLUEPRINT_BUILTINS) counts[b.group] = (counts[b.group] ?? 0) + 1;
  for (const f of fields) {
    const group = blueprintGroupOf(f.field_type);
    counts[group] = (counts[group] ?? 0) + 1;
  }
  return counts;
}

/** Where a field moves for Move Up / Move Down within its group: the id order after swapping it with the
 *  nearest field of the same group in that direction, or null at the group's end. */
export function moveWithinGroup(fields: FieldDefinition[], fieldId: number, direction: 'up' | 'down'): number[] | null {
  const index = fields.findIndex((f) => f.id === fieldId);
  if (index < 0) return null;
  const group = blueprintGroupOf(fields[index].field_type);
  const step = direction === 'up' ? -1 : 1;
  let other = index + step;
  while (other >= 0 && other < fields.length && blueprintGroupOf(fields[other].field_type) !== group) other += step;
  if (other < 0 || other >= fields.length) return null;
  const ids = fields.map((f) => f.id);
  [ids[index], ids[other]] = [ids[other], ids[index]];
  return ids;
}
