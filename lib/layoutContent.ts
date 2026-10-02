import type { CSSProperties } from 'react';
import type { FieldDefinition } from '@/types/field';
import type { ItemRecord } from '@/types/item';
import type {
  BuiltinKey,
  ContentBinding,
  ContentDisplayStyle,
  FlexComponentNode,
  TextStyle,
} from '@/types/layout';

/* ==========================================================================
   Content elements: what a component in the layout tree shows (binding), how it is drawn (display
   style) and how it looks (text style, box look). Pure functions only; the renderer
   (components/template-canvas/ContentValue.tsx) and the editor's flyouts both read from here.

   The rule behind it: a container owns Layout, Spacing and Size; content only has visual styling.
   ========================================================================== */

/** Display names of the built-in item values, in the order the Content tab lists them. */
export const BUILTIN_LABELS: Record<BuiltinKey, string> = {
  name: 'Name',
  image: 'Image',
  collections: 'Collections',
  created: 'Created',
  subitems: 'Sub-items',
};

/** The shape of the data a binding yields; it decides which display styles make sense. */
export type ContentDataKind = 'text' | 'number' | 'boolean' | 'select' | 'date' | 'image' | 'list';

/** What a component shows. A component saved before bindings existed has none, so it is derived
 *  from the legacy `field_id` (a bound field) or note text (static text); null = a legacy
 *  placeholder (table / media / stat / divider) that has no data. */
export function bindingOf(component: FlexComponentNode): ContentBinding | null {
  if (component.binding) return component.binding;
  if (component.componentType === 'field' && component.field_id != null) {
    return { kind: 'field', field_id: component.field_id };
  }
  if (component.componentType === 'note' && typeof component.custom_props?.text === 'string') {
    return { kind: 'static', text: component.custom_props.text };
  }
  return null;
}

/** The template field a binding points at, if it is a field binding and the field still exists. */
export function fieldOf(binding: ContentBinding | null, fields: FieldDefinition[]): FieldDefinition | undefined {
  return binding?.kind === 'field' ? fields.find((f) => f.id === binding.field_id) : undefined;
}

/** The kind of data a binding yields. A field binding whose field was deleted reads as text. */
export function dataKindOf(binding: ContentBinding, fields: FieldDefinition[]): ContentDataKind {
  if (binding.kind === 'static') return 'text';
  if (binding.kind === 'builtin') {
    switch (binding.key) {
      case 'image': return 'image';
      case 'created': return 'date';
      case 'collections':
      case 'subitems': return 'list';
      default: return 'text';
    }
  }
  return fieldOf(binding, fields)?.field_type ?? 'text';
}

const STYLES_BY_KIND: Record<ContentDataKind, ContentDisplayStyle[]> = {
  text: ['text'],
  number: ['number', 'badge', 'stat'],
  boolean: ['checkbox', 'toggle', 'pill', 'yesno'],
  select: ['text', 'badge'],
  date: ['date-short', 'date-long', 'date-iso'],
  image: ['image-cover', 'image-contain'],
  list: ['list', 'chips'],
};

/** The display styles offered for a binding, default first. Collections default to chips. */
export function displayStylesFor(binding: ContentBinding, fields: FieldDefinition[]): ContentDisplayStyle[] {
  const styles = STYLES_BY_KIND[dataKindOf(binding, fields)];
  return binding.kind === 'builtin' && binding.key === 'collections' ? [...styles].reverse() : styles;
}

/** The style a component is drawn in: its own when that is valid for its data, else the default. */
export function effectiveDisplayStyle(
  component: FlexComponentNode,
  binding: ContentBinding,
  fields: FieldDefinition[]
): ContentDisplayStyle {
  const offered = displayStylesFor(binding, fields);
  const chosen = component.display?.style;
  return chosen && offered.includes(chosen) ? chosen : offered[0];
}

/* --------------------------------------------------------------------------
   Values
   -------------------------------------------------------------------------- */

export type ResolvedValue =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number | null }
  | { kind: 'boolean'; value: boolean | null }
  | { kind: 'date'; value: string | null }
  | { kind: 'image'; value: string | null }
  | { kind: 'list'; value: string[] };

/** The data a layout is drawn with: a real item (and the names of the collections it is in), or none,
 *  in which case values are samples. */
export interface ContentData {
  item?: ItemRecord | null;
  collectionNames?: Record<number, string>;
}

/** Stand-in values shown when there is no item to draw (a template with no items yet). */
const SAMPLE_DATE = '2025-06-15';

