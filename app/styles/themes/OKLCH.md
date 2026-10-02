OKLCH Dark and Light are the application's base themes. New sessions start
in dark mode. The bottom-right footer icon is the only light/dark switch;
preference storage remembers your selection. Older saved light preferences
resolve to OKLCH Light, and older dark/premium preferences to OKLCH Dark.

Click either color swatch in the footer to open a compact color square and
hue slider, with no eyedropper or browser-specific controls. Drag in the square
to change saturation/brightness, or use the arrow keys (Shift for larger steps).
Escape or clicking outside closes the picker. Selections update the palette
and the adjacent HEX value immediately.
The footer's Primary and Secondary inputs also accept 3- or 6-digit HEX values,
with or without `#`. Valid input immediately recalculates
both palettes. Your seeds persist across reloads; Reset restores the CSS
defaults. Incomplete input keeps the last valid color. These controls override
the two CSS seeds for both modes without changing the active light/dark mode.

Edit `--oklch-blue` and `--oklch-yellow` in `theme-oklch-dark.css` to recolor
both modes. CSS performs the color calculations; no regeneration is needed.
Use a browser that supports CSS relative colors (`oklch(from …)`).

`theme-oklch.css` is the shared recipe. Its dark colors are calculated from
the seeds using calibrated lightness/chroma ratios and hue offsets. Those
relationships reproduce Premium Contrast's colors, including its semantic
green/red/violet colors, while preserving gradient positions, textures and
opacity. The RGB suffixes on internal sample names identify the original
calibration color; their values are relative OKLCH expressions.

The secondary (amber-family) hue offsets are scaled by how far the seed's hue is above 35°
(`clamp(0, (h - 35) / 50, 1)`): full strength for a gold seed (hue about 85°, where the original
palette was calibrated), shrinking toward zero for orange and red seeds. Without that, the fixed
-15° to -39° offsets that turn gold into brown-orange pushed an orange seed into red. Red seeds
(hue 35° or less) now keep every amber-family color at the seed's own hue.

Light mode applies these rules to the same dark samples:

| Role | Lightness | Chroma |
| --- | --- | --- |
| Surface | `1.08 - 0.65 × L` | `0.38 × C` |
| Text/icons | `0.85 - 0.65 × L` | `0.75 × C` |
| Accent/border | `0.72 × L` | `0.75 × C` |

Hue stays constant. Lightness is clamped to [0, 1]. Black shadows retain
their hue and use 18% of their original opacity; glows use 55%. White button
labels and translucent highlights retain their purpose. These are design
relationships, not a guarantee of contrast for arbitrary replacement seeds.

Tune the coefficients in `theme-oklch-light.css` to adjust the derived light
appearance without maintaining a second component palette. The legacy default
theme registries have been removed; OKLCH and semantic tokens supply both modes.
Premium Contrast is retained as generator input and is not imported at runtime.

To recalibrate after deliberately changing Premium Contrast, run
`node scripts/generate-oklch-theme.mjs`. This rewrites only `theme-oklch.css`;
it preserves the editable seeds and mode rules.

Component styles consume the readable aliases in `theme-semantic.css`.
`--primary-*` follows the first seed and `--secondary-*` follows the second;
shared text and surface roles have their own prefixes. See
[`README.md`](README.md) for the naming guide.

## Neutral poles and status colors

