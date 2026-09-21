Component styles use the shared vocabulary in
[`../themes/theme-semantic.css`](../themes/theme-semantic.css).

| Token family | Meaning | Example |
| --- | --- | --- |
| `--primary-*` | First HEX seed, including its surfaces and borders | `--primary-accent`, `--primary-border-subtle` |
| `--secondary-*` | Second HEX seed, including selection and focus colors | `--secondary-accent`, `--secondary-focus-ring` |
| `--surface-*` | Shared canvas, panel, popover, or hover surface | `--surface-panel`, `--surface-primary-hover` |
| `--text-*` | Text hierarchy, independent of accent numbering | `--text-strong`, `--text-soft`, `--text-muted` |
| `--template-*` | Derived violet template styling | `--template-surface` |
| `--shadow-*`, `--highlight-*` | Shared neutral effects | `--shadow-form-inset` |
| `--editor-*` | Stable HEX editor colors, unaffected by experimental seeds | `--editor-surface` |

Primary and secondary describe the seed, not a fixed blue/yellow hue. For
example, `--primary-tree-panel-bg` is the panel's layered first-seed
background; `--secondary-tree-menu-shell-bg` is its second-seed counterpart.
Success/error colors keep their existing semantic names. Mixed-color shadows,
textures, dimensions and animation settings keep component-specific names.

Use shared roles for repeated treatments:

```css
.example-selection {
  color: var(--secondary-accent);
  background: var(--secondary-selection-bg);
  border: 1px solid var(--secondary-selection-border);
}

.example-input:focus-visible {
  border-color: var(--secondary-accent);
  box-shadow: var(--secondary-focus-ring);
}
```

Distinct calibrated shades retain descriptive component suffixes. Do not
replace every first-seed color with `--primary-accent`: that would flatten
surface depth and erase the light-mode text/surface relationships.

Add shared color roles to `theme-semantic.css`, rather than copying RGB
fallbacks into components. That file aliases the existing theme recipe;
it does not duplicate the OKLCH calculations. References go one way from
semantic names to recipe tokens. Never point a recipe token back to its alias.
The generator continues to own `theme-oklch.css`; regenerating it does not
overwrite the component vocabulary.
