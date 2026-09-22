import type { FieldDefinition } from './field';

/* ==========================================================================
   WORKSPACE LAYOUT & DOCKING TYPES
   Defines positions, docking targets, and state models for reconfigurable
   workspace panels (Primary Side Panel, Secondary Side Panel, Bottom Panel).
   ========================================================================== */

export type PrimarySidebarPosition = 'left' | 'right';
export type SecondarySidebarPosition = 'right' | 'left';
export type BottomPanelPosition = 'bottom' | 'right';

/* ==========================================================================
   TYPE DEFINITIONS: Template Flexbox Layout Engine (Container Tree)
   Contract for nested Auto-Layout / Flexbox container architecture.
   ========================================================================== */

export type FlexDirection = 'row' | 'column' | 'none';
export type FlexGap = 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32;
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around';
export type FlexSizingType = 'fill' | 'fixed' | 'auto';

export interface FlexSizing {
  type: FlexSizingType; // 'fill' (flex: 1 1 0%), 'fixed' (flex: 0 0 [value]), 'auto' (flex: 0 0 auto)
  value?: string;       // e.g. "320px", "50%", "280px" when type === 'fixed'
  height?: string;      // optional explicit height e.g. "240px"
  minHeight?: string;   // optional min-height e.g. "160px"
}

/** Parse a plain "NNNpx" (or bare number) CSS length; returns null for %, calc(), etc. */
export function parsePxValue(raw?: string | null): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)(?:px)?$/i);
  return m ? parseFloat(m[1]) : null;
}

const fmtNum = (n: number) => `${Math.round(n * 10) / 10}`;

/**
 * Size of ONE of two equal halves of `raw`. Supports px, %, and calc(P% - Qpx);
 * anything else (fill/unknown) is simply half the parent: 50%.
 */
export function halveCssLength(raw?: string | null): string {
  const val = (raw || '').trim();
  const px = parsePxValue(val);
  if (px !== null && /px$/i.test(val)) return `${fmtNum(px / 2)}px`;
  const pct = val.match(/^(\d+(?:\.\d+)?)%$/);
  if (pct) return `${fmtNum(parseFloat(pct[1]) / 2)}%`;
  const calc = val.match(/^calc\(\s*(\d+(?:\.\d+)?)%\s*-\s*(\d+(?:\.\d+)?)px\s*\)$/i);
  if (calc) {
    return `calc(${fmtNum(parseFloat(calc[1]) / 2)}% - ${fmtNum(parseFloat(calc[2]) / 2)}px)`;
  }
  return '50%';
}

/** Preview widths offered in the editor zoom panel (editor-only; templates themselves are fluid). */
export const BODY_WIDTH_PRESETS = [2560, 1920, 1440, 1280, 1024, 768, 390];

export type LayoutBlockType =
  | 'field'       // Bound to a field definition
  | 'table'       // Multi-row attribute list or table
  | 'media'       // Image or gallery placeholder box
  | 'note'        // Markdown note or rich text block
  | 'stat'        // Big number / metric badge
  | 'divider';    // Section separator

export type LayoutVariant =
  | 'standard'    // Standard card with label & value
  | 'compact'     // Compact horizontal badge/pill
  | 'stat'        // Large featured number / metric
  | 'table_row'   // Minimal table row format
  | 'hero'        // Large hero card format (image / banner)
  | 'callout';    // Accent callout box

export interface FlexComponentNode {
  id: string;
  nodeType: 'component';
  componentType: LayoutBlockType;
  field_id?: number | null;
  field_ids?: number[];  // For tables or multi-field groups
  label?: string;
  variant: LayoutVariant;
  sizing: FlexSizing;
  custom_props?: Record<string, unknown>;
}

export interface FlexContainerNode {
  id: string;
  nodeType: 'container';
  label?: string;
  direction: FlexDirection;
  gap: FlexGap;
  wrap: boolean;
  align: FlexAlign;
  justify: FlexJustify;
  padding?: number;     // e.g. 0, 8, 12, 16, 24
  sizing: FlexSizing;
  width?: string;       // optional explicit width e.g. "400px", "50%"
  height?: string;      // optional explicit height e.g. "250px"
  minHeight?: string;   // optional min-height e.g. "160px"
  minWidth?: string;    // optional min-width e.g. "300px"
  maxWidth?: string;    // optional max-width; on the Body it caps the content width (centered)
  maxHeight?: string;   // optional max-height e.g. "600px"
  stackBelow?: number;  // row containers stack into a column when narrower than this many px
  isCard?: boolean;     // Whether container renders with card background & border
  children: (FlexContainerNode | FlexComponentNode)[];
}

