'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/* ==========================================================================
   Canvas zoom for the template editor.
   `zoom` is a multiplier on top of the "fit to view" scale: 1 (100%) = the Body
   shrunk to fit the editor area; +/- steps by 10% from there.
   ========================================================================== */

export const ZOOM_STEP = 0.1;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3;

export type PreviewWidth = 'fit' | number;

interface CanvasZoomContextType {
  /** Editor-only preview width: a px screen size, or 'fit' to use the whole editor area. */
  previewWidth: PreviewWidth;
  setPreviewWidth: (w: PreviewWidth) => void;
  /** Width in px the Body is actually laid out at, reported by the canvas (shown while Fit is on). */
  fitWidth: number;
  setFitWidth: (w: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const CanvasZoomContext = createContext<CanvasZoomContextType | null>(null);

// Round to one decimal so repeated steps never drift (0.1 + 0.2 !== 0.3).
const clampZoom = (z: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 10) / 10));

export function CanvasZoomProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('fit');
  const [fitWidth, setFitWidth] = useState(0);

  const setZoomClamped = useCallback((z: number) => setZoom(clampZoom(z)), []);
  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  const value = useMemo(
    () => ({
      previewWidth,
      setPreviewWidth,
      fitWidth,
      setFitWidth,
      zoom,
      setZoom: setZoomClamped,
      zoomIn,
      zoomOut,
      resetZoom,
    }),
    [previewWidth, fitWidth, zoom, setZoomClamped, zoomIn, zoomOut, resetZoom]
  );

  return <CanvasZoomContext.Provider value={value}>{children}</CanvasZoomContext.Provider>;
}

export function useCanvasZoom(): CanvasZoomContextType {
  const ctx = useContext(CanvasZoomContext);
  if (!ctx) throw new Error('useCanvasZoom must be used within a CanvasZoomProvider');
  return ctx;
}
