'use client';

import React from 'react';
import { HintBubble } from '@/components/HoverHint';
import {
  closeHelpWindow,
  moveHelpWindow,
  raiseHelpWindow,
  useHelpWindows,
  type HelpWindowState,
} from '@/lib/helpWindows';

const MIN_VISIBLE_PX = 120; // how much of a window's title bar must stay on screen while dragging

/** One help window: the help bubble's content, popped out of its `?`. It drags by its title bar and stays until closed. */
function HelpWindow({ win }: { win: HelpWindowState }) {
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
      style={{ left: win.left, top: win.top }}
      onClose={() => closeHelpWindow(win.key)}
      onTitlePointerDown={startDrag}
      onPointerDown={() => raiseHelpWindow(win.key)}
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
