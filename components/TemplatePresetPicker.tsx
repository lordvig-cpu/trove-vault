'use client';

import React, { useState } from 'react';
import type { FieldDefinition } from '@/types/field';
import {
  PRESET_INFO,
  defaultEntries,
  entryLabel,
  type FieldListStyle,
  type PresetEntry,
  type PresetKind,
  type PresetRequest,
} from '@/lib/layoutPresets';
import { BUILTIN_LABELS } from '@/lib/layoutContent';
import { activeBtn, barToggleBtn, barToggleGroup, ghostBtn } from '@/components/editorBarStyles';
import { CheckIcon } from '@/components/icons/GlyphIcons';
import { CloseIcon } from '@/components/icons/PanelIcons';

/* ==========================================================================
   The step after picking a pre-defined content block in the Components palette: choose which values
   it includes (the item's built-ins and the template's fields), and for a field list how its rows
   read. Adding it builds ordinary containers and content (lib/layoutPresets.ts); nothing here is
   remembered afterwards.
   ========================================================================== */

const entryKey = (e: PresetEntry) => (e.kind === 'builtin' ? `builtin:${e.key}` : `field:${e.kind === 'field' ? e.field_id : ''}`);

/** A toggle chip: ticked entries are included in the block. */
function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`px-2 h-[24px] rounded-full border text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
        on
          ? 'bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] border-[var(--primary-accent)] text-[var(--text-strong)]'
          : 'bg-surface-secondary border-subtle text-muted hover:text-[var(--text-strong)]'
      }`}
    >
      {on && <CheckIcon className="w-2.5 h-2.5" />}
      {label}
    </button>
  );
}

export default function TemplatePresetPicker({
  kind,
  fields,
  targetName,
  onAdd,
  onCancel,
}: {
  kind: PresetKind;
  fields: FieldDefinition[];
  /** Where it will be added, for the button. */
  targetName: string;
  onAdd: (request: PresetRequest) => void;
  onCancel: () => void;
}) {
  const info = PRESET_INFO[kind];
  const [picked, setPicked] = useState<PresetEntry[]>(() => defaultEntries(kind, fields));
  const [style, setStyle] = useState<FieldListStyle>('split');

  const isOn = (entry: PresetEntry) => picked.some((p) => entryKey(p) === entryKey(entry));
  const toggle = (entry: PresetEntry) =>
    setPicked((current) => (isOn(entry) ? current.filter((p) => entryKey(p) !== entryKey(entry)) : [...current, entry]));

  const builtinEntries: PresetEntry[] = info.builtins.map((key) => ({ kind: 'builtin', key }));
  const fieldEntries: PresetEntry[] = fields.map((f) => ({ kind: 'field', field_id: f.id }));

  return (
    <div className="flex items-stretch gap-4 h-full w-full min-w-0" role="group" aria-label={`Add a ${info.label}`}>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1 h-full overflow-y-auto primary-panel-scroll">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-strong">{info.label}</span>
          <span className="text-[10px] text-muted truncate">Choose what it includes</span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {builtinEntries.map((entry) => (
            <Chip key={entryKey(entry)} label={entry.kind === 'builtin' ? BUILTIN_LABELS[entry.key] : ''} on={isOn(entry)} onClick={() => toggle(entry)} />
          ))}
          {fieldEntries.length > 0 && <span className="w-px h-4 bg-[var(--primary-border-subtle)] mx-0.5" aria-hidden="true" />}
          {fieldEntries.map((entry) => (
            <Chip key={entryKey(entry)} label={entryLabel(entry, fields)} on={isOn(entry)} onClick={() => toggle(entry)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-2 shrink-0 w-[210px]">
        {kind === 'fieldList' ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Rows</span>
            <div className={`${barToggleGroup} w-full`} role="group" aria-label="Row style">
              {(
                [
                  ['split', 'Label | Value', 'Label on the left, value on the right'],
                  ['inline', 'Label: Value', 'Label beside its value'],
                ] as const
              ).map(([value, label, title]) => (
                <button
                  key={value}
                  type="button"
                  title={title}
                  aria-pressed={style === value}
                  onClick={() => setStyle(value)}
                  className={`${barToggleBtn} flex-1 justify-center text-[10.5px] font-semibold ${
                    style === value ? `border cursor-default ${activeBtn}` : `${ghostBtn} cursor-pointer`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-muted leading-relaxed">{info.description}</span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onAdd({ kind, entries: picked, style })}
            className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-label transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed truncate"
            title={`Add to ${targetName}`}
          >
            Add to {targetName}
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            title="Cancel"
            className="w-7 h-7 rounded-lg border border-subtle text-muted hover:text-[var(--text-strong)] flex items-center justify-center cursor-pointer shrink-0"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
