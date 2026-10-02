'use client';

import { useEffect, useId, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SeedColorPicker from '@/components/SeedColorPicker';
import { hexToRgba, normalizeHex } from '@/lib/color';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { DiceIcon, LockIcon, UnlockIcon } from '@/components/icons/NavigationIcons';
import type { ThemePreset } from '@/types/theme';

/** Seeds each theme starts from when nothing is saved. They must match the CSS defaults:
    Classic in theme-oklch-dark.css, Dark and Light in theme-oklch-embersteel.css. */
type Seeds = { primary: string; secondary: string; background: string; primaryColor: string; secondaryColor: string };
const DEFAULT_SEEDS: Record<ThemePreset, Seeds> = {
  'theme-oklch-dark': {
    primary: '#6C85A6', // primary accent: side and bottom panels
    secondary: '#FF9D00', // secondary accent: text and edges in menus and toolbars
    background: '#14171B',
    primaryColor: '#1D2127', // header and footer
    secondaryColor: '#3A3632', // tree submenus, search menus, template toolbars
  },
  'theme-oklch-light': {
    primary: '#4F6D94',
    secondary: '#B36B00',
    background: '#E9EDF2',
    primaryColor: '#CBD3DD',
    secondaryColor: '#E8DCC8',
  },
  'theme-oklch-classic': {
    primary: '#0077FF',
    secondary: '#FF9D00',
    background: '#0A0F18', // the calibrated canvas sample
    primaryColor: '#0077FF',
    secondaryColor: '#B06C00',
  },
};
function defaultSeeds(theme: ThemePreset): Seeds {
  return DEFAULT_SEEDS[theme];
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

const NO_LOCKS: string[] = [];

function HexSeedInput({ label, value, onChange, locked, onToggleLock }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  locked: boolean;
  onToggleLock: () => void;
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
          disabled={locked}
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
          disabled={locked}
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
        <button
          type="button"
          className="oklch-seed-lock"
          aria-pressed={locked}
          title={locked ? `Unlock ${label} (the dice can change it)` : `Lock ${label} (the dice will skip it)`}
          aria-label={locked ? `Unlock ${label}` : `Lock ${label}`}
          onClick={onToggleLock}
        >
          {locked ? <LockIcon className="w-3.5 h-3.5" /> : <UnlockIcon className="w-3.5 h-3.5" />}
        </button>
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
  // Each theme saves its own seeds: Classic keeps the original keys, Dark and Light add a suffix.
  const suffix = theme === 'theme-oklch-classic' ? '' : theme === 'theme-oklch-light' ? '_embersteel_light' : '_embersteel';
  // The two original seeds: --oklch-blue is the primary accent, --oklch-yellow the secondary accent.
  const [accentA, setAccentA] = useLocalStorage<string | null>(`uc_oklch_primary${suffix}`, null);
  const [accentB, setAccentB] = useLocalStorage<string | null>(`uc_oklch_secondary${suffix}`, null);
  const [background, setBackground] = useLocalStorage<string | null>(`uc_oklch_background${suffix}`, null);
  // The header/footer/main-content color and the menu/toolbar color: independent of the two accents.
  const [primaryColor, setPrimaryColor] = useLocalStorage<string | null>(`uc_oklch_primary_color${suffix}`, null);
  const [secondaryColor, setSecondaryColor] = useLocalStorage<string | null>(`uc_oklch_secondary_color${suffix}`, null);
  // Names of the seeds the dice must leave alone.
  const [locks, setLocks] = useLocalStorage<string[]>(`uc_oklch_locks${suffix}`, NO_LOCKS);
  const toggleLock = (name: string) =>
    setLocks(current => (current.includes(name) ? current.filter(n => n !== name) : [...current, name]));
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
      <HexSeedInput label="Background" value={backgroundHex ?? defaults.background} onChange={setBackground} locked={locks.includes('background')} onToggleLock={() => toggleLock('background')} />
      <HexSeedInput label="Primary" value={primaryColorHex ?? defaults.primaryColor} onChange={setPrimaryColor} locked={locks.includes('primary')} onToggleLock={() => toggleLock('primary')} />
      <HexSeedInput label="Primary Accent" value={accentAHex ?? defaults.primary} onChange={setAccentA} locked={locks.includes('accentA')} onToggleLock={() => toggleLock('accentA')} />
      <HexSeedInput label="Secondary" value={secondaryColorHex ?? defaults.secondaryColor} onChange={setSecondaryColor} locked={locks.includes('secondary')} onToggleLock={() => toggleLock('secondary')} />
      <HexSeedInput label="Secondary Accent" value={accentBHex ?? defaults.secondary} onChange={setAccentB} locked={locks.includes('accentB')} onToggleLock={() => toggleLock('accentB')} />
      <button
        type="button"
        className="oklch-seed-dice"
        title="Randomize all five colors"
        aria-label="Randomize all five colors"
        onClick={() => {
          if (!locks.includes('accentA')) setAccentA(randomHex());
          if (!locks.includes('accentB')) setAccentB(randomHex());
          if (!locks.includes('background')) setBackground(randomHex());
          if (!locks.includes('primary')) setPrimaryColor(randomHex());
          if (!locks.includes('secondary')) setSecondaryColor(randomHex());
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
