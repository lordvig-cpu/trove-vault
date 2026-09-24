/* Shared class strings for the template editor bar: orange base, blue for hover / selected.
   Written out in full (no interpolation) so Tailwind can detect every class. */

/** Idle control: amber outline and text on the orange bar; white on hover. */
export const idleBtn =
  'bg-black/40 border-[var(--secondary-accent)] text-[var(--secondary-accent)] hover:border-white hover:text-white hover:bg-white/10';

/** Selected / open control: light-blue fill, blue outline, light-blue text and a soft glow. */
export const activeBtn =
  'bg-[color-mix(in_oklch,var(--primary-accent)_34%,transparent)] border-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)] text-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)] shadow-[0_0_8px_color-mix(in_oklch,var(--primary-accent)_60%,transparent)]';

/** Same light blue as activeBtn's text, for icons elsewhere (e.g. the Layout tree's Body/Row/
    Column glyphs) that should read as "this is a selected-style control" without the full pill. */
export const activeIconColor = 'text-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)]';

/** Borderless menu row / icon button (zoom, sub-panel options). */
export const ghostBtn =
  'border border-transparent text-[var(--secondary-accent)] hover:border-white hover:text-white hover:bg-white/10';

export const disabledBtn = 'opacity-35 cursor-not-allowed';

/** Fixed height every bar control (pulldowns, toggle, icon buttons, Width/Zoom pills) shares, so
    text buttons and icon-only buttons — which naturally size differently — line up. The Fit
    checkbox is the one exception, kept at its own native size. */
export const barControlHeight = 'h-[26px]';

/** Segmented two-way toggle (Auto / Custom, Edit / Preview): a dark pill holding two buttons, the
    chosen one shown as activeBtn and the other as ghostBtn. */
export const barToggleGroup =
  'flex items-center gap-0.5 bg-black/40 px-0.5 h-[26px] rounded-md border border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)] shrink-0 text-[10px] font-semibold';

export const barToggleBtn = 'px-1.5 h-[22px] flex items-center gap-1 rounded transition';
