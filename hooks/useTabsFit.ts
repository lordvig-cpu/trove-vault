'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * Whether a row of folder tabs has room to show every tab's name, or only the active tab's (the others then show
 * just their icon). Give `setSpaceEl` as the `ref` of the element whose width the tabs may use, and `setMeasureEl`
 * as the `ref` of a hidden copy of the tabs with every name showing, styled like the real ones (`.tree-tabs-measure`, absolutely positioned inside
 * the space so it takes no room). The names fit while that copy is no wider than the space's content box.
 *
 * Neither width depends on what the real tabs show, so switching between names and icons can't feed back into the
 * measurement and make it flip back and forth. Both are observed, so resizing a panel (or a name changing) updates
 * it live.
 */
export function useTabsFit() {
  const [space, setSpaceEl] = useState<HTMLElement | null>(null);
  const [measure, setMeasureEl] = useState<HTMLElement | null>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    if (!space || !measure) return;
    const check = () => {
      const style = getComputedStyle(space);
      const room = space.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setFits(measure.getBoundingClientRect().width <= room);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(space);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [space, measure]);

  return { setSpaceEl, setMeasureEl, fits };
}
