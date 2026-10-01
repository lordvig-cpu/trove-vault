'use client';

import React, { useEffect, useRef } from 'react';
import { HintBubble } from '@/components/HoverHint';
import {
  closeHelpWindow,
  moveHelpWindow,
  raiseHelpWindow,
  setHelpWindowAnchored,
  useHelpWindows,
  type HelpWindowState,
} from '@/lib/helpWindows';

const MIN_VISIBLE_PX = 120; // how much of a window's title bar must stay on screen while dragging
const HIDE_DELAY_MS = 150;

/**
 * One help window: the help bubble's content, un-anchored from its `?`. Un-anchored it drags by its
 * title bar and stays until closed; anchored again (the anchor icon) it is fixed in place and closes
 * once the pointer leaves it, like the hover bubble it came from.
 */
function HelpWindow({ win }: { win: HelpWindowState }) {
  const pointerInside = useRef(false);
  const hideTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const { left, top } = win;

    const onMove = (ev: PointerEvent) => {
      const nextLeft = Math.min(Math.max(left + ev.clientX - startX, MIN_VISIBLE_PX - 300), window.innerWidth - MIN_VISIBLE_PX);
      const nextTop = Math.min(Math.max(top + ev.clientY - startY, 0), window.innerHeight - 48);
      moveHelpWindow(win.key, nextLeft, nextTop);
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  };

  return (
    <HintBubble
      hint={win.hint}
      asWindow
      role="dialog"
      anchored={win.anchored}
      style={{ left: win.left, top: win.top }}
      onToggleAnchor={() => setHelpWindowAnchored(win.key, !win.anchored)}
      onClose={() => closeHelpWindow(win.key)}
      onTitlePointerDown={startDrag}
      onPointerDown={() => raiseHelpWindow(win.key)}
      onMouseEnter={() => {
        pointerInside.current = true;
        window.clearTimeout(hideTimer.current);
      }}
      onMouseLeave={() => {
        pointerInside.current = false;
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
          if (!pointerInside.current && win.anchored) closeHelpWindow(win.key);
        }, HIDE_DELAY_MS);
      }}
    />
  );
}

/**
 * Renders every help window (see lib/helpWindows.ts). Mounted once in the root layout so a window
 * stays open when the flyout, panel or editor that spawned it closes.
 */
export default function HelpWindowHost() {
  const windows = useHelpWindows();
  return (
    <>
      {windows.map((win) => (
        <HelpWindow key={win.key} win={win} />
      ))}
    </>
  );
}