function sampleValue(binding: ContentBinding, fields: FieldDefinition[]): ResolvedValue {
  const kind = dataKindOf(binding, fields);
  const field = fieldOf(binding, fields);
  switch (kind) {
    case 'number': return { kind, value: 42 };
    case 'boolean': return { kind, value: true };
    case 'date': return { kind, value: SAMPLE_DATE };
    case 'image': return { kind, value: null };
    case 'list':
      return {
        kind,
        value:
          binding.kind === 'builtin' && binding.key === 'collections'
            ? ['Collection A', 'Collection B']
            : ['Sub-item 1', 'Sub-item 2'],
      };
    case 'select': return { kind: 'text', value: field?.options?.[0] ?? 'Option' };
    default:
      if (binding.kind === 'static') return { kind: 'text', value: binding.text };
      return { kind: 'text', value: binding.kind === 'builtin' && binding.key === 'name' ? 'Item Name' : 'Sample text' };
  }
}

/** The value a binding yields for `data.item`; samples when there is no item. A static binding is
 *  always its own text. A field the item has no value for yields an empty value (not a sample). */
export function resolveValue(
  binding: ContentBinding,
  data: ContentData,
  fields: FieldDefinition[]
): ResolvedValue {
  if (binding.kind === 'static') return { kind: 'text', value: binding.text };
  const item = data.item;
  if (!item) return sampleValue(binding, fields);

  if (binding.kind === 'builtin') {
    switch (binding.key) {
      case 'name': return { kind: 'text', value: item.name };
      case 'image': return { kind: 'image', value: item.image_url ?? null };
      case 'created': return { kind: 'date', value: item.created_at ?? null };
      case 'collections': {
        const ids = item.collection_ids ?? (item.collection_id != null ? [item.collection_id] : []);
        return { kind: 'list', value: ids.map((id) => data.collectionNames?.[id]).filter((n): n is string => !!n) };
      }
      case 'subitems': return { kind: 'list', value: (item.children ?? []).map((c) => c.name) };
    }
  }

  const field = fieldOf(binding, fields);
  const raw = field ? item.attributes?.[field.name] : undefined;
  switch (field?.field_type) {
    case 'number': {
      const n = raw === undefined || raw === null || raw === '' ? NaN : Number(raw);
      return { kind: 'number', value: Number.isNaN(n) ? null : n };
    }
    case 'boolean': return { kind: 'boolean', value: raw === undefined || raw === null ? null : raw === true || raw === 'true' };
    case 'date': return { kind: 'date', value: raw ? String(raw) : null };
    default: return { kind: 'text', value: raw === undefined || raw === null ? '' : String(raw) };
  }
}

/** A date value drawn per a date display style. Calendar dates ("2025-06-15") are formatted in UTC so
 *  they never shift a day with the viewer's time zone. */
export function formatDate(iso: string, style: ContentDisplayStyle): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (style === 'date-iso') return date.toISOString().slice(0, 10);
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: style === 'date-long' ? 'long' : 'short',
    day: 'numeric',
  });
}

/* --------------------------------------------------------------------------
   Label
   -------------------------------------------------------------------------- */

/** The label text: the component's own, else the field's, else the built-in's name. */
export function labelTextOf(
  component: FlexComponentNode,
  binding: ContentBinding | null,
  fields: FieldDefinition[]
): string {
  if (component.label) return component.label;
  const field = fieldOf(binding, fields);
  if (field) return field.label;
  if (binding?.kind === 'builtin') return BUILTIN_LABELS[binding.key];
  return '';
}

/** Whether the label shows: as set, else shown for template fields (as it always was) and hidden for
 *  built-ins and static text (a Name is usually a title with no caption). */
export function isLabelShown(component: FlexComponentNode, binding: ContentBinding | null): boolean {
  return component.contentLabel?.show ?? binding?.kind === 'field';
}

/* --------------------------------------------------------------------------
   Styles
   -------------------------------------------------------------------------- */

export type TextPresetName = 'title' | 'heading' | 'body' | 'caption' | 'label';

/** Starting points for a text style. Picking one copies its values onto the element; changing a preset
 *  later does not restyle elements that already used it. */
export const TEXT_PRESETS: Record<TextPresetName, TextStyle> = {
  title: { fontSize: 28, fontWeight: 800, lineHeight: 1.15 },
  heading: { fontSize: 18, fontWeight: 700, lineHeight: 1.25 },
  body: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
  label: { fontSize: 11, fontWeight: 700, transform: 'uppercase', letterSpacing: 0.6 },
};

/** The style a value starts from before the element's own overrides: a Name is a title, the rest body. */
export function defaultTextStyleFor(binding: ContentBinding | null): TextStyle {
  return binding?.kind === 'builtin' && binding.key === 'name' ? TEXT_PRESETS.title : TEXT_PRESETS.body;
}

