/* Shared class strings for the template editor bar: orange base, blue for hover / selected.
   Written out in full (no interpolation) so Tailwind can detect every class. */

/** Idle control: amber outline and text on the orange bar; white on hover. */
export const idleBtn =
  'bg-black/40 border-[var(--secondary-accent)] text-[var(--secondary-accent)] hover:border-white hover:text-white hover:bg-white/10';

/** Selected / open control: light-blue fill, blue outline, light-blue text and a soft glow. */
export const activeBtn =
  'bg-[color-mix(in_oklch,var(--primary-accent)_34%,transparent)] border-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)] text-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)] shadow-[0_0_8px_color-mix(in_oklch,var(--primary-accent)_60%,transparent)]';

/** Borderless menu row / icon button (zoom, sub-panel options). */
export const ghostBtn =
  'border border-transparent text-[var(--secondary-accent)] hover:border-white hover:text-white hover:bg-white/10';

export const disabledBtn = 'opacity-35 cursor-not-allowed';
