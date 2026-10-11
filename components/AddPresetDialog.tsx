'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { ChartIcon, ImageIcon, ListIcon } from '@/components/icons/ContentIcons';

/* ==========================================================================
   Adding a pre-defined content block (Field List, Header, Stat Row), opened from the Add menus (the top
   toolbar's Add pulldown, a container's gear Actions; lib/presetDialog.ts): choose which values it includes --
   the item's built-ins and the template's fields -- and, for a field list, how its rows read. Adding it builds
   ordinary containers and content (lib/layoutPresets.ts) in the chosen container; nothing here is remembered.
   ========================================================================== */

/** Each block's icon, matching the Add menus. */
export const PRESET_ICONS: Record<PresetKind, React.ReactNode> = {
  fieldList: <ListIcon className="w-3.5 h-3.5" />,
  header: <ImageIcon className="w-3.5 h-3.5" />,
  statRow: <ChartIcon className="w-3.5 h-3.5" />,
};

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

interface AddPresetDialogProps {
  kind: PresetKind;
  fields: FieldDefinition[];
  /** The container it will be added into, by name. */
  targetName: string;
  onAdd: (request: PresetRequest) => void;
  onCancel: () => void;
}

export default function AddPresetDialog({ kind, fields, targetName, onAdd, onCancel }: AddPresetDialogProps) {
  const info = PRESET_INFO[kind];
  const [picked, setPicked] = useState<PresetEntry[]>(() => defaultEntries(kind, fields));
  const [style, setStyle] = useState<FieldListStyle>('split');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const isOn = (entry: PresetEntry) => picked.some((p) => entryKey(p) === entryKey(entry));
  const toggle = (entry: PresetEntry) =>
    setPicked((current) => (isOn(entry) ? current.filter((p) => entryKey(p) !== entryKey(entry)) : [...current, entry]));

  const builtinEntries: PresetEntry[] = info.builtins.map((key) => ({ kind: 'builtin', key }));
  const fieldEntries: PresetEntry[] = fields.map((f) => ({ kind: 'field', field_id: f.id }));

  return createPortal(
    <div
      className="fixed inset-0 confirm-modal-backdrop flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="add-preset-title" className="confirm-modal-dialog rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="confirm-modal-header p-5 flex items-center justify-between">
          <div id="add-preset-title" className="flex items-center gap-2 font-bold text-base text-[var(--text-strong)]">
            <span className="text-[var(--secondary-accent)] flex">{PRESET_ICONS[kind]}</span>
            <span>
              Add: <span className="text-[var(--primary-accent-bright)]">{info.label}</span>
            </span>
          </div>
          <button type="button" onClick={onCancel} className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-content-muted leading-relaxed">{info.description}</p>

          <div className="flex flex-col gap-1.5" role="group" aria-label="What it includes">
            <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Includes</span>
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

          {kind === 'fieldList' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Rows</span>
              <div className={`${barToggleGroup} w-full max-w-xs`} role="group" aria-label="Row style">
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
          )}
        </div>

        <div className="confirm-modal-footer flex items-center justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onCancel}
            className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onAdd({ kind, entries: picked, style })}
            title={picked.length === 0 ? 'Pick at least one value to include' : `Add to ${targetName}`}
            className="item-modal-primary-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer disabled:cursor-not-allowed max-w-[60%] truncate"
          >
            Add to {targetName}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
