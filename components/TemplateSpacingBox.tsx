'use client';

import React, { useState } from 'react';
import '@/app/styles/components/spacingBox.css';
import {
  FlexContainerNode,
  BoxSide,
  BoxValues,
  formatBoxValue,
  parseBoxValue,
} from '@/types/layout';
import UnitSelect from '@/components/UnitSelect';
import { HelpCircleIcon, LinkIcon } from '@/components/icons/LayoutIcons';
import HoverHint, { type HintContent } from '@/components/HoverHint';
import { activeBtn, barControlHeight, idleBtn } from '@/components/editorBarStyles';

/**
 * The box-model Spacing control: a Margin box around a Padding box around the content, with an
 * input for each side. Click a side to select it; the slider and unit pulldown below edit the
 * selected side (px or %), and the link button makes all four sides of that layer move together.
 * Values are stored as CSS shorthand on the container (`padding` / `margin`, see parseBoxValue).
 */

type Layer = 'margin' | 'padding';
interface Selection {
  layer: Layer;
  side: BoxSide;
}

const MAX_PX = 200; // largest value that can be typed
const MAX_PCT = 100;
const SLIDER_MAX_PX = 50;
const SLIDER_STEP = 5;

function splitLength(value: string): { num: number; unit: 'px' | '%' } {
  const m = value.match(/^(\d+(?:\.\d+)?)(px|%)$/);
  return m ? { num: parseFloat(m[1]), unit: m[2] as 'px' | '%' } : { num: 0, unit: 'px' };
}

const allEqual = (v: BoxValues) => v.top === v.right && v.right === v.bottom && v.bottom === v.left;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One side's number box. Shows the bare number for px and "10%" for a percentage. */
function SideInput({
  value,
  label,
  selected,
  disabled,
  onSelect,
  onCommit,
}: {
  value: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onCommit: (num: number, unit: 'px' | '%') => void;
}) {
  const { num, unit } = splitLength(value);
  const shown = unit === '%' ? `${num}%` : String(num);
  const [draft, setDraft] = useState(shown);
  // Re-sync when the stored value changes from elsewhere (slider, link, another side).
  const [prevShown, setPrevShown] = useState(shown);
  if (prevShown !== shown) {
    setPrevShown(shown);
    setDraft(shown);
  }

  const commit = () => {
    const m = draft.trim().match(/^(\d+(?:\.\d+)?)(px|%)?$/i);
    if (!m) {
      setDraft(shown);
      return;
    }
    onCommit(parseFloat(m[1]), (m[2]?.toLowerCase() as 'px' | '%' | undefined) ?? unit);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={onSelect}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      aria-label={label}
      className={`spacingInput w-9 ${barControlHeight} px-1 text-xs font-mono text-center rounded-md focus:outline-none ${
        selected ? 'spacingInput-selected' : ''
      }`}
    />
  );
}

/** Help for the layer currently selected in the diagram (see HoverHint for the shape). */
const LAYER_HINTS: Record<Layer, HintContent> = {
  padding: {
    title: 'Padding',
    settings: [
      { name: 'px', text: 'A fixed amount of space, in pixels.' },
      { name: '%', text: "A share of the parent's width, so it scales with the screen." },
      { name: 'Link sides', icon: <LinkIcon className="w-2.5 h-2.5" />, text: 'Changes all four sides together.' },
    ],
    notes: [{ kind: 'tip', text: <>Space <em>inside</em> the container, between its edge and its content.</> }],
  },
  margin: {
    title: 'Margin',
    settings: [
      { name: 'px', text: 'A fixed amount of space, in pixels.' },
      { name: '%', text: "A share of the parent's width, so it scales with the screen." },
      { name: 'Link sides', icon: <LinkIcon className="w-2.5 h-2.5" />, text: 'Changes all four sides together.' },
    ],
    notes: [{ kind: 'tip', text: <>Space <em>outside</em> the container, between it and whatever sits next to it.</> }],
  },
};

interface TemplateSpacingBoxProps {
  container: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
  /** The Body has no margin: its box is shown, dimmed, but can't be edited. */
  marginDisabled?: boolean;
}

