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
   TYPE DEFINITIONS: Template Layout Engine & Grid Configuration
   Contract for custom multi-column and multi-row visual layouts in TroveVault.
   ========================================================================== */

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

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType;
  field_id?: number | null; // ID of the bound field (if type === 'field')
  label?: string;          // Optional custom label override
  col_span: number;        // 1 to 12 columns (default 6 for half, 12 for full)
  row_span: number;        // 1 to 4+ vertical grid spaces (e.g. 4 for table or media)
  variant: LayoutVariant;  // Visual presentation styling
  custom_props?: Record<string, any>;
}

export interface LayoutSection {
  id: string;
  title: string;
  description?: string | null;
  columns?: number;        // Default 12-column grid
  is_collapsed?: boolean;
  blocks: LayoutBlock[];
}

export interface TemplateLayoutConfig {
  version: number;
  sections: LayoutSection[];
}
