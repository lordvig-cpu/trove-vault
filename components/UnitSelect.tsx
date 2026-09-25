'use client';

import React from 'react';
import { ChevronDownIcon } from '@/components/icons/PanelIcons';
import { barControlHeight, idleBtn } from '@/components/editorBarStyles';

interface UnitSelectProps {
  value: 'px' | '%';
  onChange: (unit: 'px' | '%') => void;
  label: string;
}

/**
 * The px / % pulldown attached to the right of a length input (Padding, Content Width; the input
 * squares off its right corners, and the two share one edge). A native select, so its list
 * is never clipped by the flyout's scroll area; the closed control wears the top toolbar's
 * pulldown-button look (`idleBtn`: amber outline on a dark fill, white on hover).
 */
export default function UnitSelect({ value, onChange, label }: UnitSelectProps) {
  return (
    <div className="relative shrink-0 -ml-px">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'px' | '%')}
        aria-label={label}
        title={label}
        className={`appearance-none ${barControlHeight} pl-2 pr-5 rounded-r-lg rounded-l-none border text-xs font-semibold cursor-pointer transition focus:outline-none focus:border-white ${idleBtn}`}
      >
        <option value="px" className="bg-surface-secondary text-strong">px</option>
        <option value="%" className="bg-surface-secondary text-strong">%</option>
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[var(--secondary-accent)]" />
    </div>
  );
}
