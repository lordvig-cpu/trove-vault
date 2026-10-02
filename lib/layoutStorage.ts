import { isFlexLayoutConfig, type TemplateFlexLayoutConfig } from '@/types/layout';

/* ==========================================================================
   Where a template's layout lives and which copy wins. The editor writes the browser copy
   (localStorage) on every change and the database copy (item_templates.layout_config) a moment later,
   so the browser copy is the freshest in this browser and the database copy is what other browsers see.
   The template editor and the item view both resolve a layout the same way.
   ========================================================================== */

/** The localStorage key a template's layout is cached under. */
export function layoutCacheKey(templateId: number): string {
  return `trovevault_template_layout_${templateId}`;
}

/** The layout to use: the browser copy if it is a valid current layout, else the stored one, else null
 *  (the template has never been given a layout). Both arguments are untrusted JSON. */
export function resolveSavedLayout(cached: unknown, stored: unknown): TemplateFlexLayoutConfig | null {
  if (isFlexLayoutConfig(cached)) return cached;
  if (isFlexLayoutConfig(stored)) return stored;
  return null;
}

/** Reads and parses a template's browser copy; null when there is none, it is unreadable, or storage is
 *  unavailable (private window, server render). */
export function readCachedLayout(templateId: number): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(layoutCacheKey(templateId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
