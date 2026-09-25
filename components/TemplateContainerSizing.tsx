'use client';

import React, { useState } from 'react';
import { FlexContainerNode } from '@/types/layout';
import { barControlHeight } from '@/components/editorBarStyles';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';

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

function SizeField({
  label,
  value,
  placeholder,
  title,
  onCommit,
}: {
  label: string;
  value?: string;
  placeholder: string;
  title: string;
  onCommit: (v: string | undefined) => void;
}) {
  const shown = (value || '').replace(/px$/i, '');
  const [draft, setDraft] = useState(shown);
  // Re-sync the draft when the stored value changes from elsewhere (reset, sibling menu).
  const [prevShown, setPrevShown] = useState(shown);
  if (prevShown !== shown) {
    setPrevShown(shown);
    setDraft(shown);
  }

  const commit = () => {
    const next = normalizeLength(draft);
    // Invalid text snaps back to the stored value; blank clears the rule.
    if (draft.trim() === '') onCommit(undefined);
    else if (next) onCommit(next);
    else setDraft(shown);
  };

  return (
    <div className="flex flex-col gap-1 min-w-0" title={title}>
      {label && (
        <label className="text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)] flex items-center justify-end gap-1">
          {label}
          <HelpCircleIcon className="w-3 h-3" />
        </label>
      )}
      <div className={`flex items-center gap-0.5 ${barControlHeight} bg-surface-secondary border border-subtle rounded-lg px-1.5 focus-within:border-[var(--secondary-accent)]`}>
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
          aria-label={`${label} (px or %)`}
          className="w-full min-w-0 bg-transparent text-xs font-mono text-strong text-right focus:outline-none placeholder:text-muted/60"
        />
        <span className="text-[10px] text-muted font-mono shrink-0">{/%$/.test(value || '') ? '%' : 'px'}</span>
      </div>
    </div>
  );
}

interface TemplateContainerSizingProps {
  container: FlexContainerNode;
  onUpdate: (partial: Partial<FlexContainerNode>) => void;
  /** Inside a flyout section: no card chrome or "Sizing" title, two columns (Width/Min/Max, then
   *  Height/Min/Max) that fit a narrow column, and "Stack when narrower than" on its own row. */
  bare?: boolean;
}

export default function TemplateContainerSizing({ container, onUpdate, bare = false }: TemplateContainerSizingProps) {
  // Width: sizing.value (fixed) is what the canvas renders; keep legacy `width` in step.
  const width = (container.sizing?.type === 'fixed' && container.sizing.value) || container.width || undefined;
  const height = container.sizing?.height || container.height || undefined;
  const minHeight = container.sizing?.minHeight || container.minHeight || undefined;

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
      <div className={bare ? 'grid grid-cols-2 grid-rows-3 grid-flow-col gap-2' : 'grid grid-cols-3 gap-2'}>
        <SizeField label="Width" value={width} placeholder="fill" title="Blank = fill the available space. Enter px or %." onCommit={setWidth} />
        <SizeField label="Min. W" value={container.minWidth} placeholder="none" title="Never narrower than this." onCommit={(v) => onUpdate({ minWidth: v })} />
        <SizeField label="Max. W" value={container.maxWidth} placeholder="none" title="Never wider than this." onCommit={(v) => onUpdate({ maxWidth: v })} />
        <SizeField label="Height" value={height} placeholder="auto" title="Blank = grow with content." onCommit={setHeight} />
        <SizeField label="Min. H" value={minHeight} placeholder="none" title="Never shorter than this." onCommit={setMinHeight} />
        <SizeField label="Max. H" value={container.maxHeight} placeholder="none" title="Never taller than this." onCommit={(v) => onUpdate({ maxHeight: v })} />
      </div>

      {container.direction === 'row' && (
        <div className={bare ? 'flex flex-col gap-1' : 'pt-2 border-t border-[var(--primary-border-subtle)] flex items-center justify-between gap-2'}>
          <label
            className="text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)] text-right"
            title="When this row gets narrower than this width, its children stack vertically."
          >
            Stack when narrower than
          </label>
          <SizeField
            label=""
            value={container.stackBelow ? `${container.stackBelow}px` : undefined}
            placeholder="never"
            title="Rows only. Blank = never stack."
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
