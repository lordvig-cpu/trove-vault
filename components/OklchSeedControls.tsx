'use client';

import { useEffect, useId, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SeedColorPicker from '@/components/SeedColorPicker';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, hexToRgba, normalizeHex, rgbaToHex } from '@/lib/color';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { DiceIcon } from '@/components/icons/NavigationIcons';
import type { ThemePreset } from '@/types/theme';

/** Seeds each theme starts from when nothing is saved. Must match the CSS defaults: Dark/Light in
    theme-oklch-dark.css (background: the calibrated canvas sample), New 'n Shiny in its own file. */
const SHINY_SEEDS = {
  primary: '#64748B', // primary accent: side and bottom panels
  secondary: '#F59E0B', // secondary accent: text and edges in menus and toolbars
  background: '#080D10',
  primaryColor: '#334155', // header and footer
  secondaryColor: '#44403C', // tree submenus, search menus, template toolbars
};
function defaultSeeds(theme: ThemePreset) {
  return theme === 'theme-oklch-new-n-shiny'
    ? SHINY_SEEDS
    : {
        primary: rgbaToHex(DEFAULT_PRIMARY_COLOR),
        secondary: rgbaToHex(DEFAULT_SECONDARY_COLOR),
        background: rgbaToHex(DEFAULT_BACKGROUND_COLOR),
        primaryColor: rgbaToHex(DEFAULT_PRIMARY_COLOR),
        secondaryColor: rgbaToHex(DEFAULT_SECONDARY_COLOR),
      };
}

/** A random hex color with mid-range saturation and lightness, so the derived OKLCH recipe stays readable. */
function randomHex() {
  const h = Math.random() * 360;
  const s = 0.45 + Math.random() * 0.4;
  const l = 0.3 + Math.random() * 0.3;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

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
  const { theme } = useUIPreferences();
  const shiny = theme === 'theme-oklch-new-n-shiny';
  // Dark and Light share one saved set (the original keys); New 'n Shiny keeps its own.
  const suffix = shiny ? '_shiny' : '';
  // The two original seeds: --oklch-blue is the primary accent, --oklch-yellow the secondary accent.
  const [accentA, setAccentA] = useLocalStorage<string | null>(`uc_oklch_primary${suffix}`, null);
  const [accentB, setAccentB] = useLocalStorage<string | null>(`uc_oklch_secondary${suffix}`, null);
  const [background, setBackground] = useLocalStorage<string | null>(`uc_oklch_background${suffix}`, null);
  // The header/footer/main-content color and the menu/toolbar color: independent of the two accents.
  const [primaryColor, setPrimaryColor] = useLocalStorage<string | null>(`uc_oklch_primary_color${suffix}`, null);
  const [secondaryColor, setSecondaryColor] = useLocalStorage<string | null>(`uc_oklch_secondary_color${suffix}`, null);
  const accentAHex = normalizeHex(accentA);
  const accentBHex = normalizeHex(accentB);
  const backgroundHex = normalizeHex(background);
  const primaryColorHex = normalizeHex(primaryColor);
  const secondaryColorHex = normalizeHex(secondaryColor);
  const defaults = defaultSeeds(theme);

  useEffect(() => {
    const style = document.documentElement.style;
    // Relative OKLCH expressions accept RGBA seeds directly; the browser performs
    // conversion and recalculates the entire recipe, including light mode. An unset seed
    // falls through to the active theme's CSS default.
    const seeds: Array<[string, string | null]> = [
      ['--oklch-blue', accentAHex],
      ['--oklch-yellow', accentBHex],
      ['--oklch-bg', backgroundHex],
      ['--oklch-primary', primaryColorHex],
      ['--oklch-secondary', secondaryColorHex],
    ];
    for (const [property, hex] of seeds) {
      if (hex) style.setProperty(property, hexToRgba(hex));
      else style.removeProperty(property);
    }
    return () => seeds.forEach(([property]) => style.removeProperty(property));
  }, [accentAHex, accentBHex, backgroundHex, primaryColorHex, secondaryColorHex]);

  return (
    <div className="oklch-seed-controls" role="group" aria-label="OKLCH seed colors">
      <HexSeedInput label="Background" value={backgroundHex ?? defaults.background} onChange={setBackground} />
      <HexSeedInput label="Primary" value={primaryColorHex ?? defaults.primaryColor} onChange={setPrimaryColor} />
      <HexSeedInput label="Primary Accent" value={accentAHex ?? defaults.primary} onChange={setAccentA} />
      <HexSeedInput label="Secondary" value={secondaryColorHex ?? defaults.secondaryColor} onChange={setSecondaryColor} />
      <HexSeedInput label="Secondary Accent" value={accentBHex ?? defaults.secondary} onChange={setAccentB} />
      <button
        type="button"
        className="oklch-seed-dice"
        title="Randomize all five colors"
        aria-label="Randomize all five colors"
        onClick={() => {
          setAccentA(randomHex()); setAccentB(randomHex()); setBackground(randomHex());
          setPrimaryColor(randomHex()); setSecondaryColor(randomHex());
        }}
      >
        <DiceIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="oklch-seed-reset"
        title="Restore this theme's original seed colors"
        onClick={() => {
          setAccentA(null); setAccentB(null); setBackground(null);
          setPrimaryColor(null); setSecondaryColor(null);
        }}
      >
        Reset
      </button>
    </div>
  );
}
