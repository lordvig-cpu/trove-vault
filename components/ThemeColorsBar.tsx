'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import OklchSeedControls from '@/components/OklchSeedControls';

interface ThemeColorsBarProps {
  /** Shown by the gear beside the footer's theme pulldown. */
  visible: boolean;
}

/**
 * The theme's color pickers as a bottom toolbar: the same `tmpl-edge-panel` chassis as the template
 * editor's bar, portaled into the workspace's `#theme-colors-slot` (page.tsx), so it hangs on the footer
 * and is lifted clear of the bottom panel with it. The pickers stay mounted while the bar is hidden,
 * because mounting is what applies the saved palette.
 */
const noSubscribe = () => () => {};
const findSlot = () => document.getElementById('theme-colors-slot');
const noSlotOnServer = () => null;

export default function ThemeColorsBar({ visible }: ThemeColorsBarProps) {
  // The slot is part of the page's own markup, so it exists as soon as the client renders; the server
  // snapshot is null so hydration matches.
  const slot = useSyncExternalStore(noSubscribe, findSlot, noSlotOnServer);

  if (!slot) return null;
  return createPortal(
    <div
      className={
        visible
          ? 'tmpl-edge-panel tmpl-edge-panel-bottom select-none pointer-events-auto flex items-center gap-3 pl-3 pr-4 py-2.5 max-w-[calc(100vw-2rem)]'
          : 'hidden'
      }
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-tree-item-text)] shrink-0">
        Theme colors
      </span>
      <OklchSeedControls bare />
    </div>,
    slot
  );
}
