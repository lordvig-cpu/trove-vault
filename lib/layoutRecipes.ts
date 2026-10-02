import type { FieldDefinition } from '@/types/field';
import {
  createDefaultFlexLayout,
  type BuiltinKey,
  type FlexComponentNode,
  type FlexContainerNode,
  type TemplateFlexLayoutConfig,
} from '@/types/layout';
import { buildContainer, buildUniqueContainer, insertChild, newNodeId } from '@/lib/layoutTree';
import { TEXT_PRESETS, buildBuiltinComponent } from '@/lib/layoutContent';
import { buildPreset, defaultEntries, type PresetEntry } from '@/lib/layoutPresets';

/* ==========================================================================
   Simple templates: a whole layout built in one click for people who don't want to design one. A
   recipe is a pure function of the template's fields that assembles the same pre-defined blocks
   (lib/layoutPresets.ts) inside cards, so what it produces is an ordinary layout that can be edited
   like any other.
   ========================================================================== */

export type RecipeId = 'classic' | 'specSheet' | 'gallery';

export const RECIPES: { id: RecipeId; label: string; description: string }[] = [
  { id: 'classic', label: 'Classic', description: 'Picture and name on top, then every field, then sub-items' },
  { id: 'specSheet', label: 'Spec Sheet', description: 'Name, big-number stats, then the remaining fields' },
  { id: 'gallery', label: 'Gallery', description: 'A poster-style picture beside the name and fields' },
];

const builtin = (...keys: BuiltinKey[]): PresetEntry[] => keys.map((key) => ({ kind: 'builtin', key }));

/** A section heading: fixed text in the heading text style. */
const heading = (text: string): FlexComponentNode => ({
  id: newNodeId('comp'),
  nodeType: 'component',
  componentType: 'note',
  binding: { kind: 'static', text },
  textStyle: { ...TEXT_PRESETS.heading },
});

/** The layout under construction: the Body plus a way to add one titled card of content at a time. */
class Assembler {
  root: FlexContainerNode;
  constructor() {
    this.root = { ...createDefaultFlexLayout([]).root, children: [] };
  }

  /** Adds a card (named uniquely) holding an optional heading and the given content. */
  card(name: string, title: string | null, content: (FlexContainerNode | FlexComponentNode)[]) {
    if (content.length === 0) return;
    const card = buildUniqueContainer(
      this.root,
      {
        label: name,
        direction: 'column',
        isCard: true,
        padding: '16px',
        gap: 12,
        wrap: false,
        children: [...(title ? [heading(title)] : []), ...content],
      },
      name,
      'column'
    );
    this.root = insertChild(this.root, this.root.id, card);
  }

  /** Adds a bare block (no card around it) to the Body. */
  bare(block: FlexContainerNode | FlexComponentNode) {
    this.root = insertChild(this.root, this.root.id, block);
  }

  config(): TemplateFlexLayoutConfig {
    return { version: 2, root: this.root };
  }
}

/**
 * The full layout for a recipe, built from `fields` (the template's own, so a recipe adapts to
 * whatever the template has: no number fields means no stat row, no fields means no field list).
 */
export function buildRecipe(id: RecipeId, fields: FieldDefinition[]): TemplateFlexLayoutConfig {
  const a = new Assembler();
  const numberFields = defaultEntries('statRow', fields);
  const otherFields: PresetEntry[] = fields.filter((f) => f.field_type !== 'number').map((f) => ({ kind: 'field', field_id: f.id }));
  const allFields = defaultEntries('fieldList', fields);

  if (id === 'classic') {
    a.card('Header Card', null, [buildPreset(a.root, { kind: 'header', entries: defaultEntries('header', fields) }, fields)]);
    a.card('Details', 'Details', allFields.length ? [buildPreset(a.root, { kind: 'fieldList', entries: allFields, style: 'split' }, fields)] : []);
    a.card('Sub-items', 'Sub-items', [{ ...buildBuiltinComponent('subitems'), id: newNodeId('comp'), nodeType: 'component' as const, contentLabel: { show: false, position: 'above' as const } }]);
  } else if (id === 'specSheet') {
    a.card('Title Card', null, [buildPreset(a.root, { kind: 'header', entries: builtin('name', 'collections', 'created') }, fields)]);
    if (numberFields.length) a.bare(buildPreset(a.root, { kind: 'statRow', entries: numberFields }, fields));
    a.card('Specifications', 'Specifications', otherFields.length ? [buildPreset(a.root, { kind: 'fieldList', entries: otherFields, style: 'split' }, fields)] : []);
  } else {
    // A poster on the left (its container gives it a width, since content has none), the name, the
    // collections and an inline field list on the right.
    const poster = buildContainer(
      { label: 'Poster', direction: 'column', sizing: { type: 'fixed', value: '320px' }, wrap: false, padding: '0px' },
      'Poster',
      'column'
    );
    poster.children = [{ ...buildBuiltinComponent('image'), id: newNodeId('comp'), nodeType: 'component' as const, display: { style: 'image-cover' as const, aspectRatio: '3 / 4' } }];
    const info = buildContainer(
      {
        label: 'Poster Details',
        direction: 'column',
        gap: 16,
        wrap: false,
        padding: '0px',
        sizing: { type: 'fill' },
        children: [
          ...(buildPreset(a.root, { kind: 'header', entries: builtin('name', 'collections') }, fields).children),
          ...(allFields.length ? [buildPreset(a.root, { kind: 'fieldList', entries: allFields, style: 'inline' }, fields)] : []),
        ],
      },
      'Poster Details',
      'column'
    );
    const row = buildContainer({ label: 'Gallery Row', direction: 'row', gap: 24, align: 'start', wrap: false, padding: '0px', children: [poster, info] }, 'Gallery Row', 'row');
    a.card('Gallery', null, [row]);
  }
  return a.config();
}
