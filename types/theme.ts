export type ThemePreset =
    'theme-oklch-dark' |
    'theme-oklch-light' |
    'theme-oklch-classic';

/** The footer's theme selector, in display order. Dark and Light are the EmberSteel palette
    (theme-oklch-embersteel.css); Classic is the original blue/orange dark theme. */
export const THEME_OPTIONS: ReadonlyArray<{ id: ThemePreset; label: string }> = [
    { id: 'theme-oklch-dark', label: 'Dark' },
    { id: 'theme-oklch-light', label: 'Light' },
    { id: 'theme-oklch-classic', label: 'Classic' },
];

/** Map a saved theme value (including ids from older selectors) to a current preset. */
export function normalizeTheme(value: unknown): ThemePreset {
    if (value === 'theme-oklch-classic') return 'theme-oklch-classic';
    return value === 'theme-default-light' || value === 'theme-oklch-light'
        ? 'theme-oklch-light'
        // 'theme-oklch-embersteel' and 'theme-oklch-new-n-shiny' were this theme's earlier ids.
        : 'theme-oklch-dark';
}
