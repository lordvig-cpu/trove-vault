import type { AdHocAttribute } from '@/components/item-form/AdHocAttributesEditor';
import type { FieldDefinition } from '@/types/field';

/* How an item's stored values are shown and saved by the item forms (hooks/useItemForm.ts): its template's
   fields, and every other value as a custom-field row. Pure, so it is covered by tests/pure-helpers.spec.ts. */

const isBlank = (value: unknown) => value === undefined || value === null || value === '';

/** How a stored value reads in a custom-field row. */
const rowText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

/** A custom-field row for a stored value (see AdHocAttribute's `original`). */
const rowFor = (key: string, value: unknown): AdHocAttribute => ({ key, value: rowText(value), original: value });

/** What a custom-field row saves: the stored value while its text is unchanged, else the text typed. */
export const rowValue = (row: AdHocAttribute): unknown =>
  'original' in row && row.value === rowText(row.original) ? row.original : row.value.trim();

/**
 * Splits an item's stored values between its template's fields and custom-field rows: every value whose key
 * is a field of the template fills that field, and every other one becomes a row, so the form shows (and can
 * edit or remove) everything the item holds. Blank values are left out of the rows.
 */
export function splitItemAttributes(
  attributes: Record<string, unknown>,
  fields: FieldDefinition[]
): { values: Record<string, unknown>; rows: AdHocAttribute[] } {
  const fieldNames = new Set(fields.map((field) => field.name));
  const values: Record<string, unknown> = {};
  const rows: AdHocAttribute[] = [];
  for (const [key, value] of Object.entries(attributes)) {
    if (fieldNames.has(key)) values[key] = value;
    else if (!isBlank(value)) rows.push(rowFor(key, value));
  }
  return { values, rows };
}
