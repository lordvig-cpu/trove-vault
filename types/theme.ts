export type ThemePreset =
    'theme-oklch-dark' |
    'theme-oklch-light' |
    'theme-oklch-new-n-shiny';

/** The footer's theme selector, in display order. */
export const THEME_OPTIONS: ReadonlyArray<{ id: ThemePreset; label: string }> = [
    { id: 'theme-oklch-dark', label: 'Dark' },
    { id: 'theme-oklch-light', label: 'Light' },
    { id: 'theme-oklch-new-n-shiny', label: "New 'n Shiny" },
];

/** Preserve the light/dark preference saved by older theme selectors. */
export function normalizeTheme(value: unknown): ThemePreset {
    if (value === 'theme-oklch-new-n-shiny') return 'theme-oklch-new-n-shiny';
    return value === 'theme-default-light' || value === 'theme-oklch-light'
        ? 'theme-oklch-light'
        : 'theme-oklch-dark';
}
