import React from 'react';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';
import HoverHint, { type HintContent } from '@/components/HoverHint';

/**
 * A centered "--- Title ---" heading for a group of controls inside a flyout section (Width, Height,
 * Background, Border...). It is the same heading as the help bubbles' Settings / Notes and the
 * panels' "Search and Filter" (Primary Accent text and rules); the optional `?` help bubble sits at
 * the far right of the row.
 */
export default function SubsectionHeading({ label, hint }: { label: string; hint?: HintContent }) {
  return (
    <div className="properties-section-heading menuSubheading">
      <hr aria-hidden="true" />
      <h3>{label}</h3>
      {hint && (
        <HoverHint hint={hint}>
          <HelpCircleIcon className="w-3 h-3 text-[var(--secondary-tree-menu-header-title)]" />
        </HoverHint>
      )}
    </div>
  );
}
