'use client';

import React from 'react';

export interface AdHocAttribute {
  key: string;
  value: string;
}

interface AdHocAttributesEditorProps {
  attributes: AdHocAttribute[];
  onAdd: () => void;
  onChange: (index: number, field: 'key' | 'value', value: string) => void;
  onRemove: (index: number) => void;
  placeholders?: { key: string; value: string };
}

export default function AdHocAttributesEditor({
  attributes,
  onAdd,
  onChange,
  onRemove,
  placeholders = { key: 'Key', value: 'Value' },
}: AdHocAttributesEditorProps) {
  return (
    <div className="space-y-2 pt-2 item-modal-property-divider">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold item-modal-muted">Additional Custom Fields</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] font-medium item-modal-template-heading cursor-pointer"
        >
          + Add Custom Field
        </button>
      </div>

      <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
        {attributes.map((attribute, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder={placeholders.key}
              value={attribute.key}
              onChange={(event) => onChange(index, 'key', event.target.value)}
              className="flex-1 item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder={placeholders.value}
              value={attribute.value}
              onChange={(event) => onChange(index, 'value', event.target.value)}
              className="flex-1 item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="item-modal-muted text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
