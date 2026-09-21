'use client';

import React from 'react';
import type { CollectionTemplate } from '@/types/template';

interface ItemTemplatePickerProps {
  templates: CollectionTemplate[];
  selectedTemplateId: number | null;
  onSelect: (value: string) => void;
  fieldCount: number;
  /** Caption after the field count, e.g. "Template Fields". */
  fieldCountLabel: string;
  filled: string[];
  empty: string[];
  /** Captions for the two field lists, e.g. FILLED / AVAILABLE. */
  filledLabel: string;
  emptyLabel: string;
}

/** The "Item Schema Template" panel: template dropdown plus which of its fields are filled. */
export default function ItemTemplatePicker({
  templates,
  selectedTemplateId,
  onSelect,
  fieldCount,
  fieldCountLabel,
  filled,
  empty,
  filledLabel,
  emptyLabel,
}: ItemTemplatePickerProps) {
  return (
    <div className="item-modal-template-panel rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold item-modal-template-heading flex items-center gap-1.5">
          <span>📑</span>
          <span>Item Schema Template</span>
        </label>
        <span className="text-[10px] item-modal-template-count font-mono">
          {fieldCount} {fieldCountLabel}
        </span>
      </div>

      <select
        value={selectedTemplateId || 'blank'}
        onChange={(event) => onSelect(event.target.value)}
        className="w-full item-modal-input rounded-lg px-2.5 py-1.5 text-xs"
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.icon} {template.name} ({template.fields?.length || 0} fields)
          </option>
        ))}
        <option value="blank">➕ Blank / Custom (No Template)</option>
      </select>

      {fieldCount > 0 && (
        <div className="pt-1 text-[11px] space-y-1 item-modal-muted">
          {filled.length > 0 && (
            <div className="flex items-center gap-1.5 item-modal-template-heading">
              <span className="font-mono text-[10px] px-1 py-0.2 rounded">
                🔵 {filledLabel} ({filled.length})
              </span>
              <span className="truncate">{filled.join(', ')}</span>
            </div>
          )}
          {empty.length > 0 && (
            <div className="flex items-center gap-1.5 item-modal-template-heading">
              <span className="font-mono text-[10px] px-1 py-0.2 rounded">
                🟢 {emptyLabel} ({empty.length})
              </span>
              <span className="truncate">{empty.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
