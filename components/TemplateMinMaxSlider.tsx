'use client';

import React, { useState } from 'react';
import '@/app/styles/components/minMaxSlider.css';
import { barControlHeight } from '@/components/editorBarStyles';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';
import HoverHint, { type HintContent } from '@/components/HoverHint';
import UnitSelect from '@/components/UnitSelect';

/**
 * A minimum and a maximum (width, or height) on one two-thumb slider. The left thumb is the minimum, the
 * right thumb the maximum, and the filled stretch between them is the range the container may occupy. Each end
 * also has a box above it for typing an exact value. A thumb resting at its own end of the track
 * means "unset" (no minimum / no maximum), which is what the boxes' "none" placeholder says.
 *
 * One unit is shared by both ends, chosen from the pulldown between the boxes: % runs 0-100, px
 * runs 0 to the parent container's current width (or height), so the track means something, growing if
 * a stored value is larger. A height slider defaults to px, since a % height needs a parent with a
 * definite height.
 */

const STEP = 5;
const THUMB_PX = 14; // keep in step with minMaxSlider.css

type Unit = 'px' | '%';

function parseLength(value?: string): { num: number; unit: Unit } | null {
  const m = (value || '').match(/^(\d+(?:\.\d+)?)(px|%)$/i);
  return m ? { num: parseFloat(m[1]), unit: m[2].toLowerCase() as Unit } : null;
}

/** Where a native range thumb's center really sits for a track fraction: the thumb can't travel past
 *  the track's edges, so its center only spans [thumb/2, 100% - thumb/2]. */
const thumbLeft = (percent: number) => `calc(${percent}% + ${(0.5 - percent / 100) * THUMB_PX}px)`;

