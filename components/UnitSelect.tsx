'use client';

import React from 'react';
import { ChevronDownIcon } from '@/components/icons/PanelIcons';
import { barControlHeight } from '@/components/editorBarStyles';
import '@/app/styles/components/unitSelect.css';

interface UnitSelectProps {
  value: 'px' | '%';
  onChange: (unit: 'px' | '%') => void;
  label: string;
  /** Sits flush against a length input to its left (default), or stands alone with its own corners. */
  attached?: boolean;
  /** Shown but not changeable (a field that only takes pixels). */
  disabled?: boolean;
}

/**
 * The px / % pulldown attached to the right of a length input (Padding, Content Width; the input
 * squares off its right corners, and the two share one edge). A plain native <select>, white text on
 * black, with the browser's own option list. (An earlier custom, portaled dropdown was replaced by
 * this: the native list is simpler and the black-and-white look doesn't need theming.)
 */
export default function UnitSelect({ value, onChange, label, attached = true, disabled = false }: UnitSelectProps) {
  return (
    <div className={`relative shrink-0 ${attached ? '-ml-px' : ''}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'px' | '%')}
        aria-label={label}
        title={label}
        disabled={disabled}
        className={`unitSelect block ${barControlHeight} pl-2 pr-5 ${
          attached ? 'rounded-r-lg rounded-l-none' : 'rounded-md'
        } border text-xs font-semibold cursor-pointer transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none`}
      >
        <option value="px">px</option>
        <option value="%">%</option>
      </select>
      <ChevronDownIcon className="unitSelectChevron pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5" />
    </div>
  );
}
