/** Recalibrate against Premium Contrast: node scripts/generate-oklch-theme.mjs.
 * Only writes the shared recipe; editable seeds and light-mode rules are separate.
 * Conversion is performed at generation time. Runtime colors are calculated by CSS.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const directory = new URL('../app/styles/themes/', import.meta.url);
const source = readFileSync(new URL('theme-premium-contrast.css', directory), 'utf8');

function toOklch(rgb) {
  const [r, g, b] = rgb.map(value => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    Math.hypot(a, bb), (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360];
}

const seeds = { blue: toOklch([0, 119, 255]), yellow: toOklch([248, 188, 9]) };
const round = value => Number(value.toFixed(5));
const palette = new Map();
const colorPattern = /rgba?\([^)]*\)|#[\da-f]{6}\b/gi;

// Samples are calibrated against the blue/yellow seeds. Two more families use the same ratios
// against their own seeds, which default to blue/yellow (theme-oklch-dark.css), so the default
// palette is unchanged: "primary" recolors the header/footer bars and the main content (item cards, pills, canvas glow), "secondary" the surfaces of the
// tree submenus and search menus.
const seedVars = { blue: '--oklch-blue', yellow: '--oklch-yellow', primary: '--oklch-primary', secondary: '--oklch-secondary' };
const calibration = { blue: 'blue', yellow: 'yellow', primary: 'blue', secondary: 'yellow' };
// The yellow-to-orange hue correction of the yellow/secondary samples fades out above the default amber
// (hue 66.6) and is gone by ~127, so a blue or green pick keeps the hue that was picked instead of
// drifting ~27 degrees toward teal. The default seed and reds are unchanged.
const primaryTokens = /^--(nav-(header|footer)|col-dropdown|content-(card|pill))-|^--studio-grid-(glow-top|line|vignette)/;
const menuTokens = /^--(tree-menu|tree-filter)-/;

function sample(family, rgb) {
  const [lightness, chroma, hue] = toOklch(rgb);
  const [seedL, seedC, seedH] = seeds[calibration[family]];
  const name = `--oklch-${family}-${rgb.join('-')}`;
  if (!palette.has(name)) {
    const hueShift = chroma < 0.00001 ? 0 : round(hue - seedH);
    palette.set(name, `oklch(from var(${seedVars[family]}) calc(l * ${round(lightness / seedL)}) calc(c * ${chroma < 0.00001 ? 0 : round(chroma / seedC)}) calc(h + ${hueShift}${calibration[family] === 'yellow' ? ' * clamp(0, (h - 35) / 50, 1) * clamp(0, 1 - (h - 66.6) / 60, 1)' : ''}))`);
  }
  return name;
}

function replaceColor(literal, token) {
  const values = literal.startsWith('#')
    ? literal.slice(1).match(/../g).map(value => parseInt(value, 16))
    : literal.match(/[\d.]+/g).map(Number);
  const rgb = values.slice(0, 3);
  const alpha = values[3] ?? 1;
  const [lightness, chroma, hue] = toOklch(rgb);
  const family = hue < 115 && hue > 35 && chroma > 0.02 ? 'yellow' : 'blue';
  const name = sample(family, rgb);

  // Shadows remain dark and highlights remain white in both modes.
  if (rgb.every(value => value === 0) || /shadow|overlay-bg/.test(token) && lightness < 0.15) {
    return `oklch(from var(${name}) l c h / calc(${alpha} * var(--oklch-shadow-opacity)))`;
  }
  if (token === '--content-btn-primary-text' || token === '--tree-filter-checkbox-bg' || lightness > 0.99 && alpha < 1) {
    return `oklch(from var(${name}) l c h / ${alpha})`;
  }
  const isInk = /text|title|placeholder|icon|heading|label/.test(token) && !/shadow|glow/.test(token);
  const isSurface = /bg|background|surface-hover|active-top|active-mid|active-bottom|sticky-shadow/.test(token)
    && lightness < 0.55 && !/btn-primary/.test(token);
  const role = isInk || lightness > 0.9 && alpha === 1 ? 'ink' : isSurface ? 'surface' : 'accent';
  const opacity = /glow|flare|vignette/.test(token)
    ? `calc(${alpha} * var(--oklch-glow-opacity))` : alpha;
  const surfaceName = family === 'blue' && role !== 'ink' && primaryTokens.test(token) ? sample('primary', rgb)
    : family === 'yellow' && role === 'surface' && menuTokens.test(token) ? sample('secondary', rgb) : name;
  return `oklch(from var(${surfaceName}) clamp(0, calc(var(--oklch-${role}-offset) + l * var(--oklch-${role}-scale)), 1) calc(c * var(--oklch-${role}-chroma)) h / ${opacity})`;
}

const declarations = source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'))
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(--[\w-]+)\s*:\s*([^;]+);/g, (_, token, value) =>
    `${token}: ${value.replace(colorPattern, literal => replaceColor(literal, token))};`)
  .replace(/\n\s*\n/g, '\n');

// The optional third seed (--oklch-bg, the Background picker) replaces the two calibrated canvas
// samples when it is set; unset, they fall back to the original blue-derived expressions, so the
// default palette is unchanged. The grid sample is the canvas, a little darker and less saturated.
// Flyout surface mixes in theme-semantic.css need this sample from the secondary family.
sample('secondary', [217, 119, 6]);
// The main content's border aliases (theme-semantic.css) need these two from the primary family.
sample('primary', [0, 140, 255]);
sample('primary', [0, 180, 255]);
const canvasName = '--oklch-blue-10-15-24';
const gridName = '--oklch-blue-8-12-20';
if (palette.has(canvasName) && palette.has(gridName)) {
  const canvasBase = palette.get(canvasName);
  palette.set(canvasName, `oklch(from var(--oklch-bg, ${canvasBase}) l c h)`);
  palette.set(gridName, `oklch(from var(--oklch-bg, ${canvasBase}) calc(l * 0.918) calc(c * 0.899) calc(h + 1.34))`);
}

writeFileSync(new URL('theme-oklch.css', directory), `/* Generated by scripts/generate-oklch-theme.mjs from Premium Contrast.
   Edit seeds in theme-oklch-dark.css and mode rules in theme-oklch-light.css.
   RGB suffixes identify calibration samples, not runtime color literals.
   Green/red/violet semantic colors are hue rotations of the blue seed. */
:is([data-theme='theme-oklch-dark'], [data-theme='theme-oklch-light'], [data-theme='theme-oklch-sunset-tide']) {
  /* Calibrated dark palette: L/C ratios and hue offsets from two seeds. */
${[...palette].map(([name, value]) => `  ${name}: ${value};`).join('\n')}

  /* Component recipes preserve the original gradients, textures and geometry. */
${declarations}
}
`);
console.log(`Generated ${palette.size} seed-relative palette samples.`);
