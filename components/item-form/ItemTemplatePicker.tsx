'use client';

import React from 'react';
import type { ItemTemplate } from '@/types/template';
import { FileIcon } from '@/components/icons/ContentIcons';

interface ItemTemplatePickerProps {
  templates: ItemTemplate[];
  selectedTemplateId: number | null;
  onSelect: (value: string) => void;
  fieldCount: number;
  /** Caption after the field count, e.g. "Template Fields". */
  fieldCountLabel: string;
}

/** The "Item Schema Template" panel: the template dropdown and how many fields the template has. */
export default function ItemTemplatePicker({
  templates,
  selectedTemplateId,
  onSelect,
  fieldCount,
  fieldCountLabel,
}: ItemTemplatePickerProps) {
  return (
    <div className="item-modal-template-panel rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold item-modal-template-heading flex items-center gap-1.5">
          <FileIcon />
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
            {template.icon} {template.name}
          </option>
        ))}
        <option value="blank">Blank / Custom (No Template)</option>
      </select>
    </div>
  );
}
