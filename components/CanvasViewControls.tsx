'use client';

import React, { useRef, useState } from 'react';
import { ZoomInIcon, ZoomOutIcon } from '@/components/icons/TreeIcons';
import { useCanvasZoom, ZOOM_MAX, ZOOM_MIN } from '@/context/CanvasZoomContext';
import { BODY_WIDTH_PRESETS } from '@/types/layout';
import { useDismissOnOutsideOrEscape } from '@/hooks/useDismissOnOutsideOrEscape';
import { activeBtn, ghostBtn, idleBtn } from '@/components/editorBarStyles';

/**
 * Canvas preview controls used inside the template editor bar.
 * These only change how the template is previewed; the template itself stays fluid.
 */

const MIN_PREVIEW_WIDTH = 320;
const MAX_PREVIEW_WIDTH = 3840;
const ACCENT_BORDER = 'border-[color-mix(in_oklch,var(--secondary-accent)_45%,transparent)]';

/** Screen width being previewed: pick a hard width, or check Fit to use the whole editor area. */
export function PreviewWidthPicker() {
  const { previewWidth, setPreviewWidth, fitWidth } = useCanvasZoom();
  const isFit = previewWidth === 'fit';
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useDismissOnOutsideOrEscape(menuOpen, menuRef, () => setMenuOpen(false));

  const commitDraft = () => {
    const val = parseInt(draft, 10);
    if (!isNaN(val)) {
      setPreviewWidth(Math.min(Math.max(val, MIN_PREVIEW_WIDTH), MAX_PREVIEW_WIDTH));
      setMenuOpen(false);
    }
  };

  // Turning Fit off keeps the width you were looking at as the starting hard width.
  const toggleFit = (checked: boolean) => {
    if (checked) setPreviewWidth('fit');
    else setPreviewWidth(Math.min(Math.max(Math.round(fitWidth) || 1920, MIN_PREVIEW_WIDTH), MAX_PREVIEW_WIDTH));
  };

  const shownWidth = isFit ? Math.round(fitWidth) : previewWidth;

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">Width</span>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          disabled={isFit}
          onClick={() => {
            setDraft(String(previewWidth));
            setMenuOpen((o) => !o);
          }}
          title={isFit ? 'Uncheck Fit to preview a specific screen width' : 'Choose a screen width to preview'}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          className={`min-w-[5.25rem] px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold flex items-center justify-between gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-default ${idleBtn}`}
        >
          <span>{shownWidth ? `${shownWidth}px` : '—'}</span>
          <span aria-hidden="true" className="text-[9px]">▾</span>
        </button>
        {menuOpen && !isFit && (
          <div className="absolute top-full left-0 pt-1 z-10">
            <div role="listbox" className="tmpl-edge-panel tmpl-edge-menu rounded-xl w-32 p-1 flex flex-col gap-0.5">
              {BODY_WIDTH_PRESETS.map((px) => (
                <button
                  key={px}
                  type="button"
                  role="option"
                  aria-selected={previewWidth === px}
                  onClick={() => {
                    setPreviewWidth(px);
                    setMenuOpen(false);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-mono text-left cursor-pointer ${
                    previewWidth === px ? `border ${activeBtn}` : ghostBtn
                  }`}
                >
                  {px}px
                </button>
              ))}
              <div className={`flex items-center gap-1 pt-1 mt-0.5 border-t ${ACCENT_BORDER}`}>
                <input
                  type="number"
                  min={MIN_PREVIEW_WIDTH}
                  max={MAX_PREVIEW_WIDTH}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDraft();
                  }}
                  aria-label="Custom preview width in pixels"
                  className="w-full min-w-0 px-1 py-0.5 rounded bg-slate-950 border border-subtle text-[11px] font-mono text-strong text-right focus:outline-none focus:border-[var(--primary-accent)]"
                />
                <button
                  type="button"
                  onClick={commitDraft}
                  className={`px-1.5 py-0.5 rounded border text-[10px] font-bold cursor-pointer ${activeBtn}`}
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <label className="flex items-center gap-1 ml-1.5 text-[11px] font-semibold text-white cursor-pointer">
        <input
          type="checkbox"
          checked={isFit}
          onChange={(e) => toggleFit(e.target.checked)}
          className="tree-filter-checkbox tmpl-blue-check w-3.5 h-3.5 rounded cursor-pointer shrink-0"
        />
        Fit
      </label>
    </div>
  );
}

/** Zoom -/+ in 10% steps; 100% = the preview fitted to the editor area. */
export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom } = useCanvasZoom();

  const btn = `p-1.5 rounded-md flex items-center justify-center transition cursor-pointer ${ghostBtn} disabled:opacity-35 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Zoom">
      <button type="button" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out 10%" aria-label="Zoom out" className={btn}>
        <ZoomOutIcon />
      </button>
      <button
        type="button"
        onClick={resetZoom}
        title="Reset zoom to 100%"
        aria-label={`Zoom ${Math.round(zoom * 100)}%, click to reset`}
        className={`min-w-[3rem] px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold cursor-pointer text-center ${ghostBtn}`}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in 10%" aria-label="Zoom in" className={btn}>
        <ZoomInIcon />
      </button>
    </div>
  );
}
