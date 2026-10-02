export type ThemePreset =
    'theme-oklch-dark' |
    'theme-oklch-light' |
    'theme-oklch-sunset-tide';

/** The footer's theme pulldown, in display order. Embersteel is theme-oklch-embersteel.css, Aquaglass
    is theme-oklch-aquaglass.css, Sunset Tide is the original blue/orange dark theme. The id of the
    first two stays "dark" / "light" (the mode they belong to); the label names the theme and its mode. */
export const THEME_OPTIONS: ReadonlyArray<{ id: ThemePreset; label: string }> = [
    { id: 'theme-oklch-dark', label: 'Embersteel [Dark]' },
    { id: 'theme-oklch-light', label: 'Aquaglass [Light]' },
    { id: 'theme-oklch-sunset-tide', label: 'Sunset Tide [Dark]' },
];

/** Map a saved theme value (including ids from older selectors) to a current preset. */
export function normalizeTheme(value: unknown): ThemePreset {
    // 'theme-oklch-classic' was Sunset Tide's earlier id.
    if (value === 'theme-oklch-sunset-tide' || value === 'theme-oklch-classic') return 'theme-oklch-sunset-tide';
    return value === 'theme-default-light' || value === 'theme-oklch-light'
        ? 'theme-oklch-light'
        // 'theme-oklch-embersteel' and 'theme-oklch-new-n-shiny' were Embersteel's earlier ids.
        : 'theme-oklch-dark';
}
