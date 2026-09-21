'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlexContainerNode, parsePxValue } from '@/types/layout';
import { getCanvasScale } from '@/lib/canvasMeasure';

/**
 * Drag handles on the sides of a selected container whose sizing is Custom.
 *  - Left / right edges set the width (a % width stays a %, a px width stays px).
 *  - The bottom edge sets a fixed height (the canvas scrolls, so the bottom is never a hard limit).
 * An edge that touches the Body's edge gets no handle, except that a container spanning the whole
 * width keeps its right handle so it can still be narrowed. Values are written to the same
 * Width / Height fields as the Sizing section, so both stay in sync.
 */

type Edge = 'left' | 'right' | 'bottom';

const MIN_SIZE = 40;
const FLUSH_TOLERANCE = 2; // px of layout space

interface Flush {
  left: boolean;
  right: boolean;
  scale: number;
}

interface Readout {
  x: number;
  y: number;
  text: string;
}

export default function ContainerResizeHandles({
  containerRef,
  container,
  onUpdate,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  container: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
}) {
  const [flush, setFlush] = useState<Flush>({ left: false, right: false, scale: 1 });
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [readout, setReadout] = useState<Readout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  // Latest values for the window listeners of an in-flight drag
  const latest = useRef({ container, onUpdate });
  useEffect(() => {
    latest.current = { container, onUpdate };
  }, [container, onUpdate]);

  // Track whether the container touches the Body's left / right edge, and the canvas scale.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const root = el.closest('[data-canvas-scale]')?.querySelector<HTMLElement>('[data-container-id]');
    const measure = () => {
      const scale = getCanvasScale(el);
      const rect = el.getBoundingClientRect();
      const rootRect = root?.getBoundingClientRect();
      const tol = FLUSH_TOLERANCE * scale;
      setFlush({
        left: !!rootRect && rect.left - rootRect.left <= tol,
        right: !!rootRect && rootRect.right - rect.right <= tol,
        scale,
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (root) ro.observe(root);
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const fullWidth = flush.left && flush.right;
  const showLeft = !flush.left;
  const showRight = fullWidth || !flush.right;

  const startDrag = (edge: Edge) => (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    event.preventDefault();
    event.stopPropagation();
    cleanupRef.current?.();

    const scale = getCanvasScale(el);
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = el.offsetWidth;
    const startH = el.offsetHeight;
    const parentStyle = getComputedStyle(parent);
    const parentContent =
      parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
    const c0 = latest.current.container;
    const rawWidth = (c0.sizing?.type === 'fixed' && c0.sizing.value) || c0.width || '';
    const isPercent = /%$/.test(rawWidth.trim());
    const minW = Math.max(MIN_SIZE, parsePxValue(c0.minWidth) ?? 0);
    const maxW = parsePxValue(c0.maxWidth) ?? Infinity;
    const minH = Math.max(MIN_SIZE, parsePxValue(c0.minHeight || c0.sizing?.minHeight) ?? 0);
    const maxH = parsePxValue(c0.maxHeight) ?? Infinity;

    const previous = { userSelect: document.body.style.userSelect, cursor: document.body.style.cursor };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = edge === 'bottom' ? 'row-resize' : 'col-resize';
    setActiveEdge(edge);

    const move = (e: PointerEvent) => {
      const { container: c, onUpdate: update } = latest.current;
      if (edge === 'bottom') {
        const h = Math.round(Math.min(maxH, Math.max(minH, startH + (e.clientY - startY) / scale)));
        update({ height: `${h}px`, sizing: { ...c.sizing, height: `${h}px` } });
        setReadout({ x: e.clientX, y: e.clientY, text: `${h}px high` });
        return;
      }
      const dx = (e.clientX - startX) / scale;
      // A container can't be wider than the space it sits in: lock at 100% of the parent
      const ceiling = parentContent > 0 ? Math.min(maxW, parentContent) : maxW;
      let w = Math.min(ceiling, Math.max(Math.min(minW, ceiling), startW + (edge === 'right' ? dx : -dx)));
      let value: string;
      if (isPercent && parentContent > 0) {
        const pct = Math.min(100, Math.max(1, Math.round((w / parentContent) * 100)));
        value = `${pct}%`;
        w = (pct / 100) * parentContent; // show the px the percentage really is
      } else {
        value = `${Math.round(w)}px`;
      }
      update({ width: value, sizing: { ...c.sizing, type: 'fixed', value } });
      setReadout({ x: e.clientX, y: e.clientY, text: isPercent ? `${value} (${Math.round(w)}px)` : value });
    };

    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      document.body.style.userSelect = previous.userSelect;
      document.body.style.cursor = previous.cursor;
      setActiveEdge(null);
      setReadout(null);
      cleanupRef.current = null;
    };
    cleanupRef.current = end;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  // Keep the hit area a constant size on screen whatever the canvas scale.
  const hit = Math.round(14 / flush.scale);
  const pill = (edge: Edge, style: React.CSSProperties, label: string) => {
    const vertical = edge !== 'bottom';
    const active = activeEdge === edge;
    return (
      <div
        role="separator"
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        aria-label={label}
        title={label}
        onPointerDown={startDrag(edge)}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', zIndex: 40, touchAction: 'none', cursor: vertical ? 'col-resize' : 'row-resize', ...style }}
        className="group flex items-center justify-center"
      >
        <span
          className={`block rounded-full transition-colors ${
            active
              ? 'bg-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)]'
              : 'bg-[var(--secondary-accent)] group-hover:bg-white'
          }`}
          style={
            vertical
              ? { width: 4 / flush.scale, height: 32 / flush.scale }
              : { height: 4 / flush.scale, width: 32 / flush.scale }
          }
        />
      </div>
    );
  };

  return (
    <>
      {showLeft &&
        pill('left', { left: 0, top: 0, bottom: 0, width: hit }, 'Drag to resize width')}
      {showRight &&
        pill('right', { right: 0, top: 0, bottom: 0, width: hit }, 'Drag to resize width')}
      {pill('bottom', { bottom: 0, left: 0, right: 0, height: hit }, 'Drag to resize height')}
      {readout &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[200] pointer-events-none whitespace-nowrap px-2 py-1 rounded-md text-[11px] font-mono font-semibold text-white bg-black/80 border border-[var(--secondary-accent)] shadow-lg"
            // Flip to the other side of the cursor near the window edges so it is never cut off
            style={{
              left: readout.x > window.innerWidth - 200 ? readout.x - 14 : readout.x + 14,
              top: readout.y > window.innerHeight - 60 ? readout.y - 14 : readout.y + 14,
              transform: `translate(${readout.x > window.innerWidth - 200 ? '-100%' : '0'}, ${
                readout.y > window.innerHeight - 60 ? '-100%' : '0'
              })`,
            }}
          >
            {readout.text}
          </div>,
          document.body
        )}
    </>
  );
}