The only literal black/white/cyan/`rgba()` values live in `theme-oklch-dark.css` (defaults) and
`theme-oklch-light.css` (overrides). Everything else consumes them:

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--pole-surface` | black | white | what dark fills mix toward (flyout cards, input wells, dropdown wash) |
| `--pole-shade` | black | deep brown | sunken tint / inner shadow (`bg-shade/40`) |
| `--pole-glint` | white | deep ink | hover border/text/tint on amber controls (`hover:border-glint`) |
| `--pole-sheen` | white | white | translucent top highlights |
| `--pole-label` | white | white | text/knob on a solid accent fill (`text-label`, `bg-label`) |
| `--status-*` | | | dock drop-zone ok/danger roles (warning is `--secondary-accent`) |
| `--flyout-ink-l/-c`, `--badge-ink-l/-c` | | | title / badge ink lightness, deepened in light |

Tailwind exposes the poles as `shade`, `glint`, `sheen`, `label` colors (`@theme inline` in
`globals.css`), which also re-points the stock slate/amber/red/rose/emerald shades the template
editor uses at theme roles. Don't write `black`, `white`, `cyan`, hex or `rgba()` in a component.
Known exceptions: `lib/color.ts` default seeds and `PICKER_START` in `TemplateAppearanceControls.tsx`
(JS needs a real hex), and template-owned colors stored as user data.

## Themes and the Background seed

The footer selector offers three presets. **Dark** and **Light** are the EmberSteel palette
(`theme-oklch-embersteel.css`); **Classic** is the original blue/orange dark theme, which is just the
shared recipe on the seeds in `theme-oklch-dark.css` and loads none of the EmberSteel rules (it is kept
for now and may be removed once Dark and Light are settled).

EmberSteel shares the recipe, then re-states the chrome as flat slate panels lifted from the Background
seed `--oklch-bg`, with charcoal (Dark) or pale (Light) flyouts and amber edges. Dark and Light share one
set of rules; the two blocks at the top of the file hold only the per-mode parameters: the five seeds,
`--ember-base` (what every surface mixes toward: near-black or near-white), the ink levels
(`--ember-ink-*`), the grid step, and the shadow depth. Glow strength follows `--oklch-glow-opacity`
(from `theme-oklch-light.css`). Dark seeds: slate `#6C85A6`, amber `#FF9D00`, background `#14171B`;
Light seeds: `#4F6D94`, `#B36B00`, `#E9EDF2`. `DEFAULT_SEEDS` in `OklchSeedControls.tsx` mirrors all
three themes' defaults for the picker display and must be kept in step with the CSS.

`--oklch-bg` is optional in Classic: unset, the calibrated canvas samples
(`--oklch-blue-10-15-24`, `--oklch-blue-8-12-20`) fall back to their blue-derived expressions
(`scripts/generate-oklch-theme.mjs` emits that); set, the Background picker replaces them. Each theme
saves its own seeds (`uc_oklch_*` for Classic, `uc_oklch_*_embersteel` for Dark,
`uc_oklch_*_embersteel_light` for Light). Wash strength at the top and around flyouts/toolbars is
`--flyout-glow-top` / `--flyout-glow-outer`; `--flyout-heading` is the split-flyout title color.

### EmberSteel (Dark and Light): five colors

| Picker | Seed | Drives |
| --- | --- | --- |
| Background | `--oklch-bg` | canvas and grid, behind everything |
| Primary | `--oklch-primary` | header and footer bars; main content (item cards, pills, rules, canvas glow) |
| Primary Accent | `--oklch-blue` | side and bottom panels and their rules; buttons, focus (not the main content) |
| Secondary | `--oklch-secondary` | tree submenus, search menus, template toolbars and their drop-downs |
| Secondary Accent | `--oklch-yellow` | default text, edges and selected states inside those menus/toolbars |

Surface colors are the seed mixed into the fixed `--ember-base`, so the Background picker recolors only the canvas and grid, and a picked color shows as a tint of itself (dark in Dark, pale in Light).

### Five colors in Classic

Classic uses the same five pickers and the same mapping. `--oklch-primary` and
`--oklch-secondary` default to the same colors as blue and yellow (as separate seeds, never linked to them), so an untouched
palette is unchanged; setting them recolors only the header/footer and main content (`--nav-header-*`, `--content-card-*`, `--content-pill-*`, `--studio-grid-*` glow, `--content-border-*`,
`--nav-footer-*`, `--col-dropdown-*`) and the surfaces of the tree submenus and search menus
(`--tree-menu-*`, `--tree-filter-*`, the `--flyout-*` body/tab fills). The generator emits those as
`--oklch-primary-*` / `--oklch-secondary-*` samples with the same ratios as the blue/yellow ones.
Default text in menus and toolbars is the secondary accent (`--menu-ink` in `theme-semantic.css`).
Menu edges and glows stay on the secondary accent.