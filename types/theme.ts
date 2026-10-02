export type ThemePreset =
    'theme-oklch-dark' |
    'theme-oklch-light' |
    'theme-oklch-embersteel';

/** The footer's theme selector, in display order. */
export const THEME_OPTIONS: ReadonlyArray<{ id: ThemePreset; label: string }> = [
    { id: 'theme-oklch-dark', label: 'Dark' },
    { id: 'theme-oklch-light', label: 'Light' },
    { id: 'theme-oklch-embersteel', label: "EmberSteel" },
];

/** Preserve the light/dark preference saved by older theme selectors. */
export function normalizeTheme(value: unknown): ThemePreset {
    // 'theme-oklch-new-n-shiny' is the id this theme was saved under before it was renamed.
    if (value === 'theme-oklch-embersteel' || value === 'theme-oklch-new-n-shiny') return 'theme-oklch-embersteel';
    return value === 'theme-default-light' || value === 'theme-oklch-light'
        ? 'theme-oklch-light'
        : 'theme-oklch-dark';
}
