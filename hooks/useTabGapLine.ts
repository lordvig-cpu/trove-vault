import { useEffect, useRef } from 'react';

/**
 * A panel header's amber divider line is drawn by the header itself (`[data-tab-gap]` in
 * primarySidePanel.css), with a gap exactly under the active paper-folder tab, so the tab opens into the panel by
 * construction rather than being painted over the line (which left a faint remnant at some display scales).
 * This measures that gap: put the returned ref on the row holding the tabs, and re-run it when the active tab or
 * the tab set changes. It reads the active tab as `.tree-folder-tab-active` and the header as the row's closest
 * `.primary-side-panel-header`; with no active tab the header keeps its plain border.
 */
export function useTabGapLine(deps: ReadonlyArray<unknown>) {
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = rowRef.current;
    const header = row?.closest<HTMLElement>('.primary-side-panel-header');
    if (!row || !header) return;
    const measure = () => {
      const tab = row.querySelector<HTMLElement>('.tree-folder-tab-active');
      if (!tab) {
        header.removeAttribute('data-tab-gap');
        return;
      }
      const h = header.getBoundingClientRect();
      const t = tab.getBoundingClientRect();
      header.style.setProperty('--tab-gap-l', `${t.left - h.left}px`);
      header.style.setProperty('--tab-gap-r', `${t.right - h.left}px`);
      header.setAttribute('data-tab-gap', '');
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(header);
    return () => {
      observer.disconnect();
      header.removeAttribute('data-tab-gap');
      header.style.removeProperty('--tab-gap-l');
      header.style.removeProperty('--tab-gap-r');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return rowRef;
}