export type FlexLayoutNode = FlexContainerNode | FlexComponentNode;

/**
 * The direction a container actually lays out in. Every container is a row or a column; the legacy
 * unset value ('none') is what the canvas already rendered: a row, except the Body, which stacks.
 */
export function resolveDirection(container: FlexContainerNode, isRoot = false): 'row' | 'column' {
  if (container.direction === 'row' || container.direction === 'column') return container.direction;
  return isRoot ? 'column' : 'row';
}

/**
 * Direction a brand-new container starts with: the opposite of its parent's flow, so nesting
 * alternates naturally (a column Body holds rows, a row holds columns). An unset ('none') parent
 * renders as a row, except the Body, which stacks vertically.
 */
export function defaultChildDirection(parent: FlexContainerNode, isRoot = false): 'row' | 'column' {
  const effective = parent.direction === 'none' || !parent.direction ? (isRoot ? 'column' : 'row') : parent.direction;
  return effective === 'column' ? 'row' : 'column';
}

export interface TemplateFlexLayoutConfig {
  version: 2;
  root: FlexContainerNode;
}

/** True when a stored layout is a current (flex, version 2) layout. */
export function isFlexLayoutConfig(config: unknown): config is TemplateFlexLayoutConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as { version?: unknown; root?: unknown };
  return c.version === 2 && Boolean(c.root);
}

/**
 * Creates a sensible default Flexbox Container Layout from an array of field definitions.
 */
export function createDefaultFlexLayout(
  fields: Pick<FieldDefinition, 'id' | 'label'>[] = []
): TemplateFlexLayoutConfig {
  const componentChildren: FlexComponentNode[] = fields.map((f) => ({
    id: `comp-${f.id}`,
    nodeType: 'component' as const,
    componentType: 'field' as const,
    field_id: f.id,
    label: f.label,
    variant: 'standard' as const,
    sizing: { type: 'fixed' as const, value: '48%' },
  }));

  return {
    version: 2,
    root: {
      id: 'root-container',
      nodeType: 'container',
      label: 'Page Layout',
      direction: 'column',
      gap: 0,
      wrap: false,
      align: 'stretch',
      justify: 'start',
      padding: 0,
      sizing: { type: 'fill' },
      children: [
        {
          id: 'container-general',
          nodeType: 'container',
          label: 'General Information',
          direction: 'row',
          gap: 0,
          wrap: true,
          align: 'stretch',
          justify: 'start',
          padding: 0,
          isCard: true,
          sizing: { type: 'fill' },
          children: componentChildren,
        },
      ],
    },
  };
}

/**
 * Recursively searches a container tree for a container or component node by ID.
 */
export function findFlexNode(
  node: FlexContainerNode,
  id: string
): FlexLayoutNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    if (child.id === id) return child;
    if (child.nodeType === 'container') {
      const found = findFlexNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds the parent container node of a target child node ID.
 */
export function findParentFlexContainer(
  root: FlexContainerNode,
  childId: string
): FlexContainerNode | null {
  for (const child of root.children) {
    if (child.id === childId) return root;
    if (child.nodeType === 'container') {
      const parent = findParentFlexContainer(child, childId);
      if (parent) return parent;
    }
  }
  return null;
}

/**
 * Container IDs on the path from the root down to (but not including) the given node, root first.
 * Used to expand exactly the tree rows that must be open for a selected node to be visible.
 */
export function findAncestorContainerIds(root: FlexContainerNode, nodeId: string): string[] {
  const ids: string[] = [];
  let currentId = nodeId;
  while (true) {
    const parent = findParentFlexContainer(root, currentId);
    if (!parent) break;
    ids.push(parent.id);
    currentId = parent.id;
  }
  return ids.reverse();
}

/**
 * Recursively collects all field IDs bound to components in the container tree.
 */
export function collectPlacedFieldIds(node: FlexContainerNode): number[] {
  const ids: number[] = [];
  function traverse(n: FlexLayoutNode) {
    if (n.nodeType === 'component') {
      if (typeof n.field_id === 'number') ids.push(n.field_id);
      if (Array.isArray(n.field_ids)) ids.push(...n.field_ids);
    } else if (n.nodeType === 'container') {
      n.children.forEach(traverse);
    }
  }
  traverse(node);
  return ids;
}
