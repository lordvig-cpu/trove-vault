'use client';

import React from 'react';
import { FieldDefinition } from '@/types/field';

/** Form values are stored as `unknown`; an input only ever shows a string or number. */
function toInputValue(value: unknown): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

interface FieldValueInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (fieldName: string, value: unknown) => void;
  /** Classes for the text / number / date / select controls (each layout styles its own). */
  inputClassName: string;
  /** Classes for the checkbox's "Yes / True" label. */
  checkboxLabelClassName?: string;
}

/** The input for one template field's value, chosen by its `field_type`: shared by the item modals
    (TemplateFieldInputs) and an item flyout's Properties tab, so both edit a field the same way. */
export default function FieldValueInput({ field, value, onChange, inputClassName, checkboxLabelClassName = '' }: FieldValueInputProps) {
  switch (field.field_type) {
    case 'number':
      return (
        <input
          type="number"
          required={field.is_required}
          value={toInputValue(value)}
          onChange={(event) => onChange(field.name, event.target.value === '' ? '' : Number(event.target.value))}
          className={inputClassName}
        />
      );
    case 'select':
      return (
        <select value={toInputValue(value)} onChange={(event) => onChange(field.name, event.target.value)} className={inputClassName}>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case 'boolean':
      return (
        <label className={`flex items-center gap-2 pt-1 text-xs cursor-pointer ${checkboxLabelClassName}`}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(field.name, event.target.checked)}
            className="rounded w-4 h-4"
          />
          <span>Yes / True</span>
        </label>
      );
    case 'date':
      return (
        <input
          type="date"
          required={field.is_required}
          value={toInputValue(value)}
          onChange={(event) => onChange(field.name, event.target.value)}
          className={inputClassName}
        />
      );
    default:
      return (
        <input
          type="text"
          required={field.is_required}
          value={toInputValue(value)}
          onChange={(event) => onChange(field.name, event.target.value)}
          className={inputClassName}
        />
      );
  }
}
