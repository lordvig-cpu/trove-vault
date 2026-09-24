'use client';

import React, { useState } from 'react';
import { FlexContainerNode, parsePxValue } from '@/types/layout';

interface TemplateBodyDimensionsProps {
  root: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
}

const MIN_CONTENT_WIDTH = 320;
const MAX_CONTENT_WIDTH = 7680;

/**
 * Body sizing (shared by the Layout-tree gear menu and the properties panel).
 * The Body is always fluid and grows vertically as needed, so there is no width or height to set.
 * The one optional rule is a max content width: blank stretches to fill the screen, a value caps the
 * layout at that width and centers it. (The screen size you preview is picked in the header zoom panel.)
 */
export default function TemplateBodyDimensions({ root, onUpdate }: TemplateBodyDimensionsProps) {
  const maxPx = parsePxValue(root.maxWidth);
  const [draft, setDraft] = useState(maxPx !== null ? String(Math.round(maxPx)) : '');
  const [prevMaxPx, setPrevMaxPx] = useState(maxPx);
  if (prevMaxPx !== maxPx) {
    setPrevMaxPx(maxPx);
    setDraft(maxPx !== null ? String(Math.round(maxPx)) : '');
  }

  const commit = () => {
    const val = parseInt(draft, 10);
    if (draft.trim() === '' || isNaN(val)) {
      onUpdate({ maxWidth: undefined });
      setDraft('');
    } else {
      onUpdate({ maxWidth: `${Math.min(Math.max(val, MIN_CONTENT_WIDTH), MAX_CONTENT_WIDTH)}px` });
    }
  };

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 border-t border-[var(--primary-border-subtle)]">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
          Max Content Width
        </label>
        <span className="text-[10px] font-mono text-[var(--primary-accent)] font-semibold">
          {maxPx !== null ? `${Math.round(maxPx)}px` : 'Fill'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-slate-900 border border-subtle rounded-md px-1 py-0.5 w-[72px] shrink-0 focus-within:border-[var(--primary-accent)]">
          <input
            type="number"
            min={MIN_CONTENT_WIDTH}
            max={MAX_CONTENT_WIDTH}
            value={draft}
            placeholder="fill"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-full bg-transparent text-xs font-mono text-strong text-right focus:outline-none"
            aria-label="Maximum content width in pixels"
          />
          <span className="text-[10px] text-muted font-mono">px</span>
        </div>
        <button
          type="button"
          onClick={() => onUpdate({ maxWidth: undefined })}
          title="Stretch the layout to fill the screen"
          className={`px-1.5 py-1 text-[10px] font-semibold rounded border transition cursor-pointer shrink-0 whitespace-nowrap ${
            maxPx !== null
              ? 'bg-slate-800 border-subtle text-muted hover:text-white hover:border-[var(--primary-accent)]'
              : 'bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] border-[var(--primary-accent)] text-[var(--primary-accent)] opacity-60'
          }`}
        >
          ↺ Fill
        </button>
      </div>
      <p className="text-[10px] text-muted leading-snug">
        Blank stretches to the screen. A value caps the layout and centers it on wider screens.
      </p>
    </div>
  );
}
