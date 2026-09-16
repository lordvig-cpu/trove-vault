export type ThemePreset = 
    'theme-oklch-dark' |
    'theme-oklch-light';

/** Preserve the light/dark preference saved by older theme selectors. */
export function normalizeTheme(value: unknown): ThemePreset {
    return value === 'theme-default-light' || value === 'theme-oklch-light'
        ? 'theme-oklch-light'
        : 'theme-oklch-dark';
}
