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

