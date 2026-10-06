'use client';

import React, { useState } from 'react';
import type { FieldDefinition } from '@/types/field';
import type {
  BuiltinKey,
  ContentBinding,
  ContentDisplayStyle,
  FlexComponentNode,
  TextStyle,
} from '@/types/layout';
import {
  BUILTIN_LABELS,
  TEXT_PRESETS,
  applyTextPreset,
  bindingOf,
  bindingPatch,
  displayStylesFor,
  effectiveDisplayStyle,
  effectiveLabelStyle,
  effectiveTextStyle,
  isLabelShown,
  labelTextOf,
  mergeTextStyle,
  type TextPresetName,
} from '@/lib/layoutContent';
import { activeBtn, barControlHeight, barGhostBtn, barToggleBtn, barToggleGroup } from '@/components/editorBarStyles';
import SubsectionHeading from '@/components/SubsectionHeading';
import { ColorRow } from '@/components/TemplateAppearanceControls';
import { type HintContent } from '@/components/HoverHint';

/* ==========================================================================
   Property controls for a content element (a component in the layout tree), used by its gear flyout
   (TemplateLayoutActionMenu); the content toolbar reuses their option lists. There is
   deliberately no Layout, Spacing or Size here: the element's container owns all of those, which is
   what makes dropping content into a configured container a plain drag-and-drop.
   ========================================================================== */

/** What every group of controls here receives: the element, the template's fields, and a patch writer. */
interface ControlsProps {
  component: FlexComponentNode;
  fields: FieldDefinition[];
  onUpdate: (partial: Partial<FlexComponentNode>) => void;
}

/* --------------------------------------------------------------------------
   Help bubbles
   -------------------------------------------------------------------------- */

export const CONTENT_SOURCE_HINT: HintContent = {
  title: 'Content',
  settings: [
    { name: 'Shows', text: 'What this element displays: a built-in value of the item (Name, Image, ...), one of the template’s fields, or fixed text you type.' },
    { name: 'Display', text: 'How the value is drawn. The choices depend on the kind of value: a Yes/No field can be a checkbox, a toggle, a pill or plain text.' },
  ],
  notes: [
    { kind: 'tip', text: 'Changing what an element shows resets its label and display style, but keeps its text and appearance.' },
    { kind: 'caution', text: <>Content has no width, spacing or position of its own: the <em>container</em> holding it sets those.</> },
  ],
};

export const CONTENT_LABEL_HINT: HintContent = {
  title: 'Label',
  settings: [
    { name: 'Show', text: 'Whether the name of the value is drawn with it.' },
    { name: 'Position', text: 'Above the value, or beside it on the same line.' },
    { name: 'Text', text: 'Replaces the default label (the field’s name). Leave it empty to use the default.' },
  ],
  notes: [{ kind: 'tip', text: 'The label has its own text style, so it can be small and muted while the value is large.' }],
};

export const CONTENT_TEXT_HINT: HintContent = {
  title: 'Text',
  settings: [
    { name: 'Start from', text: 'Fills in size, weight, spacing and case from a ready-made style: Title, Heading, Body, Caption or Label.' },
    { name: 'Color', text: 'The text color. Left unset, it follows the app’s own text color.' },
    { name: 'Size', text: 'The font size, in px.' },
  ],
  notes: [
    { kind: 'use', text: 'Pick a style to start, then adjust anything you like.' },
    { kind: 'caution', text: 'A style is a starting point: changing it later does not restyle elements that already used it.' },
    { kind: 'tip', text: 'Colors belong to the template: they don’t change with the app’s light or dark theme.' },
  ],
};

/* --------------------------------------------------------------------------
   Small controls
   -------------------------------------------------------------------------- */

const LABEL_CLASS = 'menu-field-label text-[10px] font-semibold tracking-[0.04em] text-[var(--text-strong)]';
const INPUT_CLASS = `w-full px-2 ${barControlHeight} text-xs text-strong bg-surface-secondary border border-subtle rounded-lg focus:outline-none focus:border-[var(--secondary-accent)] placeholder:text-muted/60`;

