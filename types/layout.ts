/* ==========================================================================
   WORKSPACE LAYOUT & DOCKING TYPES
   Defines positions, docking targets, and state models for reconfigurable
   workspace panels (Primary Side Panel, Secondary Side Panel, Bottom Panel).
   ========================================================================== */

export type PrimarySidebarPosition = 'left' | 'right';
export type SecondarySidebarPosition = 'right' | 'left';
export type BottomPanelPosition = 'bottom' | 'right';

export type PanelDockDropZone = 'left' | 'right' | 'bottom' | null;

export interface WorkspaceLayoutPreferences {
  primaryPosition: PrimarySidebarPosition;
  secondaryPosition: SecondarySidebarPosition;
  bottomPanelPosition: BottomPanelPosition;
  isPrimaryPinned: boolean;
  isSecondaryOpen: boolean;
  isBottomOpen: boolean;
}

/* ==========================================================================
   TYPE DEFINITIONS: Template Flexbox Layout Engine (Container Tree)
   Contract for nested Auto-Layout / Flexbox container architecture.
   ========================================================================== */

export type FlexDirection = 'row' | 'column';
export type FlexGap = 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32;
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around';
export type FlexSizingType = 'fill' | 'fixed' | 'auto';

export interface FlexSizing {
  type: FlexSizingType; // 'fill' (flex: 1 1 0%), 'fixed' (flex: 0 0 [value]), 'auto' (flex: 0 0 auto)
  value?: string;       // e.g. "320px", "50%", "280px" when type === 'fixed'
}

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
  custom_props?: Record<string, any>;
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
  isCard?: boolean;     // Whether container renders with card background & border
  children: (FlexContainerNode | FlexComponentNode)[];
}

export type FlexLayoutNode = FlexContainerNode | FlexComponentNode;

export interface TemplateFlexLayoutConfig {
  version: 2;
  root: FlexContainerNode;
}

/* ==========================================================================
   LEGACY 12-COLUMN GRID CONTRACT & MIGRATION ADAPTERS
   Preserved for backward compatibility and clean data migration.
   ========================================================================== */

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType;
  field_id?: number | null;
  label?: string;
  col_span: number;
  row_span: number;
  variant: LayoutVariant;
  custom_props?: Record<string, any>;
}

export interface LayoutSection {
  id: string;
  title: string;
  description?: string | null;
  columns?: number;
  is_collapsed?: boolean;
  blocks: LayoutBlock[];
}

export interface LegacyTemplateLayoutConfig {
  version: 1;
  sections: LayoutSection[];
}

export interface TemplateLayoutConfig {
  version: number;
  sections: LayoutSection[];
  root?: FlexContainerNode;
}

export function isFlexLayoutConfig(config: any): config is TemplateFlexLayoutConfig {
  return config && typeof config === 'object' && config.version === 2 && Boolean(config.root);
}

/**
 * Migrates a legacy 12-column grid layout into a modern Flexbox Container Tree.
 */
export function migrateGridToFlexLayout(config: any): TemplateFlexLayoutConfig {
  if (isFlexLayoutConfig(config)) {
    return config;
  }

  const legacySections: LayoutSection[] = config?.sections || [];

  const rootChildren: FlexContainerNode[] = legacySections.map((sec, secIdx) => {
    const componentChildren: FlexComponentNode[] = (sec.blocks || []).map((b) => ({
      id: b.id || `comp-${Math.random().toString(36).substring(2, 9)}`,
      nodeType: 'component' as const,
      componentType: b.type,
      field_id: b.field_id,
      label: b.label,
      variant: b.variant || 'standard',
      sizing: {
        type: b.col_span >= 12 ? 'fill' : 'fixed',
        value: b.col_span >= 12 ? undefined : `${Math.round((b.col_span / 12) * 100)}%`,
      },
    }));

    return {
      id: sec.id || `sec-${secIdx}`,
      nodeType: 'container' as const,
      label: sec.title || 'Section',
      direction: 'row' as const,
      gap: 12 as const,
      wrap: true,
      align: 'stretch' as const,
      justify: 'start' as const,
      padding: 16,
      sizing: { type: 'fill' as const },
      isCard: true,
      children: componentChildren,
    };
  });

  return {
    version: 2,
    root: {
      id: 'root-container',
      nodeType: 'container',
      label: 'Page Layout',
      direction: 'column',
      gap: 16,
      wrap: false,
      align: 'stretch',
      justify: 'start',
      padding: 0,
      sizing: { type: 'fill' },
      children: rootChildren,
    },
  };
}
