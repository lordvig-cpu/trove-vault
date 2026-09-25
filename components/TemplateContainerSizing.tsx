'use client';

import React, { useState } from 'react';
import { FlexContainerNode } from '@/types/layout';
import { barControlHeight } from '@/components/editorBarStyles';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';
import UnitSelect from '@/components/UnitSelect';
import TemplateMinMaxSlider from '@/components/TemplateMinMaxSlider';
import HoverHint, { type HintContent } from '@/components/HoverHint';

/**
 * Sizing rules for a container (not the Body): Width / Min. W / Max. W and Height / Min. H / Max. H,
 * plus "Stack below" for rows. A blank Width means Fill (the default); a blank Height means Auto.
 * Shared by the Layout-tree gear menu and the properties panel.
 */

/** "320" -> "320px"; "50%" / "320px" kept; anything else (or blank) -> undefined. */
function normalizeLength(raw: string): string | undefined {
  const v = raw.trim().toLowerCase();
  const m = v.match(/^(\d+(?:\.\d+)?)(px|%)?$/);
  if (!m || parseFloat(m[1]) <= 0) return undefined;
  return `${m[1]}${m[2] || 'px'}`;
}

/** Help bubbles for each field (see HoverHint for the shape). */
const FIELD_HINTS = {
  width: {
    title: 'Width',
    settings: [
      { name: '[value]', text: 'A fixed width, in px or %.' },
      { name: 'Blank', text: 'Fills the available space.' },
    ],
    notes: [
      { kind: 'use', text: <>Type a number and pick <code>px</code> or <code>%</code>; clear the box to go back to fill.</> },
      { kind: 'tip', text: <>Setting a width makes the container <strong>Custom</strong> sized.</> },
    ],
  },
  minWidth: {
    title: 'Minimum Width',
    settings: [
      { name: '[value]', text: 'The container is never narrower than this.' },
      { name: 'Blank', text: 'No minimum.' },
    ],
  },
  maxWidth: {
    title: 'Maximum Width',
    settings: [
      { name: '[value]', text: 'The container is never wider than this.' },
      { name: 'Blank', text: 'No maximum.' },
    ],
    notes: [{ kind: 'tip', text: <>A fixed <strong>Width</strong> also acts as the maximum, unless you set one here.</> }],
  },
  height: {
    title: 'Height',
    settings: [
      { name: '[value]', text: 'A fixed height, in px or %.' },
      { name: 'Blank', text: 'Grows with its content (auto).' },
    ],
    notes: [{ kind: 'tip', text: 'A container with a fixed height scrolls when its content is taller.' }],
  },
  minHeight: {
    title: 'Minimum Height',
    settings: [
      { name: '[value]', text: 'The container is never shorter than this.' },
      { name: 'Blank', text: 'No minimum.' },
    ],
  },
  maxHeight: {
    title: 'Maximum Height',
    settings: [
      { name: '[value]', text: 'The container is never taller than this.' },
      { name: 'Blank', text: 'No maximum.' },
    ],
    notes: [{ kind: 'tip', text: 'Content taller than the maximum scrolls.' }],
  },
  stackBelow: {
    title: 'Stack when narrower than',
    settings: [
      { name: '[value]', text: "Below this width, a Row's children stack into a column." },
      { name: 'Blank', text: 'Never stacks.' },
    ],
    notes: [{ kind: 'caution', text: <>Rows only, and in <code>px</code> only.</> }],
  },
} satisfies Record<string, HintContent>;

/**
 * One length field: a number input with the px / % pulldown attached to it (the same control as
 * Padding and Maximum Content Width), so a value is stored as "320px" or "50%". Blank clears the
 * rule (the placeholder says what blank means). `pxOnly` fields (Stack when narrower than) show a
 * fixed, disabled "px".
 */
function SizeField({
  label,
  value,
  placeholder,
  hint,
  onCommit,
  pxOnly = false,
}: {
  label: string;
  value?: string;
  placeholder: string;
  hint: HintContent;
  onCommit: (v: string | undefined) => void;
  pxOnly?: boolean;
}) {
  const match = (value || '').match(/^(\d+(?:\.\d+)?)(px|%)$/i);
  const num = match ? match[1] : '';
  const valueUnit = match ? (match[2].toLowerCase() as 'px' | '%') : null;
  // While blank there is no stored unit, so the pulldown's choice is remembered locally.
  const [blankUnit, setBlankUnit] = useState<'px' | '%'>('px');
  const unit: 'px' | '%' = pxOnly ? 'px' : valueUnit ?? blankUnit;

  const [draft, setDraft] = useState(num);
  // Re-sync the draft when the stored value changes from elsewhere (reset, sibling menu).
  const [prevNum, setPrevNum] = useState(num);
  if (prevNum !== num) {
    setPrevNum(num);
    setDraft(num);
  }

  const commit = () => {
    const text = draft.trim();
    // Blank clears the rule; invalid or zero snaps back to the stored value.
    if (text === '') {
      onCommit(undefined);
      return;
    }
    const next = normalizeLength(`${text}${/(px|%)$/i.test(text) ? '' : unit}`);
    if (next) onCommit(next);
    else setDraft(num);
  };

  const changeUnit = (nextUnit: 'px' | '%') => {
    if (pxOnly || nextUnit === unit) return;
    if (valueUnit) onCommit(`${num}${nextUnit}`);
    else setBlankUnit(nextUnit);
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && (
        <label className="text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)] flex items-center justify-end gap-1">
          {label}
          <HoverHint hint={hint}>
            <HelpCircleIcon className="w-3 h-3" />
          </HoverHint>
        </label>
      )}
      <div className="flex items-center min-w-0">
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
          aria-label={`${label || placeholder} (${unit})`}
          className={`min-w-0 flex-1 px-1.5 ${barControlHeight} text-xs font-mono text-strong text-right bg-surface-secondary border border-subtle rounded-l-lg rounded-r-none relative focus:z-10 focus:outline-none focus:border-[var(--secondary-accent)] placeholder:text-muted/60`}
        />
        <UnitSelect value={unit} onChange={changeUnit} label={`${label || 'Stack below'} unit`} disabled={pxOnly} />
      </div>
    </div>
  );
}