/** A value's effective text style: its default, then the element's overrides. */
export function effectiveTextStyle(component: FlexComponentNode, binding: ContentBinding | null): TextStyle {
  return { ...defaultTextStyleFor(binding), ...component.textStyle };
}

/** A label's effective text style: the label preset, then the element's overrides. */
export function effectiveLabelStyle(component: FlexComponentNode): TextStyle {
  return { ...TEXT_PRESETS.label, ...component.labelStyle };
}

/** A text style as CSS. An unset color is left out, so the text follows the app theme's ink. */
export function textStyleCss(style: TextStyle): CSSProperties {
  return {
    ...(style.fontSize !== undefined ? { fontSize: `${style.fontSize}px` } : null),
    ...(style.fontWeight !== undefined ? { fontWeight: style.fontWeight } : null),
    ...(style.color ? { color: style.color } : null),
    ...(style.align ? { textAlign: style.align } : null),
    ...(style.transform ? { textTransform: style.transform } : null),
    ...(style.italic ? { fontStyle: 'italic' } : null),
    ...(style.underline ? { textDecoration: 'underline' } : null),
    ...(style.lineHeight !== undefined ? { lineHeight: style.lineHeight } : null),
    ...(style.letterSpacing !== undefined ? { letterSpacing: `${style.letterSpacing}px` } : null),
  };
}

/** The box properties a container's Appearance section and a content element share. */
export interface BoxLook {
  background?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowColor?: string;
}

/** A box look as CSS. Applied inline so it wins over any edit-mode tint or frame class. The shadow is
 *  drawn at 40% strength so it stays soft in any color, and a border width with no color falls back to
 *  a neutral theme border. */
export function boxLookCss(look: BoxLook): CSSProperties {
  return {
    ...(look.background ? { backgroundColor: look.background } : null),
    ...(look.borderWidth
      ? { border: `${look.borderWidth}px solid ${look.borderColor || 'var(--primary-border-subtle)'}` }
      : null),
    ...(look.borderRadius ? { borderRadius: `${look.borderRadius}px` } : null),
    ...(look.shadowY || look.shadowBlur
      ? {
          boxShadow: `0 ${look.shadowY ?? 0}px ${look.shadowBlur ?? 0}px color-mix(in srgb, ${
            look.shadowColor || 'var(--pole-shade)'
          } 40%, transparent)`,
        }
      : null),
  };
}

/* --------------------------------------------------------------------------
   Editing
   -------------------------------------------------------------------------- */

/** Everything on a component that changes when it is rebound: the binding itself, the element kind and
 *  legacy `field_id` that go with it, and a reset label and display style (a new value starts with its
 *  own defaults rather than the old value's overrides). Typography and box look are kept. */
export function bindingPatch(binding: ContentBinding): Partial<FlexComponentNode> {
  return {
    binding,
    componentType: binding.kind === 'static' ? 'note' : 'field',
    field_id: binding.kind === 'field' ? binding.field_id : null,
    label: undefined,
    display: undefined,
  };
}

/** `current` with the preset's size, weight, line height, case and letter spacing in place of its own.
 *  Color, alignment, italic and underline are kept: a preset is a typographic starting point, not a
 *  full restyle. */
export function applyTextPreset(current: TextStyle | undefined, name: TextPresetName): TextStyle {
  const preset = TEXT_PRESETS[name];
  return {
    ...current,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    transform: preset.transform,
    letterSpacing: preset.letterSpacing,
  };
}

/** `current` with `partial` merged in, dropping any key set to undefined; undefined when nothing is
 *  left, so a fully reset style stores nothing. */
export function mergeTextStyle(current: TextStyle | undefined, partial: Partial<TextStyle>): TextStyle | undefined {
  const merged: Record<string, unknown> = { ...current, ...partial };
  for (const key of Object.keys(merged)) if (merged[key] === undefined) delete merged[key];
  return Object.keys(merged).length ? (merged as TextStyle) : undefined;
}

/** A new content element bound to a built-in item value, ready to insert in a container. A Name or an
 *  Image is drawn bare (a title, a picture); the list and date values start with their label shown so
 *  the reader knows what they are. Everything else (display style, text style) starts at its default. */
export function buildBuiltinComponent(key: BuiltinKey): Omit<FlexComponentNode, 'id' | 'nodeType'> {
  const showsLabel = key !== 'name' && key !== 'image';
  return {
    componentType: 'field',
    binding: { kind: 'builtin', key },
    ...(showsLabel ? { contentLabel: { show: true, position: 'above' as const } } : null),
  };
}
