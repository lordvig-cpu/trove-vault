/* Shared class strings for the template editor bar: orange base, yellow for hover / selected.
   Written out in full (no interpolation) so Tailwind can detect every class. */

/** Idle control: amber outline and text on the orange bar; white on hover. */
export const idleBtn =
  'bg-black/40 border-[var(--secondary-accent)] text-[var(--secondary-accent)] hover:border-white hover:text-white hover:bg-white/10';

/** Selected / open control: the same fill and inset highlight as a flyout's active tab
    (.menuTab-active in TreeSubMenu.css) -- a solid warm-gold gradient, not a translucent mix of
    --flyout-selected over the dark bar, which read as yellow-green rather than gold. The border is
    the pure --flyout-selected yellow rather than the tab's own --flyout-tab-active-border (that one
    leans orange, mixed 55/45 with --secondary-accent) -- the bar's selected border reads as yellow,
    not amber, to stay distinct from the idle amber border around it. Text stays --flyout-selected
    too, matching the tab's own text color. */
export const activeBtn =
  'bg-[linear-gradient(180deg,var(--flyout-tab-active-top),var(--flyout-tab-active-bottom))] border-[var(--flyout-selected)] text-[var(--flyout-selected)] shadow-[inset_0_1px_0_color-mix(in_oklch,white_22%,transparent)]';

/** Same yellow as activeBtn's text, for icons elsewhere (e.g. the Layout tree's Body/Row/
    Column glyphs) that should read as "this is a selected-style control" without the full pill. */
export const activeIconColor = 'text-[var(--flyout-selected)]';

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