interface TemplateContainerSizingProps {
  container: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
  /** Inside a flyout section: no card chrome or "Sizing" title; Width, its Min/Max slider, Height, its
   *  Min/Max slider, then "Stack when narrower than" on its own row. */
  bare?: boolean;
}

export default function TemplateContainerSizing({ container, onUpdate, bare = false }: TemplateContainerSizingProps) {
  // Width: sizing.value (fixed) is what the canvas renders; keep legacy `width` in step.
  const width = (container.sizing?.type === 'fixed' && container.sizing.value) || container.width || undefined;
  const height = container.sizing?.height || container.height || undefined;
  const minHeight = container.sizing?.minHeight || container.minHeight || undefined;

  // The parent container's current rendered width / height: what the px track of each min/max slider
  // spans (0 when it can't be measured).
  const parentEl =
    typeof document === 'undefined'
      ? null
      : document
          .querySelector<HTMLElement>(`[data-container-id="${container.id}"]`)
          ?.parentElement?.closest<HTMLElement>('[data-container-id]');
  const parentWidthPx = parentEl?.offsetWidth ?? 0;
  const parentHeightPx = parentEl?.offsetHeight ?? 0;

  const setWidth = (v?: string) =>
    onUpdate({
      width: v,
      sizing: v ? { ...container.sizing, type: 'fixed', value: v } : { ...container.sizing, type: 'fill', value: undefined },
    });
  const setHeight = (v?: string) => onUpdate({ height: v, sizing: { ...container.sizing, height: v } });
  const setMinHeight = (v?: string) => onUpdate({ minHeight: v, sizing: { ...container.sizing, minHeight: v } });

  return (
    <div className={bare ? 'flex flex-col gap-2 px-3 pt-0 pb-2' : 'flex flex-col gap-2.5 p-2.5 rounded-xl bg-slate-900/50 border border-subtle'}>
      {!bare && <span className="text-[11px] font-bold text-white">Sizing</span>}
      {bare ? (
        <>
          <SizeField label="Width" value={width} placeholder="fill" hint={FIELD_HINTS.width} onCommit={setWidth} />
          <TemplateMinMaxSlider
            axis="width"
            minValue={container.minWidth}
            maxValue={container.maxWidth}
            parentPx={parentWidthPx}
            minHint={FIELD_HINTS.minWidth}
            maxHint={FIELD_HINTS.maxWidth}
            onChange={({ min, max }) => onUpdate({ minWidth: min, maxWidth: max })}
          />
          <SizeField label="Height" value={height} placeholder="auto" hint={FIELD_HINTS.height} onCommit={setHeight} />
          <TemplateMinMaxSlider
            axis="height"
            minValue={minHeight}
            maxValue={container.maxHeight}
            parentPx={parentHeightPx}
            minHint={FIELD_HINTS.minHeight}
            maxHint={FIELD_HINTS.maxHeight}
            onChange={({ min, max }) =>
              onUpdate({ minHeight: min, sizing: { ...container.sizing, minHeight: min }, maxHeight: max })
            }
          />
        </>
      ) : (
      <div className="grid grid-cols-3 gap-2">
        <SizeField label="Width" value={width} placeholder="fill" hint={FIELD_HINTS.width} onCommit={setWidth} />
        <SizeField label="Min. W" value={container.minWidth} placeholder="none" hint={FIELD_HINTS.minWidth} onCommit={(v) => onUpdate({ minWidth: v })} />
        <SizeField label="Max. W" value={container.maxWidth} placeholder="none" hint={FIELD_HINTS.maxWidth} onCommit={(v) => onUpdate({ maxWidth: v })} />
        <SizeField label="Height" value={height} placeholder="auto" hint={FIELD_HINTS.height} onCommit={setHeight} />
        <SizeField label="Min. H" value={minHeight} placeholder="none" hint={FIELD_HINTS.minHeight} onCommit={setMinHeight} />
        <SizeField label="Max. H" value={container.maxHeight} placeholder="none" hint={FIELD_HINTS.maxHeight} onCommit={(v) => onUpdate({ maxHeight: v })} />
      </div>

      )}
      {container.direction === 'row' && (
        <div className={bare ? 'flex flex-col gap-1' : 'pt-2 border-t border-[var(--primary-border-subtle)] flex items-center justify-between gap-2'}>
          <label
            className="text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)] flex items-center justify-end gap-1"
          >
            Stack when narrower than
            <HoverHint hint={FIELD_HINTS.stackBelow}>
              <HelpCircleIcon className="w-3 h-3" />
            </HoverHint>
          </label>
          <SizeField
            label=""
            value={container.stackBelow ? `${container.stackBelow}px` : undefined}
            placeholder="never"
            hint={FIELD_HINTS.stackBelow}
            pxOnly
            onCommit={(v) => {
              const n = v ? parseInt(v, 10) : NaN;
              onUpdate({ stackBelow: v?.endsWith('px') && n > 0 ? n : undefined });
            }}
          />
        </div>
      )}
    </div>
  );
}
