/**
 * The editor canvas may be CSS-scaled to fit the available space (see ScaledCanvas in
 * TemplateEditorStage). getBoundingClientRect reports the scaled size, so anything that shows
 * "real" layout px must divide by the scale exposed on the wrapper.
 */

const SCALE_SELECTOR = '[data-canvas-scale]';

export function getCanvasScale(el?: Element | null): number {
  const host = (el && el.closest(SCALE_SELECTOR)) || null;
  const scale = host ? parseFloat(host.getAttribute('data-canvas-scale') || '1') : 1;
  return scale > 0 ? scale : 1;
}

/** Unscaled layout size of a container element on the canvas, or null if it isn't mounted. */
export function measureContainerEl(containerId: string): { width: number; height: number } | null {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector(`[data-container-id="${containerId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const scale = getCanvasScale(el);
  return { width: Math.round(rect.width / scale), height: Math.round(rect.height / scale) };
}

/** Width in layout px of the Body currently on the canvas (falls back to the window width). */
export function getCanvasBodyWidth(): number {
  if (typeof document === 'undefined') return 1920;
  const host = document.querySelector(SCALE_SELECTOR);
  const w = host ? parseFloat(host.getAttribute('data-body-width') || '') : NaN;
  return w > 0 ? w : window.innerWidth;
}
