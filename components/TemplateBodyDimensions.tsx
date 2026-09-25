'use client';

import React, { useState } from 'react';
import { FlexContainerNode } from '@/types/layout';
import { HelpCircleIcon, FillIcon } from '@/components/icons/LayoutIcons';
import { activeBtn, ghostBtn, idleBtn } from '@/components/editorBarStyles';

interface TemplateBodyDimensionsProps {
  root: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
}

const MIN_CONTENT_WIDTH_PX = 320;
const MAX_CONTENT_WIDTH_PX = 7680;
const MIN_CONTENT_WIDTH_PCT = 10;
const MAX_CONTENT_WIDTH_PCT = 100;
const HELP_TEXT = 'Blank stretches to the screen. A value caps the layout and centers it on wider screens.';

/**
 * Body sizing (shared by the Layout-tree gear menu and the properties panel).
 * The Body is always fluid and grows vertically as needed, so there is no width or height to set.
 * The one optional rule is a max content width: blank stretches to fill the screen, a value caps the
 * layout at that width (px or %, same input+slider+unit-toggle pattern as Padding) and centers it.
 * (The screen size you preview is picked in the header zoom panel.)
 */
export default function TemplateBodyDimensions({ root, onUpdate }: TemplateBodyDimensionsProps) {
  const raw = root.maxWidth;
  const match = raw != null ? String(raw).trim().match(/^(\d+(?:\.\d+)?)(px|%)?$/i) : null;
  const num = match ? parseFloat(match[1]) : null;
  const unit: 'px' | '%' = (match?.[2] as 'px' | '%') || 'px';
  const isFill = num === null;

  const sliderMin = unit === '%' ? MIN_CONTENT_WIDTH_PCT : MIN_CONTENT_WIDTH_PX;
  const sliderMax = unit === '%' ? MAX_CONTENT_WIDTH_PCT : MAX_CONTENT_WIDTH_PX;
  const sliderStep = unit === '%' ? 5 : 20;
  const sliderValue = num !== null ? Math.min(Math.max(num, sliderMin), sliderMax) : sliderMin;

  const [draft, setDraft] = useState(num !== null ? String(Math.round(num)) : '');
  const [prevNum, setPrevNum] = useState(num);
  if (prevNum !== num) {
    setPrevNum(num);
    setDraft(num !== null ? String(Math.round(num)) : '');
  }

  const commitNum = (val: number) => {
    const clamped = Math.min(Math.max(Math.round(val), sliderMin), sliderMax);
    onUpdate({ maxWidth: `${clamped}${unit}` });
  };
  const commitDraft = () => {
    const parsed = parseFloat(draft);
    if (draft.trim() === '' || isNaN(parsed)) {
      onUpdate({ maxWidth: undefined });
      setDraft('');
    } else {
      commitNum(parsed);
    }
  };
  const setUnit = (nextUnit: 'px' | '%') => {
    if (nextUnit === unit) return;
    const nextMin = nextUnit === '%' ? MIN_CONTENT_WIDTH_PCT : MIN_CONTENT_WIDTH_PX;
    const nextMax = nextUnit === '%' ? MAX_CONTENT_WIDTH_PCT : MAX_CONTENT_WIDTH_PX;
    const base = num !== null ? num : nextMin;
    onUpdate({ maxWidth: `${Math.min(Math.max(Math.round(base), nextMin), nextMax)}${nextUnit}` });
  };

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5">
      <div className="flex items-center gap-1">
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
          Content Width
        </label>
        <span title={HELP_TEXT} aria-label={HELP_TEXT}>
          <HelpCircleIcon className="w-3 h-3 text-muted cursor-help" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            placeholder="fill"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label="Maximum content width"
            className="w-14 px-2 py-1 text-xs font-mono text-strong text-right bg-surface-secondary border border-subtle rounded-lg focus:outline-none focus:border-[var(--secondary-accent)]"
          />
          <div
            className="flex flex-col rounded-md overflow-hidden border border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)] bg-black/40 shrink-0"
            role="group"
            aria-label="Content width unit"
          >
            <button
              type="button"
              onClick={() => setUnit('px')}
              aria-pressed={unit === 'px'}
              title="Pixels"
              className={`px-1.5 py-0.5 text-[9px] font-bold leading-none transition cursor-pointer ${
                unit === 'px' ? `border ${activeBtn}` : ghostBtn
              }`}
            >
              px
            </button>
            <button
              type="button"
              onClick={() => setUnit('%')}
              aria-pressed={unit === '%'}
              title="Percent"
              className={`px-1.5 py-0.5 text-[9px] font-bold leading-none transition cursor-pointer ${
                unit === '%' ? `border ${activeBtn}` : ghostBtn
              }`}
            >
              %
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onUpdate({ maxWidth: undefined })}
          title="Stretch the layout to fill the screen"
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
            isFill ? activeBtn : idleBtn
          }`}
        >
          <FillIcon className="w-3.5 h-3.5" />
          <span>Fill</span>
        </button>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        onChange={(e) => commitNum(parseInt(e.target.value, 10))}
        aria-label="Maximum content width"
        className="w-full h-1.5 rounded-full cursor-pointer accent-[var(--secondary-accent)] bg-black/40"
        title={`Adjust content width: ${isFill ? 'Fill' : `${Math.round(num!)}${unit}`}`}
      />
    </div>
  );
}
