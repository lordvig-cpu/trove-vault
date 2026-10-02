import type { FieldDefinition } from '@/types/field';
import type {
  BuiltinKey,
  ContentBinding,
  FlexComponentNode,
  FlexContainerNode,
  FlexGap,
  TextStyle,
} from '@/types/layout';
import { buildContainer, collectLabels, newNodeId, uniqueLabel } from '@/lib/layoutTree';
import { BUILTIN_LABELS, TEXT_PRESETS, displayStylesFor, fieldOf } from '@/lib/layoutContent';

/* ==========================================================================
   Pre-defined content. A preset is not a special component: it is a pure function that builds an
   ordinary subtree of containers and content, which is then inserted into the layout. After that it
   is exactly what the user would have built by hand -- every piece can be restyled, reordered or
   deleted, and nothing tracks the template's fields afterwards. The same builders will back the
   "apply a simple template" button later.
   ========================================================================== */

export type PresetKind = 'fieldList' | 'header' | 'statRow';

/** One value a preset includes: a built-in item value or a template field. */
export type PresetEntry = Exclude<ContentBinding, { kind: 'static' }>;

/** Field list only: labels beside their values, or label on the left and value on the right. */
export type FieldListStyle = 'inline' | 'split';

export interface PresetRequest {
  kind: PresetKind;
  /** What to include, in order. */
  entries: PresetEntry[];
  /** Field list only; default 'split'. */
  style?: FieldListStyle;
}

/** The presets offered, with the built-in values each one can include. */
export const PRESET_INFO: Record<PresetKind, { label: string; description: string; builtins: BuiltinKey[] }> = {
  fieldList: {
    label: 'Field List',
    description: 'Label and value rows for the fields you pick',
    builtins: ['name', 'collections', 'created'],
  },
  header: {
    label: 'Header',
    description: 'Picture on the left, name and details beside it',
    builtins: ['image', 'name', 'collections', 'created'],
  },
  statRow: {
    label: 'Stat Row',
    description: 'A row of big-number cards, one per field',
    builtins: ['created', 'collections', 'subitems'],
  },
};

/** What a preset starts with ticked in the picker: for a header the usual three; for a stat row every
 *  number field; for a field list every template field. */
export function defaultEntries(kind: PresetKind, fields: FieldDefinition[]): PresetEntry[] {
  if (kind === 'header') {
    return (['image', 'name', 'collections'] as BuiltinKey[]).map((key) => ({ kind: 'builtin', key }));
  }
  const wanted = kind === 'statRow' ? fields.filter((f) => f.field_type === 'number') : fields;
  return wanted.map((f) => ({ kind: 'field', field_id: f.id }));
}

/** The name an entry goes by in a picker or a row label. */
export function entryLabel(entry: PresetEntry, fields: FieldDefinition[]): string {
  return entry.kind === 'builtin' ? BUILTIN_LABELS[entry.key] : fieldOf(entry, fields)?.label ?? 'Field';
}

/** Hands out container names that are free in the layout, and keeps what it hands out reserved so one
 *  preset never repeats a name within itself. */
function namer(root: FlexContainerNode): (base: string) => string {
  const taken = collectLabels(root);
  return (base) => {
    const label = uniqueLabel(base, taken);
    taken.add(label);
    return label;
  };
}

const container = (name: string, options: Partial<FlexContainerNode>): FlexContainerNode =>
  buildContainer({ wrap: false, padding: '0px', ...options, label: name }, name, options.direction === 'row' ? 'row' : 'column');

const bound = (entry: PresetEntry, extra: Partial<FlexComponentNode> = {}): FlexComponentNode => ({
  id: newNodeId('comp'),
  nodeType: 'component',
  componentType: 'field',
  field_id: entry.kind === 'field' ? entry.field_id : null,
  binding: entry,
  ...extra,
});