/** A labeled row of mutually exclusive buttons (the same toggle group the container flyout uses). */
function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={LABEL_CLASS}>{label}</span>
      <div className={`${barToggleGroup} w-full`} role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            title={opt.title}
            className={`${barToggleBtn} flex-1 justify-center text-[10.5px] font-semibold ${
              value === opt.value ? `border cursor-default ${activeBtn}` : `${barGhostBtn} cursor-pointer`
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A number with a fixed unit beside it (px, or x for a multiplier); empty = unset. */
function NumberField({
  label,
  value,
  unit,
  min,
  max,
  decimals = 0,
  onCommit,
}: {
  label: string;
  value?: number;
  unit: string;
  min: number;
  max: number;
  decimals?: number;
  onCommit: (value: number | undefined) => void;
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
    if (text === '') return onCommit(undefined);
    const n = Number(text);
    if (!Number.isFinite(n)) return setDraft(shown);
    const factor = 10 ** decimals;
    onCommit(Math.min(Math.max(Math.round(n * factor) / factor, min), max));
  };
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className={LABEL_CLASS}>{label}</span>
      <div className="flex items-center min-w-0">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          placeholder="auto"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          aria-label={`${label} (${unit})`}
          className={`min-w-0 flex-1 px-1.5 ${barControlHeight} text-xs font-mono text-strong text-right bg-surface-secondary border border-subtle rounded-l-lg rounded-r-none focus:outline-none focus:border-[var(--secondary-accent)] placeholder:text-muted/60`}
        />
        <span
          className={`px-1.5 ${barControlHeight} flex items-center text-[10px] font-semibold text-muted bg-surface-secondary border border-l-0 border-subtle rounded-r-lg`}
          aria-hidden="true"
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Content: what it shows and how it is drawn
   -------------------------------------------------------------------------- */

export const DISPLAY_LABELS: Record<ContentDisplayStyle, string> = {
  text: 'Text',
  badge: 'Badge',
  chips: 'Chips',
  list: 'List',
  number: 'Number',
  stat: 'Stat',
  checkbox: 'Checkbox',
  toggle: 'Toggle',
  pill: 'Pill',
  yesno: 'Yes / No',
  'date-short': 'Short',
  'date-long': 'Long',
  'date-iso': 'ISO',
  'image-cover': 'Fill',
  'image-contain': 'Fit',
};

const ASPECT_RATIOS = [
  { value: '4 / 3', label: '4:3' },
  { value: '1 / 1', label: '1:1' },
  { value: '16 / 9', label: '16:9' },
  { value: '3 / 4', label: '3:4' },
  { value: '2 / 3', label: '2:3' },
];

export const BUILTIN_ORDER: BuiltinKey[] = ['name', 'image', 'collections', 'created', 'subitems'];

/** The <select> value for a binding: "builtin:name", "field:12", "static", or "" when unbound. */
function selectValueOf(binding: ContentBinding | null): string {
  if (!binding) return '';
  if (binding.kind === 'builtin') return `builtin:${binding.key}`;
  if (binding.kind === 'field') return `field:${binding.field_id}`;
  return 'static';
}

/** Content group: the binding picker, the static text box, and the display style. */
export function ContentSourceControls({ component, fields, onUpdate }: ControlsProps) {
  const binding = bindingOf(component);
  const [prevText, setPrevText] = useState(binding?.kind === 'static' ? binding.text : '');
  const staticText = binding?.kind === 'static' ? binding.text : '';
  const [draft, setDraft] = useState(staticText);
  if (prevText !== staticText) {
    setPrevText(staticText);
    setDraft(staticText);
  }

  const onPick = (value: string) => {
    if (value.startsWith('builtin:')) onUpdate(bindingPatch({ kind: 'builtin', key: value.slice(8) as BuiltinKey }));
    else if (value.startsWith('field:')) onUpdate(bindingPatch({ kind: 'field', field_id: Number(value.slice(6)) }));
    else if (value === 'static') onUpdate(bindingPatch({ kind: 'static', text: staticText || 'Your text' }));
  };

  const styles = binding ? displayStylesFor(binding, fields) : [];
  const style = binding ? effectiveDisplayStyle(component, binding, fields) : undefined;
  const isImage = binding?.kind === 'builtin' && binding.key === 'image';

  return (
    <div className="flex flex-col gap-2 px-3 pt-0 pb-2">
      <div className="flex flex-col gap-1">
        <span className={LABEL_CLASS}>Shows</span>
        <select
          value={selectValueOf(binding)}
          onChange={(e) => onPick(e.target.value)}
          aria-label="What this element shows"
          className={`${INPUT_CLASS} cursor-pointer`}
        >
          {!binding && <option value="">Choose what to show...</option>}
          <optgroup label="Item">
            {BUILTIN_ORDER.map((key) => (
              <option key={key} value={`builtin:${key}`}>
                {BUILTIN_LABELS[key]}
              </option>
            ))}
          </optgroup>
          {fields.length > 0 && (
            <optgroup label="Fields">
              {fields.map((f) => (
                <option key={f.id} value={`field:${f.id}`}>
                  {f.label}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Fixed">
            <option value="static">Static text</option>
          </optgroup>
        </select>
      </div>

      {binding?.kind === 'static' && (
        <div className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>Text</span>
          <textarea
            value={draft}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft !== staticText && onUpdate({ binding: { kind: 'static', text: draft } })}
            aria-label="Static text"
            className="w-full px-2 py-1.5 text-xs text-strong bg-surface-secondary border border-subtle rounded-lg focus:outline-none focus:border-[var(--secondary-accent)] resize-y"
          />
        </div>
      )}

      {styles.length > 1 && (
        <Segmented
          label="Display"
          value={style}
          options={styles.map((s) => ({ value: s, label: DISPLAY_LABELS[s] }))}
          onChange={(next) => onUpdate({ display: { ...component.display, style: next } })}
        />
      )}

      {isImage && (
        <Segmented
          label="Shape"
          value={component.display?.aspectRatio ?? '4 / 3'}
          options={ASPECT_RATIOS.map((r) => ({ value: r.value, label: r.label }))}
          onChange={(aspectRatio) => onUpdate({ display: { style: style ?? 'image-cover', ...component.display, aspectRatio } })}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Text: typography, for a value or its label
   -------------------------------------------------------------------------- */

export const PRESET_OPTIONS: { value: TextPresetName; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'heading', label: 'Heading' },
  { value: 'body', label: 'Body' },
  { value: 'caption', label: 'Caption' },
  { value: 'label', label: 'Label' },
];

const WEIGHTS: { value: NonNullable<TextStyle['fontWeight']>; label: string; title: string }[] = [
  { value: 400, label: 'Reg', title: 'Regular (400)' },
  { value: 500, label: 'Med', title: 'Medium (500)' },
  { value: 600, label: 'Semi', title: 'Semibold (600)' },
  { value: 700, label: 'Bold', title: 'Bold (700)' },
  { value: 800, label: 'Black', title: 'Extra bold (800)' },
];

/** The typography controls for one text style: preset, size, weight, color, alignment, case,
 *  emphasis, line height and letter spacing. `style` is the EFFECTIVE style (defaults included), so
 *  the controls show what is drawn; each edit stores only the keys it changes. */
function TextStyleControls({
  style,
  compact = false,
  onChange,
  onReplace,
  onReset,
}: {
  style: TextStyle;
  /** The label's cut-down set: no alignment, emphasis, line height. */
  compact?: boolean;
  onChange: (partial: Partial<TextStyle>) => void;
  onReplace: (next: TextStyle) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className={LABEL_CLASS}>Start from</span>
        <select
          value=""
          onChange={(e) => e.target.value && onReplace(applyTextPreset(style, e.target.value as TextPresetName))}
          aria-label="Start from a text style"
          className={`${INPUT_CLASS} cursor-pointer`}
        >
          <option value="">Choose a style...</option>
          {PRESET_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} ({TEXT_PRESETS[p.value].fontSize}px)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Size" value={style.fontSize} unit="px" min={6} max={200} onCommit={(fontSize) => onChange({ fontSize })} />
        <NumberField
          label="Spacing"
          value={style.letterSpacing}
          unit="px"
          min={-5}
          max={40}
          decimals={1}
          onCommit={(letterSpacing) => onChange({ letterSpacing })}
        />
      </div>

      <Segmented
        label="Weight"
        value={style.fontWeight}
        options={WEIGHTS}
        onChange={(fontWeight) => onChange({ fontWeight })}
      />

      <ColorRow label="Color" value={style.color} onChange={(color) => onChange({ color })} />

      <Segmented
        label="Case"
        value={style.transform ?? 'none'}
        options={[
          { value: 'none', label: 'Normal', title: 'As typed' },
          { value: 'uppercase', label: 'UPPER', title: 'All capitals' },
          { value: 'capitalize', label: 'Title', title: 'Capitalize Each Word' },
        ]}
        onChange={(transform) => onChange({ transform })}
      />

      {!compact && (
        <>
          <Segmented
            label="Align"
            value={style.align ?? 'left'}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            onChange={(align) => onChange({ align })}
          />

          <div className="grid grid-cols-2 gap-2">
            <Segmented
              label="Italic"
              value={style.italic ? 'on' : 'off'}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'on', label: <em>Italic</em> },
              ]}
              onChange={(v) => onChange({ italic: v === 'on' ? true : undefined })}
            />
            <Segmented
              label="Underline"
              value={style.underline ? 'on' : 'off'}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'on', label: <u>Line</u> },
              ]}
              onChange={(v) => onChange({ underline: v === 'on' ? true : undefined })}
            />
          </div>

          <NumberField
            label="Line height"
            value={style.lineHeight}
            unit="x"
            min={0.8}
            max={3}
            decimals={2}
            onCommit={(lineHeight) => onChange({ lineHeight })}
          />
        </>
      )}

      <button
        type="button"
        onClick={onReset}
        className="self-start text-[10.5px] font-semibold text-[var(--secondary-accent)] hover:underline cursor-pointer"
        title="Remove this element's own text settings and return to its defaults"
      >
        Reset text style
      </button>
    </div>
  );
}

/** Text group: the typography of the element's value. */
export function ContentTextControls({ component, onUpdate }: ControlsProps) {
  const binding = bindingOf(component);
  return (
    <div className="px-3 pt-0 pb-2">
      <TextStyleControls
        style={effectiveTextStyle(component, binding)}
        onChange={(partial) => onUpdate({ textStyle: mergeTextStyle(component.textStyle, partial) })}
        onReplace={(next) => onUpdate({ textStyle: mergeTextStyle(undefined, next) })}
        onReset={() => onUpdate({ textStyle: undefined })}
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Label: whether it shows, where, its text, and its own typography
   -------------------------------------------------------------------------- */

/** Label group. */
export function ContentLabelControls({ component, fields, onUpdate }: ControlsProps) {
  const binding = bindingOf(component);
  const shown = isLabelShown(component, binding);
  const defaultText = labelTextOf({ ...component, label: undefined }, binding, fields);

  const [draft, setDraft] = useState(component.label ?? '');
  const [prevLabel, setPrevLabel] = useState(component.label);
  if (prevLabel !== component.label) {
    setPrevLabel(component.label);
    setDraft(component.label ?? '');
  }
  const commit = () => {
    const text = draft.trim();
    if (text !== (component.label ?? '')) onUpdate({ label: text || undefined });
  };

  return (
    <div className="flex flex-col gap-2 px-3 pt-0 pb-2">
      <Segmented
        label="Show label"
        value={shown ? 'show' : 'hide'}
        options={[
          { value: 'show', label: 'Show' },
          { value: 'hide', label: 'Hide' },
        ]}
        onChange={(v) => onUpdate({ contentLabel: { position: component.contentLabel?.position ?? 'above', show: v === 'show' } })}
      />

      {shown && (
        <>
          <Segmented
            label="Position"
            value={component.contentLabel?.position ?? 'above'}
            options={[
              { value: 'above', label: 'Above' },
              { value: 'left', label: 'Beside' },
            ]}
            onChange={(position) => onUpdate({ contentLabel: { show: true, position } })}
          />

          <div className="flex flex-col gap-1">
            <span className={LABEL_CLASS}>Text</span>
            <input
              type="text"
              value={draft}
              placeholder={defaultText || 'Label'}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              aria-label="Label text"
              className={INPUT_CLASS}
            />
          </div>

          <SubsectionHeading label="Label style" />
          <TextStyleControls
            compact
            style={effectiveLabelStyle(component)}
            onChange={(partial) => onUpdate({ labelStyle: mergeTextStyle(component.labelStyle, partial) })}
            onReplace={(next) => onUpdate({ labelStyle: mergeTextStyle(undefined, next) })}
            onReset={() => onUpdate({ labelStyle: undefined })}
          />
        </>
      )}
    </div>
  );
}
