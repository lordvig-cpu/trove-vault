'use client';

import { useUIPreferences } from '@/context/UIPreferencesContext';
import { ChevronDownIcon } from '@/components/icons/PanelIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { THEME_OPTIONS, normalizeTheme } from '@/types/theme';

interface ThemeSelectorProps {
  /** Whether the theme's color pickers are showing. */
  colorsOpen: boolean;
  onToggleColors: () => void;
}

/**
 * Footer theme pulldown (Embersteel [Dark] / Aquaglass [Light] / Sunset Tide [Dark]) with a gear beside
 * it that shows and hides the theme's color pickers (OklchSeedControls). A native <select>: the footer
 * clips overflow, so a custom list would need a portal and its own z-index layer, and the native list
 * already follows the theme's light/dark color-scheme.
 */
export default function ThemeSelector({ colorsOpen, onToggleColors }: ThemeSelectorProps) {
  const { theme, setTheme } = useUIPreferences();
  return (
    <div className="theme-select-group">
      <div className="relative">
        <select
          value={theme}
          onChange={(event) => setTheme(normalizeTheme(event.target.value))}
          aria-label="Color theme"
          className="theme-select"
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="theme-select-chevron pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5" />
      </div>
      <button
        type="button"
        onClick={onToggleColors}
        aria-expanded={colorsOpen}
        aria-label={colorsOpen ? 'Hide theme colors' : 'Show theme colors'}
        title={colorsOpen ? 'Hide theme colors' : 'Show theme colors'}
        className={[
          'theme-gear-btn group/gear flex items-center justify-center w-6 h-6 shrink-0',
          'rounded border border-transparent cursor-pointer transition-colors',
          colorsOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger',
        ].join(' ')}
      >
        <GearIcon
          isActive={colorsOpen}
          className={[
            'w-[15px] h-[15px] transition-all duration-300 ease-out',
            colorsOpen ? 'tree-gear-open rotate-90' : 'tree-gear-closed',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