export default function TemplateSpacingBox({ container, onUpdate, marginDisabled = false }: TemplateSpacingBoxProps) {
  const sides: Record<Layer, BoxValues> = {
    margin: parseBoxValue(container.margin),
    padding: parseBoxValue(container.padding),
  };
  const [selected, setSelected] = useState<Selection>({ layer: 'padding', side: 'top' });
  const [linked, setLinked] = useState<Record<Layer, boolean>>(() => ({
    margin: allEqual(sides.margin),
    padding: allEqual(sides.padding),
  }));

  const write = (layer: Layer, next: BoxValues) => {
    const formatted = formatBoxValue(next);
    if (layer === 'margin') onUpdate({ margin: formatted === '0px' ? undefined : formatted });
    else onUpdate({ padding: formatted });
  };

  const setSide = (layer: Layer, side: BoxSide, num: number, unit: 'px' | '%') => {
    const clamped = Math.min(Math.max(Math.round(num), 0), unit === '%' ? MAX_PCT : MAX_PX);
    const value = `${clamped}${unit}`;
    write(
      layer,
      linked[layer]
        ? { top: value, right: value, bottom: value, left: value }
        : { ...sides[layer], [side]: value }
    );
  };

  const toggleLink = () => {
    const { layer, side } = selected;
    if (!linked[layer]) {
      // Linking: every side takes the selected side's value.
      const value = sides[layer][side];
      write(layer, { top: value, right: value, bottom: value, left: value });
    }
    setLinked((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const cell = (layer: Layer, side: BoxSide) => {
    const disabled = layer === 'margin' && marginDisabled;
    return (
      <div className={`spacing-${side}`}>
        <SideInput
          value={sides[layer][side]}
          label={`${capitalize(layer)} ${side}`}
          selected={!disabled && selected.layer === layer && selected.side === side}
          disabled={disabled}
          onSelect={() => setSelected({ layer, side })}
          onCommit={(num, unit) => setSide(layer, side, num, unit)}
        />
      </div>
    );
  };

  const current = splitLength(sides[selected.layer][selected.side]);
  const sliderMax = current.unit === '%' ? MAX_PCT : SLIDER_MAX_PX;
  const isLinked = linked[selected.layer];

  return (
    <div className="flex flex-col gap-2 px-3 pt-0 pb-2">
      <div className="spacingBox">
        <div className={`spacingLayer spacingLayer-margin ${marginDisabled ? 'spacingLayer-disabled' : ''}`}>
          <span className="spacingLayerLabel">Margin</span>
          {cell('margin', 'top')}
          {cell('margin', 'left')}
          <div className="spacing-center">
            <div className="spacingContainer" title="The container itself: margin is outside this border, padding is inside it">
            <div className="spacingLayer spacingLayer-padding">
              <span className="spacingLayerLabel">Padding</span>
              {cell('padding', 'top')}
              {cell('padding', 'left')}
              <div className="spacing-center">
                <div className="spacingContent" aria-hidden="true" />
              </div>
              {cell('padding', 'right')}
              {cell('padding', 'bottom')}
            </div>
            </div>
          </div>
          {cell('margin', 'right')}
          {cell('margin', 'bottom')}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        <span className="text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)]">
          {capitalize(selected.layer)} · {isLinked ? 'All sides' : capitalize(selected.side)}
        </span>
        <HoverHint hint={LAYER_HINTS[selected.layer]}>
          <HelpCircleIcon className="w-3 h-3 text-[var(--secondary-tree-menu-header-title)]" />
        </HoverHint>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={SLIDER_STEP}
          value={Math.min(current.num, sliderMax)}
          onChange={(e) => setSide(selected.layer, selected.side, parseInt(e.target.value, 10), current.unit)}
          aria-label={`${capitalize(selected.layer)} ${isLinked ? 'all sides' : selected.side}`}
          className="min-w-0 flex-1 h-1.5 rounded-full cursor-pointer accent-[var(--secondary-accent)] bg-black/40"
        />
        <UnitSelect
          attached={false}
          value={current.unit}
          onChange={(unit) =>
            setSide(selected.layer, selected.side, Math.min(current.num, unit === '%' ? MAX_PCT : MAX_PX), unit)
          }
          label={`${capitalize(selected.layer)} unit`}
        />
        <button
          type="button"
          onClick={toggleLink}
          aria-pressed={isLinked}
          disabled={selected.layer === 'margin' && marginDisabled}
          title={isLinked ? 'Sides are linked: editing one changes all four. Click to edit them separately.' : 'Link the four sides so they change together'}
          aria-label="Link sides"
          className={`w-[26px] ${barControlHeight} rounded-md border transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isLinked ? activeBtn : idleBtn
          }`}
        >
          <LinkIcon />
        </button>
      </div>
    </div>
  );
}
