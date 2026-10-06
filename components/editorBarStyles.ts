/* Shared class strings for the template editor bar: orange base, yellow for hover / selected.
   Written out in full (no interpolation) so Tailwind can detect every class. */

/** Idle control: amber outline and text on the orange bar; white on hover. */
export const idleBtn =
  'bg-shade/40 border-[var(--secondary-accent)] text-[var(--secondary-accent)] hover:border-glint hover:text-[var(--text-strong)] hover:bg-glint/10';

/** Selected / open control: the same fill and inset highlight as a flyout's active tab
    (.menuTab-active in TreeSubMenu.css) -- a solid warm-gold gradient, not a translucent mix of
    --flyout-selected over the dark bar, which read as yellow-green rather than gold. The border is
    the pure --flyout-selected yellow rather than the tab's own --flyout-tab-active-border (that one
    leans orange, mixed 55/45 with --secondary-accent) -- the bar's selected border reads as yellow,
    not amber, to stay distinct from the idle amber border around it. Text stays --flyout-selected
    too, matching the tab's own text color. */
export const activeBtn =
  'bg-[linear-gradient(180deg,var(--flyout-tab-active-top),var(--flyout-tab-active-bottom))] border-[var(--flyout-selected)] text-[var(--flyout-selected)] shadow-[inset_0_1px_0_color-mix(in_oklch,var(--pole-sheen)_22%,transparent)]';

/** The plain secondary OKLCH accent (not activeBtn's yellow), for icons elsewhere (e.g. the Layout
    tree's Body/Row/Column glyphs) that should read as "this is a selected-style control" without
    the full pill -- the tree keeps the amber family throughout rather than picking up the toolbar's
    yellow. */
export const activeIconColor = 'text-[var(--secondary-accent)]';

/** Borderless menu row / icon button (zoom, sub-panel options). */
export const ghostBtn =
  'border border-transparent text-[var(--secondary-accent)] hover:border-glint hover:text-[var(--text-strong)] hover:bg-glint/10';

export const disabledBtn = 'opacity-55 cursor-not-allowed';

/** Every unselected control on the template editor toolbars (text and icon buttons alike): the same
    idle / ghost / disabled looks as idleBtn / ghostBtn above, but in a soft menu white instead of
    amber (the primary accent on hover: border, text / icon and a faint tint). Selected controls still use activeBtn's yellow. idleBtn / ghostBtn
    stay amber for the flyouts and other menus. */
export const barIdleBtn =
  'bg-shade/40 border-[var(--secondary-accent)] text-[var(--flyout-white-soft)] hover:border-[var(--primary-accent)] hover:text-[var(--primary-accent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_10%,transparent)]';

export const barGhostBtn =
  'border border-transparent text-[var(--flyout-white-soft)] hover:border-[var(--primary-accent)] hover:text-[var(--primary-accent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_10%,transparent)]';

/** The toolbars' standalone icon buttons (eye, gear, delete, Bold / Italic / Underline, Undo / Redo /
    Reset / Save, the width Fit button): no border while inactive, a primary-accent border and icon on hover, and an
    amber icon (no pill) while selected / on. Disabled ones drop the hover. */
export const barIconBtn =
  'border-transparent text-[var(--flyout-white-soft)] hover:border-[var(--primary-accent)] hover:text-[var(--primary-accent)]';
export const barIconBtnOn =
  'border-transparent text-[var(--secondary-accent)] hover:border-[var(--primary-accent)]';
export const barIconBtnDisabled = 'border-transparent text-[var(--flyout-white-soft)] opacity-55 cursor-not-allowed';

/** A toolbar pulldown button (Add, Split, Shows, Style...): the same darker amber border as the
    toggle-group tracks around Size and Layout (barToggleGroup), the primary accent on hover. */
export const barGroupBtn =
  'bg-shade/40 border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)] text-[var(--flyout-white-soft)] hover:border-[var(--primary-accent)] hover:text-[var(--primary-accent)]';

/** A disabled toolbar control inside a toggle group or pulldown: faint white. */
export const barDisabledBtn = 'text-[var(--flyout-white-faint)] cursor-not-allowed';

/** Fixed height every bar control (pulldowns, toggle, icon buttons, Width/Zoom pills) shares, so
    text buttons and icon-only buttons — which naturally size differently — line up. The Fit
    checkbox is the one exception, kept at its own native size. */
export const barControlHeight = 'h-[26px]';

/** Segmented two-way toggle (Auto / Custom, Edit / Preview): a dark pill holding two buttons, the
    chosen one shown as activeBtn and the other as ghostBtn. items-stretch (not items-center) plus
    barToggleBtn's own h-full is what makes the buttons fill the full 26px track instead of sitting
    a few px shorter than it -- matching barControlHeight's other 26px controls (Add, Split, the
    gear/delete icons) exactly, rather than just matching the track around them. */
export const barToggleGroup =
  'flex items-stretch gap-0.5 bg-shade/40 px-0.5 h-[26px] rounded-md border border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)] shrink-0 text-[10px] font-semibold';

export const barToggleBtn = 'px-1.5 h-full flex items-center gap-1 rounded transition';
