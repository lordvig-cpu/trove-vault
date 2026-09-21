import type { Json, TableRow } from '@/types/database';
import type { ItemRecord } from '@/types/item';
import type { ItemTemplate } from '@/types/template';
import type { FieldDefinition, FieldType } from '@/types/field';

/* ==========================================================================
   Row -> app-type mappers. The database client returns rows exactly as stored (JSON columns are
   `Json`, nullable columns are `| null`); the app works with friendlier record types. Every
   conversion lives here so the rest of the code never casts.
   ========================================================================== */

const FIELD_TYPES: readonly FieldType[] = ['text', 'number', 'boolean', 'select', 'date'];

/** A JSON column as a plain object (anything else, including null, becomes an empty object). */
export function toRecord(json: Json | null | undefined): Record<string, unknown> {
  return json && typeof json === 'object' && !Array.isArray(json) ? (json as Record<string, unknown>) : {};
}

/** A JSON column as a list of strings, or null when it is not an array. */
export function toStringList(json: Json | null | undefined): string[] | null {
  return Array.isArray(json) ? json.filter((v): v is string => typeof v === 'string') : null;
}

/** A value to store in a JSON column. Form data and layouts are plain JSON-safe objects. */
export function toJson(value: unknown): Json {
  return value as Json;
}

export function toItemRecord(row: TableRow<'items'>): ItemRecord {
  return { ...row, attributes: toRecord(row.attributes), created_at: row.created_at ?? undefined };
}

export function toFieldDefinition(row: TableRow<'item_template_fields'>): FieldDefinition {
  const fieldType = FIELD_TYPES.find((t) => t === row.field_type) ?? 'text';
  return { ...row, field_type: fieldType, options: toStringList(row.options) };
}

export function toItemTemplate(row: TableRow<'item_templates'>, fields?: FieldDefinition[]): ItemTemplate {
  const { layout_config, ...rest } = row;
  return {
    ...rest,
    icon: row.icon ?? '📦',
    // Only a current layout is meaningful; the editor validates it again when loading
    layout_config: layout_config ? (layout_config as unknown as ItemTemplate['layout_config']) : null,
    ...(fields ? { fields } : {}),
  };
}
