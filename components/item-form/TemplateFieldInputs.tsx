'use client';

import React from 'react';
import { FieldDefinition } from '@/types/field';

interface TemplateFieldInputsProps {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
}

function toInputValue(value: unknown): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

export default function TemplateFieldInputs({
  fields,
  values,
  onChange,
}: TemplateFieldInputsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-3 pt-2 item-modal-property-divider">
      <span className="text-xs font-bold item-modal-template-heading uppercase tracking-wider block">
        Template Properties
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-[11px] font-semibold item-modal-label">
              {field.label} {field.is_required && <span className="item-modal-danger-text">*</span>}
            </label>

            {field.field_type === 'text' && (
              <input
                type="text"
                required={field.is_required}
                value={toInputValue(values[field.name])}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
              />
            )}

            {field.field_type === 'number' && (
              <input
                type="number"
                required={field.is_required}
                value={toInputValue(values[field.name])}
                onChange={(event) =>
                  onChange(
                    field.name,
                    event.target.value === '' ? '' : Number(event.target.value)
                  )
                }
                className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
              />
            )}

            {field.field_type === 'select' && (
              <select
                value={toInputValue(values[field.name])}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
              >
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.field_type === 'boolean' && (
              <label className="flex items-center gap-2 pt-1 text-xs item-modal-label cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(event) => onChange(field.name, event.target.checked)}
                  className="rounded w-4 h-4"
                />
                <span>Yes / True</span>
              </label>
            )}

            {field.field_type === 'date' && (
              <input
                type="date"
                required={field.is_required}
                value={toInputValue(values[field.name])}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
