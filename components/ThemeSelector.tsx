'use client';

import { useUIPreferences } from '@/context/UIPreferencesContext';
import { THEME_OPTIONS } from '@/types/theme';

/** Footer segmented control: Dark, Light or EmberSteel. */
export default function ThemeSelector() {
  const { theme, setTheme } = useUIPreferences();
  return (
    <div className="theme-selector" role="radiogroup" aria-label="Color theme">
      {THEME_OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={theme === option.id}
          className={theme === option.id ? 'theme-selector-btn theme-selector-btn-active' : 'theme-selector-btn'}
          onClick={() => setTheme(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
