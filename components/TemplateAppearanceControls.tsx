'use client';

import React, { useRef, useState } from 'react';
import type { BoxLook } from '@/lib/layoutContent';
import { normalizeHexAlpha } from '@/lib/color';
import { barControlHeight } from '@/components/editorBarStyles';
import { SearchClearIcon } from '@/components/icons/TreeIcons';
import { type HintContent } from '@/components/HoverHint';
import SubsectionHeading from '@/components/SubsectionHeading';
import SeedColorPicker from '@/components/SeedColorPicker';
import UnitSelect from '@/components/UnitSelect';

/**
 * A box look, for a container or a content element: Background (a color), Border (width, radius, color)
 * and Shadow (offset, blur, color). Colors use the same picker as the footer's theme seeds and are stored as "#RRGGBB" ("#RRGGBBAA" when translucent); sizes
 * are plain px (there's no % here, so the pulldown beside each number is fixed and dimmed). An unset
 * value stores nothing: no background, no border (width 0), no shadow.
 */

const PICKER_START = '#808080'; // where the picker opens from while no color is set

const HINTS = {
  background: {
    title: 'Background',
    settings: [
      { name: 'Color', text: 'The fill behind the content.' },
      { name: 'Clear', icon: <SearchClearIcon className="w-2.5 h-2.5" />, text: 'The × on the color’s tag removes the fill.' },
    ],
    notes: [
      { kind: 'use', text: 'Click the swatch to pick a color, or type a HEX value.' },
      { kind: 'tip', text: "Colors belong to the template: they don't change with the app's light or dark theme." },
    ],
  },
  border: {
    title: 'Border',
    settings: [
      { name: 'Width', text: 'How thick the border is, in px. 0 means no border.' },
      { name: 'Radius', text: 'How round the corners are, in px. It rounds the background and shadow too.' },
      { name: 'Color', text: 'The border color. Left unset, a border uses a neutral color.' },
    ],
    notes: [{ kind: 'tip', text: 'A radius shows even without a border, on the background and the shadow.' }],
  },
  shadow: {
    title: 'Shadow',
    settings: [
      { name: 'Offset', text: 'How far down the shadow falls, in px. A negative value moves it up.' },
      { name: 'Blur', text: 'How soft the shadow is, in px. 0 is a hard edge.' },
      { name: 'Color', text: 'The shadow color.' },
    ],
    notes: [{ kind: 'tip', text: 'The shadow is drawn at 40% strength, so it stays soft whatever color you pick.' }],
  },
} satisfies Record<string, HintContent>;

/** A px-only number: the input with a fixed, dimmed "px" beside it (same control as the length fields). */
export function PxField({
  label,
  value,
  min = 0,
  max,
  onCommit,
}: {
  label: string;
  value?: number;
  min?: number;
  max: number;
  onCommit: (v: number | undefined) => void;
}) {
  const shown = value === undefined ? '' : String(value);
  const [draft, setDraft] = useState(shown);
  const [prevShown, setPrevShown] = useState(shown);
  if (prevShown !== shown) {
    setPrevShown(shown);
    setDraft(shown);
  }

  const commit = () => {
    const text = draft.trim();
    if (text === '') {
      onCommit(undefined);
      return;
    }
    const n = Number(text.replace(/px$/i, ''));
    if (!Number.isFinite(n)) {
      setDraft(shown);
      return;
    }
    const clamped = Math.min(Math.max(Math.round(n), min), max);
    onCommit(clamped === 0 ? undefined : clamped);
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="menu-field-label text-[10px] font-semibold tracking-[0.04em] text-[var(--text-strong)]">
        {label}
      </span>
      <div className="flex items-center min-w-0">
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          placeholder="0"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          aria-label={`${label} (px)`}
          className={`min-w-0 flex-1 px-1.5 ${barControlHeight} text-xs font-mono text-strong text-right bg-surface-secondary border border-subtle rounded-l-lg rounded-r-none relative focus:z-10 focus:outline-none focus:border-[var(--secondary-accent)] placeholder:text-muted/60`}
        />
        <UnitSelect value="px" onChange={() => {}} label={`${label} unit`} disabled />
      </div>
    </div>
  );
}

