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
[`../components/README.md`](../components/README.md) for the naming guide.
