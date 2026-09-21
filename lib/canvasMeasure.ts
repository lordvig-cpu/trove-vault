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