/** A color: the picker's swatch, an editable HEX box, and a clear button once one is set. */
export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (hex: string | undefined) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shownRaw = draft ?? value ?? '';
  // The stored/committed value is a normalizeHexAlpha() result, "#RRGGBB" or "#RRGGBBAA" -- stripped here so the
  // "#" shown below is the only one, a static, always-there visual cue rather than part of the
  // editable text (which would either double up into "##RRGGBB" or have to be re-inserted on every
  // keystroke, both of which risk snagging on normalizeHex's own with-or-without-# parsing).
  const shown = shownRaw.startsWith('#') ? shownRaw.slice(1) : shownRaw;

  const commit = () => {
    const text = (draft ?? '').trim();
    setDraft(null);
    if (draft === null) return;
    if (text === '') onChange(undefined);
    else {
      const hex = normalizeHexAlpha(text);
      if (hex) onChange(hex);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="menu-field-label text-[10px] font-semibold tracking-[0.04em] text-[var(--text-strong)] w-9 shrink-0">
        {label}
      </span>
      <SeedColorPicker
        label={label}
        value={value ?? PICKER_START}
        empty={value === undefined}
        alpha
        onChange={(hex) => {
          setDraft(null);
          onChange(hex);
        }}
      />
      {/* The HEX field, like the panels' search box: an input-styled box whose value, once there is one,
          sits in a tag with an × that clears it. The input itself is always the same element (only the
          wrapper's class changes), so typing never loses focus as the tag appears or disappears.
          Styles: .colorHexField / .colorHexTag in TreeSubMenu.css. */}
      <div
        className={`colorHexField ${barControlHeight}`}
        // A click on the box around the tag still lands in the field.
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        <div className={shown ? 'colorHexTag' : 'colorHexTagEmpty'}>
          {shown && <span aria-hidden="true" className="colorHexHash">#</span>}
          <input
            ref={inputRef}
            type="text"
            value={shown}
            placeholder="none"
            spellCheck={false}
            autoComplete="off"
            onFocus={() => setDraft(value ?? '')}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label={`${label} (HEX)`}
            title="Enter a 3-, 4-, 6- or 8-digit HEX color (the last two digits are opacity), with or without #"
            className="colorHexInput"
            style={shown ? { width: `${shown.length + 0.5}ch` } : undefined}
          />
          {shown && (
            <button
              type="button"
              // Keeps the input from committing a half-typed draft on blur before the clear lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setDraft(null);
                onChange(undefined);
              }}
              aria-label={`Clear ${label.toLowerCase()}`}
              title={`Clear ${label.toLowerCase()}`}
              className="colorHexClear"
            >
              <SearchClearIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplateAppearanceControls({
  container,
  onUpdate,
}: {
  /** The container or content element being styled (only its box-look properties are read). */
  container: BoxLook;
  onUpdate: (partial: Partial<BoxLook>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-3 pt-0 pb-2">
      <div className="flex flex-col gap-1.5">
        <SubsectionHeading label="Background" hint={HINTS.background} />
        <ColorRow label="Color" value={container.background} onChange={(background) => onUpdate({ background })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <SubsectionHeading label="Border" hint={HINTS.border} />
        <div className="grid grid-cols-2 gap-2">
          <PxField label="Width" value={container.borderWidth} max={20} onCommit={(borderWidth) => onUpdate({ borderWidth })} />
          <PxField label="Radius" value={container.borderRadius} max={200} onCommit={(borderRadius) => onUpdate({ borderRadius })} />
        </div>
        <ColorRow label="Color" value={container.borderColor} onChange={(borderColor) => onUpdate({ borderColor })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <SubsectionHeading label="Shadow" hint={HINTS.shadow} />
        <div className="grid grid-cols-2 gap-2">
          <PxField label="Offset" value={container.shadowY} min={-50} max={50} onCommit={(shadowY) => onUpdate({ shadowY })} />
          <PxField label="Blur" value={container.shadowBlur} max={100} onCommit={(shadowBlur) => onUpdate({ shadowBlur })} />
        </div>
        <ColorRow label="Color" value={container.shadowColor} onChange={(shadowColor) => onUpdate({ shadowColor })} />
      </div>
    </div>
  );
}