/** A fixed piece of text, styled like a label: the left half of a split field-list row. */
const caption = (text: string): FlexComponentNode => ({
  id: newNodeId('comp'),
  nodeType: 'component',
  componentType: 'note',
  binding: { kind: 'static', text },
  textStyle: { ...TEXT_PRESETS.label },
});

const GAP: Record<'tight' | 'normal' | 'roomy', FlexGap> = { tight: 4, normal: 8, roomy: 16 };

function buildFieldList(root: FlexContainerNode, entries: PresetEntry[], fields: FieldDefinition[], style: FieldListStyle) {
  const name = namer(root);
  const rows = entries.map((entry): FlexContainerNode | FlexComponentNode => {
    if (style === 'inline') {
      return bound(entry, { contentLabel: { show: true, position: 'left' } });
    }
    // Split: a row holding the label on the left and the value on the right.
    const text = entryLabel(entry, fields);
    return container(name(text), {
      direction: 'row',
      justify: 'between',
      align: 'center',
      gap: GAP.normal,
      children: [
        caption(text),
        bound(entry, { contentLabel: { show: false, position: 'above' }, textStyle: { align: 'right' } }),
      ],
    });
  });
  return container(name('Field List'), { direction: 'column', gap: GAP.normal, children: rows });
}

function buildHeader(root: FlexContainerNode, entries: PresetEntry[]) {
  const name = namer(root);
  const has = (key: BuiltinKey) => entries.find((e) => e.kind === 'builtin' && e.key === key);
  const image = has('image');
  const details = entries.filter((e) => !(e.kind === 'builtin' && e.key === 'image'));

  const children: (FlexContainerNode | FlexComponentNode)[] = [];
  if (image) {
    // Content has no width of its own, so the picture gets a fixed-width container of its own.
    children.push(
      container(name('Header Image'), {
        direction: 'column',
        sizing: { type: 'fixed', value: '160px' },
        children: [bound(image, { display: { style: 'image-cover', aspectRatio: '1 / 1' } })],
      })
    );
  }
  if (details.length > 0) {
    children.push(
      container(name('Header Text'), {
        direction: 'column',
        gap: GAP.tight,
        sizing: { type: 'fill' },
        children: details.map((e) => bound(e)),
      })
    );
  }
  return container(name('Header'), { direction: 'row', gap: GAP.roomy, align: 'center', children });
}

function buildStatRow(root: FlexContainerNode, entries: PresetEntry[], fields: FieldDefinition[]) {
  const name = namer(root);
  const stat: TextStyle = { fontSize: 28, fontWeight: 800, align: 'center' };
  const cards = entries.map((entry) => {
    const binding = entry;
    const styles = displayStylesFor(binding, fields);
    return container(name(`${entryLabel(entry, fields)} Card`), {
      direction: 'column',
      isCard: true,
      padding: '12px',
      gap: GAP.tight,
      align: 'center',
      sizing: { type: 'fill' },
      children: [
        bound(entry, {
          contentLabel: { show: true, position: 'above' },
          labelStyle: { align: 'center' },
          textStyle: stat,
          ...(styles.includes('stat') ? { display: { style: 'stat' as const } } : null),
        }),
      ],
    });
  });
  return container(name('Stat Row'), { direction: 'row', wrap: true, gap: GAP.normal, children: cards });
}

/**
 * The container subtree for a preset request, with every container name unique within `root`
 * (a second Field List becomes "Field List 2"). Pure: it does not touch the layout; the caller
 * inserts the result. Entries that no longer exist in `fields` are skipped.
 */
export function buildPreset(
  root: FlexContainerNode,
  request: PresetRequest,
  fields: FieldDefinition[]
): FlexContainerNode {
  const entries = request.entries.filter((e) => e.kind === 'builtin' || fieldOf(e, fields));
  switch (request.kind) {
    case 'header':
      return buildHeader(root, entries);
    case 'statRow':
      return buildStatRow(root, entries, fields);
    default:
      return buildFieldList(root, entries, fields, request.style ?? 'split');
  }
}
