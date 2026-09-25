'use client';

import React, { useRef, useState } from 'react';
import { SearchGlassIcon } from '@/components/icons/TreeIcons';
import { FitFrameIcon, HelpCircleIcon } from '@/components/icons/LayoutIcons';
import HoverHint, { type HintContent } from '@/components/HoverHint';
import { useCanvasZoom, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@/context/CanvasZoomContext';
import { BODY_WIDTH_PRESETS } from '@/types/layout';
import { useDismissOnOutsideOrEscape } from '@/hooks/useDismissOnOutsideOrEscape';
import { useScreenWidth } from '@/hooks/useScreenWidth';
import { activeBtn, barControlHeight, ghostBtn, idleBtn } from '@/components/editorBarStyles';

/**
 * Canvas preview controls used inside the template editor bar.
 * These only change how the template is previewed; the template itself stays fluid.
 */

const MIN_PREVIEW_WIDTH = 320;
// Fallback cap for SSR / browsers that don't expose screen.width; actual cap below tracks the user's monitor.
const FALLBACK_MAX_PREVIEW_WIDTH = 3840;
const WIDTH_HINT: HintContent = {
  title: 'Width',
  settings: [
    { name: 'Fit', text: 'The preview fills the whole editor area.' },
    { name: 'A width', text: 'Previews at a specific screen width: pick a preset or type your own.' },
  ],
  notes: (
    <>
      Preview only; templates stay fluid. A <strong>Maximum Content Width</strong> set on the Body (Body Properties, Size
      section) overrides this: the layout stays capped at that width, and is centered when the preview is wider.
    </>
  ),
};
const FIT_SETTINGS = [
  { name: 'On', text: 'The preview fills the whole editor area.' },
  { name: 'Off', text: <>The preview uses the fixed screen width chosen under <strong>Width</strong>.</> },
];
const FIT_ON_HINT: HintContent = {
  title: 'Fit',
  settings: FIT_SETTINGS,
  notes: <><strong>Fit</strong> is <strong>on</strong>. Click to turn it off and choose a fixed screen width.</>,
};
const FIT_OFF_HINT: HintContent = {
  title: 'Fit',
  settings: FIT_SETTINGS,
  notes: <><strong>Fit</strong> is <strong>off</strong>. Click to turn it on and fill the editor area.</>,
};
const ACCENT_BORDER = 'border-[color-mix(in_oklch,var(--secondary-accent)_45%,transparent)]';

/** Screen width being previewed: pick a hard width, or check Fit to use the whole editor area. */
export function PreviewWidthPicker() {
  const { previewWidth, setPreviewWidth, fitWidth } = useCanvasZoom();
  const isFit = previewWidth === 'fit';
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  // The highest width a user could plausibly want to preview: their actual monitor, not a guess.
  // 0 during SSR/before mount, so fall back until the real value is known.
  const screenWidth = useScreenWidth();
  const maxPreviewWidth = Math.max(FALLBACK_MAX_PREVIEW_WIDTH, screenWidth);

  useDismissOnOutsideOrEscape(menuOpen, menuRef, () => setMenuOpen(false));

  const commitDraft = () => {
    const val = parseInt(draft, 10);
    if (!isNaN(val)) {
      setPreviewWidth(Math.min(Math.max(val, MIN_PREVIEW_WIDTH), maxPreviewWidth));
      setMenuOpen(false);
    }
  };

  // Turning Fit off keeps the width you were looking at as the starting hard width.
  const toggleFit = (checked: boolean) => {
    if (checked) setPreviewWidth('fit');
    else setPreviewWidth(Math.min(Math.max(Math.round(fitWidth) || 1920, MIN_PREVIEW_WIDTH), maxPreviewWidth));
  };

  const shownWidth = isFit ? Math.round(fitWidth) : previewWidth;

  return (
    <div className="flex items-center gap-0.5">
      <span className="flex items-center gap-1 mr-1 text-[var(--primary-tree-item-text)]">
        <span className="text-[10px] font-bold uppercase tracking-wider">Width:</span>
        <HoverHint hint={WIDTH_HINT}>
          <HelpCircleIcon className="w-3 h-3" />
        </HoverHint>
      </span>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          disabled={isFit}
          onClick={() => {
            setDraft(String(previewWidth));
            setMenuOpen((o) => !o);
          }}
          aria-label={isFit ? 'Preview width (uncheck Fit to choose one)' : 'Preview width'}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          className={`min-w-[4.5rem] px-2 ${barControlHeight} rounded-md border text-[11px] font-mono font-semibold flex items-center justify-between gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-default ${idleBtn}`}
        >
          <span>{shownWidth ? `${shownWidth}px` : '—'}</span>
          <span aria-hidden="true" className="text-[9px]">▴</span>
        </button>
        {menuOpen && !isFit && (
          <div className="absolute bottom-full left-0 pb-1 z-10">
            <div role="listbox" className="tmpl-edge-panel tmpl-edge-menu tmpl-edge-menu-up rounded-xl w-32 p-1 flex flex-col gap-0.5">
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
                  max={maxPreviewWidth}
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
      <HoverHint hint={isFit ? FIT_ON_HINT : FIT_OFF_HINT} interactive>
        <button
          type="button"
          onClick={() => toggleFit(!isFit)}
          aria-pressed={isFit}
          aria-label="Fit"
          className={`w-[26px] ${barControlHeight} ml-1.5 rounded-md border transition flex items-center justify-center shrink-0 cursor-pointer ${
            isFit ? activeBtn : idleBtn
          }`}
        >
          <FitFrameIcon className="w-3.5 h-3.5" active={isFit} />
        </button>
      </HoverHint>
    </div>
  );
}

// Chromium/Edge's default accent-color range thumb is ~16px — used to correct the tick position below.
const ZOOM_THUMB_WIDTH_PX = 16;

/** Zoom slider, 100% = the preview fitted to the editor area. Drag or arrow-key the track; double-click it (or click the readout) to snap back to 100%. */
export function ZoomControls() {
  const { zoom, setZoom, resetZoom } = useCanvasZoom();

  // Where 100% falls along the track — marks the snap-back stop. A native thumb can't travel past
  // the track edges, so its center only spans [thumbWidth/2, 100% - thumbWidth/2], not the full
  // width; mixing a % term with a px correction (valid in calc()) lines the tick up with it exactly,
  // at any track width, without needing to know that width in JS.
  const midFraction = (1 - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  const tickLeft = `calc(${midFraction * 100}% + ${ZOOM_THUMB_WIDTH_PX * (0.5 - midFraction)}px)`;

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Zoom">
      <SearchGlassIcon className="w-3.5 h-3.5 text-[var(--secondary-accent)] shrink-0" />
      <div className="relative flex items-center w-20 h-4 shrink-0">
        <div
          aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-white/80 pointer-events-none"
          style={{ left: tickLeft }}
        />
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          onDoubleClick={resetZoom}
          aria-label="Zoom level"
          aria-valuetext={`${Math.round(zoom * 100)}%`}
          title="Drag to zoom; double-click to reset to 100%"
          className="w-full h-1.5 rounded-full cursor-pointer accent-[var(--secondary-accent)] bg-black/40"
        />
      </div>
      <button
        type="button"
        onClick={resetZoom}
        title="Reset zoom to 100%"
        aria-label={`Zoom ${Math.round(zoom * 100)}%, click to reset`}
        className={`min-w-[2.75rem] px-1 ${barControlHeight} rounded-md text-[11px] font-mono font-semibold cursor-pointer text-center ${ghostBtn}`}
      >
        {Math.round(zoom * 100)}%
      </button>
    </div>
  );
}
