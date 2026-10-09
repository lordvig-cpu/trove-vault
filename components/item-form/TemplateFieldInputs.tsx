'use client';

import React from 'react';
import { FieldDefinition } from '@/types/field';
import FieldValueInput from '@/components/item-form/FieldValueInput';

interface TemplateFieldInputsProps {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
}

/** One input per field of the item's template, chosen by `field_type`. Renders nothing for a
    template with no fields. Values are keyed by field name. */
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

            <FieldValueInput
              field={field}
              value={values[field.name]}
              onChange={onChange}
              inputClassName="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
              checkboxLabelClassName="item-modal-label"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
