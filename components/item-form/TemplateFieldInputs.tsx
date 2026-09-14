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
    <div className="space-y-3 pt-2 border-t border-slate-800">
      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
        Template Properties
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              {field.label} {field.is_required && <span className="text-rose-400">*</span>}
            </label>

            {field.field_type === 'text' && (
              <input
                type="text"
                required={field.is_required}
                value={toInputValue(values[field.name])}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            )}

            {field.field_type === 'select' && (
              <select
                value={toInputValue(values[field.name])}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.field_type === 'boolean' && (
              <label className="flex items-center gap-2 pt-1 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(event) => onChange(field.name, event.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
