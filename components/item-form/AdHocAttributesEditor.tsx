'use client';

import React from 'react';
import { CloseIcon } from '@/components/icons/PanelIcons';

export interface AdHocAttribute {
  key: string;
  value: string;
  /** The value as stored, for a row loaded from the item: saved back as is while `value` still shows it
      unchanged, so a stored number or yes/no doesn't turn into text just by being shown here. */
  original?: unknown;
}

interface AdHocAttributesEditorProps {
  attributes: AdHocAttribute[];
  onAdd: () => void;
  onChange: (index: number, field: 'key' | 'value', value: string) => void;
  onRemove: (index: number) => void;
  placeholders?: { key: string; value: string };
}

interface AdHocAttributeRowsProps {
  attributes: AdHocAttribute[];
  onChange: (index: number, field: 'key' | 'value', value: string) => void;
  onRemove: (index: number) => void;
  placeholders?: { key: string; value: string };
  rowClassName: string;
  inputClassName: string;
  removeClassName: string;
  removeIconClassName?: string;
}

/** The key / value rows themselves, each with a remove button: shared by the item modals (below) and an item
    flyout's Custom Fields card (TreeItemProperties), which differ only in how they are styled. */
export function AdHocAttributeRows({
  attributes,
  onChange,
  onRemove,
  placeholders = { key: 'Key', value: 'Value' },
  rowClassName,
  inputClassName,
  removeClassName,
  removeIconClassName,
}: AdHocAttributeRowsProps) {
  return (
    <>
      {attributes.map((attribute, index) => (
        <div key={index} className={rowClassName}>
          <input
            type="text"
            placeholder={placeholders.key}
            aria-label="Custom field name"
            value={attribute.key}
            onChange={(event) => onChange(index, 'key', event.target.value)}
            className={inputClassName}
          />
          <input
            type="text"
            placeholder={placeholders.value}
            aria-label="Custom field value"
            value={attribute.value}
            onChange={(event) => onChange(index, 'value', event.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label="Remove custom field"
            title="Remove"
            className={removeClassName}
          >
            <CloseIcon className={removeIconClassName} />
          </button>
        </div>
      ))}
    </>
  );
}

/** Editable list of free-form key/value attributes an item carries beyond its template's fields.
    Fully controlled: the parent (useItemForm) owns the list. */
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
        <AdHocAttributeRows
          attributes={attributes}
          onChange={onChange}
          onRemove={onRemove}
          placeholders={placeholders}
          rowClassName="flex gap-2 items-center"
          inputClassName="flex-1 item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
          removeClassName="item-modal-muted text-xs px-1 cursor-pointer"
        />
      </div>
    </div>
  );
}