/** One end's number box. Shows the bare number for px and "40%" for a percentage. */
function EndBox({
  value,
  unit,
  placeholder,
  label,
  onCommit,
  align,
}: {
  value: number | null;
  unit: Unit;
  placeholder: string;
  label: string;
  onCommit: (num: number | null) => void;
  align: 'left' | 'right';
}) {
  const shown = value === null ? '' : unit === '%' ? `${Math.round(value)}%` : String(Math.round(value));
  const [draft, setDraft] = useState(shown);
  const [prevShown, setPrevShown] = useState(shown);
  if (prevShown !== shown) {
    setPrevShown(shown);
    setDraft(shown);
  }

  const commit = () => {
    const text = draft.trim();
    if (text === '') {
      onCommit(null);
      return;
    }
    const m = text.match(/^(\d+(?:\.\d+)?)(px|%)?$/i);
    if (!m) {
      setDraft(shown);
      return;
    }
    onCommit(parseFloat(m[1]));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      aria-label={label}
      className={`w-14 min-w-0 px-1.5 ${barControlHeight} text-xs font-mono text-strong bg-surface-secondary border border-subtle rounded-lg focus:outline-none focus:border-[var(--secondary-accent)] placeholder:text-muted/60 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    />
  );
}

export default function TemplateMinMaxSlider({
  axis,
  minValue,
  maxValue,
  parentPx,
  minHint,
  maxHint,
  onChange,
}: {
  axis: 'width' | 'height';
  minValue?: string;
  maxValue?: string;
  /** The parent container's current rendered width / height (0 if unknown): what the px track spans. */
  parentPx: number;
  minHint: HintContent;
  maxHint: HintContent;
  /** The new ends, as lengths; undefined = unset. */
  onChange: (patch: { min?: string; max?: string }) => void;
}) {
  const letter = axis === 'width' ? 'W' : 'H';
  const parsedMin = parseLength(minValue);
  const parsedMax = parseLength(maxValue);
  // While both ends are unset there is no stored unit, so the pulldown's choice is kept locally.
  const [blankUnit, setBlankUnit] = useState<Unit>(axis === 'width' ? '%' : 'px');
  const unit: Unit = parsedMin?.unit ?? parsedMax?.unit ?? blankUnit;

  // Re-express a stored length in the shared unit so both thumbs sit on one scale.
  const inUnit = (p: { num: number; unit: Unit } | null): number | null => {
    if (!p) return null;
    if (p.unit === unit) return p.num;
    if (!parentPx) return p.num;
    return unit === '%' ? (p.num / parentPx) * 100 : (p.num / 100) * parentPx;
  };
  const minNum = inUnit(parsedMin);
  const maxNum = inUnit(parsedMax);

  const scaleMax =
    unit === '%'
      ? 100
      : Math.ceil(Math.max(parentPx || 1000, minNum ?? 0, maxNum ?? 0) / STEP) * STEP;
  const minPos = Math.min(Math.max(minNum ?? 0, 0), scaleMax);
  const maxPos = Math.min(Math.max(maxNum ?? scaleMax, 0), scaleMax);

  const fmt = (n: number) => `${Math.round(n)}${unit}`;

  // Write one end (null / an extreme = unset) and keep the other end in the shared unit.
  const setMin = (num: number | null) => {
    const clamped = Math.min(num === null ? 0 : Math.max(num, 0), maxPos);
    onChange({
      min: clamped <= 0 ? undefined : fmt(clamped),
      max: maxNum === null ? undefined : fmt(maxNum),
    });
  };
  const setMax = (num: number | null) => {
    const v = num === null ? scaleMax : Math.min(Math.max(num, 0), scaleMax);
    const clamped = Math.max(v, minPos);
    onChange({
      min: minNum === null || minNum <= 0 ? undefined : fmt(minNum),
      max: clamped >= scaleMax ? undefined : fmt(clamped),
    });
  };

  const changeUnit = (next: Unit) => {
    if (next === unit) return;
    if (!parsedMin && !parsedMax) {
      setBlankUnit(next);
      return;
    }
    // Convert whatever is set into the new unit (px <-> % via the parent's width when known).
    const conv = (p: { num: number; unit: Unit } | null): string | undefined => {
      if (!p) return undefined;
      const n =
        p.unit === next || !parentPx
          ? p.num
          : next === '%'
          ? (p.num / parentPx) * 100
          : (p.num / 100) * parentPx;
      const cap = next === '%' ? 100 : Infinity;
      return `${Math.round(Math.min(Math.max(n, 0), cap))}${next}`;
    };
    onChange({ min: conv(parsedMin), max: conv(parsedMax) });
  };

  const minPercent = (minPos / scaleMax) * 100;
  const maxPercent = (maxPos / scaleMax) * 100;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-end justify-between gap-1">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)]">
            Min. {letter}
            <HoverHint hint={minHint}>
              <HelpCircleIcon className="w-3 h-3" />
            </HoverHint>
          </span>
          <EndBox
            value={minNum !== null && minNum > 0 ? minNum : null}
            unit={unit}
            placeholder="none"
            label={`Minimum ${axis} (${unit})`}
            onCommit={setMin}
            align="left"
          />
        </div>

        <UnitSelect value={unit} onChange={changeUnit} label={`Min and max ${axis} unit`} attached={false} />

        <div className="flex flex-col gap-1 min-w-0 items-end">
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)]">
            Max. {letter}
            <HoverHint hint={maxHint}>
              <HelpCircleIcon className="w-3 h-3" />
            </HoverHint>
          </span>
          <EndBox
            value={maxNum !== null && maxNum < scaleMax ? maxNum : null}
            unit={unit}
            placeholder="none"
            label={`Maximum ${axis} (${unit})`}
            onCommit={setMax}
            align="right"
          />
        </div>
      </div>

      <div className="minMaxSlider">
        <div className="minMaxTrack" aria-hidden="true" />
        <div
          className="minMaxFill"
          aria-hidden="true"
          style={{ left: thumbLeft(minPercent), width: `calc(${thumbLeft(maxPercent)} - ${thumbLeft(minPercent)})` }}
        />
        <input
          type="range"
          min={0}
          max={scaleMax}
          step={STEP}
          value={minPos}
          onChange={(e) => setMin(parseFloat(e.target.value))}
          aria-label={`Minimum ${axis} (${unit})`}
          style={{ zIndex: minPos >= maxPos - STEP ? 5 : 3 }}
        />
        <input
          type="range"
          min={0}
          max={scaleMax}
          step={STEP}
          value={maxPos}
          onChange={(e) => setMax(parseFloat(e.target.value))}
          aria-label={`Maximum ${axis} (${unit})`}
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}
