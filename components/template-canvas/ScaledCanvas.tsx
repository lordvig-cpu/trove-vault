'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCanvasZoom } from '@/context/CanvasZoomContext';

/* ==========================================================================
   SCALED CANVAS
   Lays the Body out at its design width and scales it down (never up) to fit the
   available editor area, then applies the user's zoom (header +/-) on top.
   data-canvas-scale / data-body-width let panels report real px.
   ========================================================================== */

export default function ScaledCanvas({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);
  const [bodyPx, setBodyPx] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;
    const measure = () => {
      setAvailable(host.clientWidth);
      setInnerHeight(inner.offsetHeight); // layout height: unaffected by the CSS transform
      // The Body as actually laid out (px): reflects zoom reflow and any max content width
      setBodyPx(inner.querySelector<HTMLElement>('[data-container-id]')?.offsetWidth ?? 0);
    };
    const ro = new ResizeObserver(measure);
    const bodyEl = inner.querySelector('[data-container-id]');
    if (bodyEl) ro.observe(bodyEl);
    ro.observe(host);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const { zoom, previewWidth: bodyWidth, setFitWidth } = useCanvasZoom();

  useEffect(() => {
    if (bodyPx > 0) setFitWidth(bodyPx);
  }, [bodyPx, setFitWidth]);

  // Default view shrinks the Body to fit the editor area (never up); zoom multiplies on top.
  const isFit = bodyWidth === 'fit';
  const fitScale = !isFit && available > 0 ? Math.min(1, available / bodyWidth) : 1;
  const scale = fitScale * zoom;
  // 'fit' bodies reflow like browser zoom: the layout width shrinks as the scale grows.
  const layoutWidth = isFit ? (available ? available / zoom : undefined) : bodyWidth;
  const scaledWidth = layoutWidth ? layoutWidth * scale : undefined;

  return (
    <div
      ref={hostRef}
      // -12px margins cancel the stage's side padding, so the canvas runs edge to edge
      // (the banner above keeps its padding). Fit then uses all the space the panels leave.
      className="overflow-x-auto -mx-3"
      style={{ paddingTop: 8 }}
    >
      <div
        style={{
          width: scaledWidth,
          height: innerHeight ? Math.ceil(innerHeight * scale) : undefined,
          margin: '0 auto',
        }}
      >
        <div
          ref={innerRef}
          data-canvas-scale={scale}
          data-body-width={layoutWidth}
          style={{
            width: layoutWidth,
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
