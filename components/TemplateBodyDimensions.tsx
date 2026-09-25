'use client';

import React, { useState } from 'react';
import { FlexContainerNode } from '@/types/layout';
import { useCanvasZoom } from '@/context/CanvasZoomContext';
import { HelpCircleIcon, FillIcon } from '@/components/icons/LayoutIcons';
import { activeBtn, barControlHeight, idleBtn } from '@/components/editorBarStyles';
import HoverHint, { HintRef, type HintContent } from '@/components/HoverHint';
import UnitSelect from '@/components/UnitSelect';

interface TemplateBodyDimensionsProps {
  root: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
}

const MIN_CONTENT_WIDTH_PX = 320;
const MAX_CONTENT_WIDTH_PX = 7680;
const MIN_CONTENT_WIDTH_PCT = 10;
const MAX_CONTENT_WIDTH_PCT = 100;
const CONTENT_WIDTH_HINT: HintContent = {
  title: 'Maximum Content Width',
  settings: [
    { name: 'Fill', icon: <FillIcon className="w-2.5 h-2.5" />, text: 'No cap: the layout stretches to fill the screen.' },
    { name: '[value]', text: <>Caps the layout at that width (<code>px</code> or <code>%</code>) and centers it on wider screens.</> },
  ],
  notes: [
    { kind: 'tip', text: <>A cap of <code>100%</code> is the same as <HintRef icon={<FillIcon className="w-2.5 h-2.5" />}>Fill</HintRef>.</> },
    { kind: 'caution', text: <>This overrides the preview <strong>Width</strong> on the bottom toolbar whenever it is narrower.</> },
  ],
};

/**
 * Body sizing (shared by the Layout-tree gear menu and the properties panel).
 * The Body is always fluid and grows vertically as needed, so there is no width or height to set.
 * The one optional rule is a max content width: blank stretches to fill the screen, a value caps the
 * layout at that width (px or %, same input+slider+unit-toggle pattern as Padding) and centers it.
 * (The screen size you preview is picked in the header zoom panel.)
 */
export default function TemplateBodyDimensions({ root, onUpdate }: TemplateBodyDimensionsProps) {
  const { previewWidth, fitWidth } = useCanvasZoom();
  const raw = root.maxWidth;
  const match = raw != null ? String(raw).trim().match(/^(\d+(?:\.\d+)?)(px|%)?$/i) : null;
  const num = match ? parseFloat(match[1]) : null;
  // A 100% cap is the same as no cap, so it counts as Fill too (and is stored as no cap at all).
  const isFill = num === null || (match?.[2] === '%' && num >= 100);
  // While Fill (no cap), the unit isn't stored anywhere, so the pulldown's choice is remembered
  // locally until a value is actually set.
  const [fillUnit, setFillUnit] = useState<'px' | '%'>('px');
  const unit: 'px' | '%' = match ? ((match[2] as 'px' | '%') || 'px') : fillUnit;

  const sliderMin = unit === '%' ? MIN_CONTENT_WIDTH_PCT : MIN_CONTENT_WIDTH_PX;
  const sliderMax = unit === '%' ? MAX_CONTENT_WIDTH_PCT : MAX_CONTENT_WIDTH_PX;
  const sliderStep = unit === '%' ? 5 : 20;
  // The number the slider and the input both show. While Fill there's no stored number, so it's the
  // width the Body actually spans: 100% in % mode, or in px the preview width (the whole editor area
  // while Fit is on; 1920 until that's been measured).
  const fillPx = previewWidth === 'fit' ? Math.round(fitWidth) || 1920 : previewWidth;
  const fillValue = unit === '%' ? 100 : fillPx;
  const sliderValue = Math.min(Math.max(num ?? fillValue, sliderMin), sliderMax);
  const shown = String(Math.round(sliderValue));

  const [draft, setDraft] = useState(shown);
  const [edited, setEdited] = useState(false);
  // Re-sync the input when the value or unit changes from elsewhere (slider drag, pulldown, Fill).
  const syncKey = `${num ?? `fill${shown}`}|${unit}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    setDraft(shown);
    setEdited(false);
  }

  const commitNum = (val: number) => {
    const clamped = Math.min(Math.max(Math.round(val), sliderMin), sliderMax);
    if (unit === '%' && clamped >= 100) {
      setFillUnit('%');
      onUpdate({ maxWidth: undefined });
      return;
    }
    onUpdate({ maxWidth: `${clamped}${unit}` });
  };
  const commitDraft = () => {
    // Merely focusing and leaving the field must not turn the displayed default into a cap.
    if (!edited) return;
    setEdited(false);
    const parsed = parseFloat(draft);
    if (draft.trim() === '') {
      onUpdate({ maxWidth: undefined });
      setDraft(shown);
    } else if (isNaN(parsed)) {
      setDraft(shown);
    } else {
      commitNum(parsed);
    }
  };
  const setUnit = (nextUnit: 'px' | '%') => {
    if (nextUnit === unit) return;
    if (isFill) {
      setFillUnit(nextUnit);
      return;
    }
    const nextMin = nextUnit === '%' ? MIN_CONTENT_WIDTH_PCT : MIN_CONTENT_WIDTH_PX;
    const nextMax = nextUnit === '%' ? MAX_CONTENT_WIDTH_PCT : MAX_CONTENT_WIDTH_PX;
    const next = Math.min(Math.max(Math.round(num), nextMin), nextMax);
    if (nextUnit === '%' && next >= 100) {
      setFillUnit('%');
      onUpdate({ maxWidth: undefined });
      return;
    }
    onUpdate({ maxWidth: `${next}${nextUnit}` });
  };

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      <div className="flex items-center justify-end gap-1">
        <label className="text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)]">
          Maximum Content Width
        </label>
        <HoverHint hint={CONTENT_WIDTH_HINT}>
          <HelpCircleIcon className="w-3 h-3 text-[var(--secondary-tree-menu-header-title)]" />
        </HoverHint>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center min-w-0">
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setEdited(true);
            }}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label="Maximum content width"
            className={`min-w-0 flex-1 px-2 ${barControlHeight} text-xs font-mono text-strong text-right bg-surface-secondary border border-subtle rounded-l-lg rounded-r-none relative focus:z-10 focus:outline-none focus:border-[var(--secondary-accent)]`}
          />
          <UnitSelect value={unit} onChange={setUnit} label="Content width unit" />
        </div>
        <button
          type="button"
          onClick={() => onUpdate({ maxWidth: undefined })}
          title="Stretch the layout to fill the screen"
          className={`flex items-center justify-center gap-1.5 px-2 ${barControlHeight} rounded-lg border text-xs font-bold transition cursor-pointer ${
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
