'use client';

import { useEffect, useId, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SeedColorPicker from '@/components/SeedColorPicker';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, hexToRgba, normalizeHex, rgbaToHex } from '@/lib/color';

function HexSeedInput({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const displayed = draft ?? value;
  const invalid = normalizeHex(displayed) === null;

  return (
    <div className="oklch-seed-field">
      <label htmlFor={id}>{label}</label>
      <span className="oklch-seed-input-wrap">
        <SeedColorPicker
          label={label}
          value={value}
          onChange={hex => {
            setDraft(null);
            onChange(hex);
          }}
        />
        <input
          id={id}
          type="text"
          value={displayed}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          title="Enter a 3- or 6-digit HEX color, with or without #"
          onFocus={() => setDraft(value)}
          onChange={event => {
            const next = event.target.value;
            setDraft(next);
            const hex = normalizeHex(next);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
          }}
        />
      </span>
      <span id={`${id}-hint`} className="sr-only">
        Enter 3 or 6 hexadecimal digits. Valid colors apply immediately to OKLCH.
        Incomplete or invalid input keeps the last valid color and resets on blur.
      </span>
    </div>
  );
}

export default function OklchSeedControls() {
  const [primary, setPrimary] = useLocalStorage<string | null>('uc_oklch_primary', null);
  const [secondary, setSecondary] = useLocalStorage<string | null>('uc_oklch_secondary', null);
  const primaryHex = normalizeHex(primary);
  const secondaryHex = normalizeHex(secondary);

  useEffect(() => {
    const style = document.documentElement.style;
    // Relative OKLCH expressions accept RGBA seeds directly; the browser performs
    // conversion and recalculates the entire recipe, including light mode.
    if (primaryHex) style.setProperty('--oklch-blue', hexToRgba(primaryHex));
    else style.removeProperty('--oklch-blue');
    if (secondaryHex) style.setProperty('--oklch-yellow', hexToRgba(secondaryHex));
    else style.removeProperty('--oklch-yellow');
    return () => {
      style.removeProperty('--oklch-blue');
      style.removeProperty('--oklch-yellow');
    };
  }, [primaryHex, secondaryHex]);

  return (
    <div className="oklch-seed-controls" role="group" aria-label="OKLCH seed colors">
      <HexSeedInput label="Primary" value={primaryHex ?? rgbaToHex(DEFAULT_PRIMARY_COLOR)} onChange={value => {
        setPrimary(value);
      }} />
      <HexSeedInput label="Secondary" value={secondaryHex ?? rgbaToHex(DEFAULT_SECONDARY_COLOR)} onChange={value => {
        setSecondary(value);
      }} />
      <button
        type="button"
        className="oklch-seed-reset"
        title="Restore the original blue and yellow seeds"
        onClick={() => { setPrimary(null); setSecondary(null); }}
      >
        Reset
      </button>
    </div>
  );
}
