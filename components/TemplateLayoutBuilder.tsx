'use client';

import React, { useState, useMemo } from 'react';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition } from '@/types/field';
import { TemplateLayoutConfig, LayoutSection, LayoutBlock, LayoutBlockType, LayoutVariant } from '@/types/layout';
import '@/app/styles/components/templateLayoutBuilder.css';

interface TemplateLayoutBuilderProps {
  template: ItemTemplate | null;
  layoutConfig: TemplateLayoutConfig | null;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onAddSection: (title?: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, partial: Partial<LayoutSection>) => void;
  onAddBlock: (sectionId: string, block: Omit<LayoutBlock, 'id'>) => void;
  onUpdateBlock: (sectionId: string, blockId: string, partial: Partial<LayoutBlock>) => void;
  onRemoveBlock: (sectionId: string, blockId: string) => void;
  onMoveBlock: (fromSectionId: string, toSectionId: string, blockId: string, toIndex?: number) => void;
  onResetLayout: () => void;
  position?: 'left' | 'right';
}

const BLOCK_PRESETS: {
  type: LayoutBlockType;
  label: string;
  icon: string;
  defaultColSpan: number;
  defaultRowSpan: number;
  defaultVariant: LayoutVariant;
  description: string;
}[] = [
  {
    type: 'table',
    label: 'Attribute Table',
    icon: '📊',
    defaultColSpan: 12,
    defaultRowSpan: 4,
    defaultVariant: 'table_row',
    description: 'Multi-row specifications table (4 grid rows)',
  },
  {
    type: 'media',
    label: 'Hero / Media Box',
    icon: '🖼️',
    defaultColSpan: 6,
    defaultRowSpan: 4,
    defaultVariant: 'hero',
    description: 'Featured image or artwork display',
  },
  {
    type: 'stat',
    label: 'Metric / Stat Card',
    icon: '📈',
    defaultColSpan: 4,
    defaultRowSpan: 1,
    defaultVariant: 'stat',
    description: 'Prominent key number or highlight',
  },
  {
    type: 'note',
    label: 'Notes & Description',
    icon: '📝',
    defaultColSpan: 12,
    defaultRowSpan: 2,
    defaultVariant: 'standard',
    description: 'Full-width rich text or overview',
  },
];

export default function TemplateLayoutBuilder({
  template,
  layoutConfig,
  selectedBlockId,
  onSelectBlock,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onResetLayout,
}: TemplateLayoutBuilderProps) {
  const [activeTab, setActiveTab] = useState<'palette' | 'tree' | 'block'>('palette');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const fields = useMemo(() => template?.fields || [], [template?.fields]);
  const sections = useMemo(() => layoutConfig?.sections || [], [layoutConfig?.sections]);

  // Find all field IDs currently placed in the layout
  const placedFieldIds = useMemo(() => {
    const ids = new Set<number>();
    for (const sec of sections) {
      for (const b of sec.blocks) {
        if (b.field_id) ids.add(b.field_id);
      }
    }
    return ids;
  }, [sections]);

  // Find currently selected block and its parent section
  const selectedInfo = useMemo(() => {
    if (!selectedBlockId) return null;
    for (const sec of sections) {
      const block = sec.blocks.find((b) => b.id === selectedBlockId);
      if (block) return { section: sec, block };
    }
    return null;
  }, [selectedBlockId, sections]);

  const handlePlaceField = (field: FieldDefinition, sectionId?: string) => {
    const targetSectionId = sectionId || sections[0]?.id;
    if (!targetSectionId) {
      onAddSection('General Information');
      return;
    }
    onAddBlock(targetSectionId, {
      type: 'field',
      field_id: field.id,
      label: field.label,
      col_span: 6,
      row_span: 1,
      variant: 'standard',
    });
  };

  const handlePlacePreset = (preset: typeof BLOCK_PRESETS[number], sectionId?: string) => {
    const targetSectionId = sectionId || sections[0]?.id;
    if (!targetSectionId) {
      onAddSection('General Information');
      return;
    }
    onAddBlock(targetSectionId, {
      type: preset.type,
      label: preset.label,
      col_span: preset.defaultColSpan,
      row_span: preset.defaultRowSpan,
      variant: preset.defaultVariant,
    });
  };

  const handleCreateSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newSectionTitle.trim()) {
      onAddSection(newSectionTitle.trim());
      setNewSectionTitle('');
    } else {
      onAddSection('New Section');
    }
  };

  if (!template) {
    return (
      <div className="p-6 text-center text-xs text-muted">
        No template selected for layout editing.
      </div>
    );
  }

  return (
    <div className="tmpl-layout-builder-container flex flex-col h-full w-full min-h-0 select-none">
      {/* --------------------------------------------------------------------
          1. BUILDER NAVIGATION SEGMENT
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/40 border-b border-subtle shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('palette')}
          className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'palette'
              ? 'bg-blue-500/20 text-white border border-blue-500/40'
              : 'text-muted hover:text-strong hover:bg-slate-800/60'
          }`}
        >
          <span>🎨</span>
          <span>Palette</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'tree'
              ? 'bg-blue-500/20 text-white border border-blue-500/40'
              : 'text-muted hover:text-strong hover:bg-slate-800/60'
          }`}
        >
          <span>📑</span>
          <span>Outline ({sections.length})</span>
        </button>

        {selectedInfo && (
          <button
            type="button"
            onClick={() => setActiveTab('block')}
            className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'block'
                ? 'bg-blue-500/20 text-white border border-blue-500/40'
                : 'text-muted hover:text-strong hover:bg-slate-800/60'
            }`}
          >
            <span>⚙️</span>
            <span>Block</span>
          </button>
        )}
      </div>

      {/* --------------------------------------------------------------------
          2. TAB CONTENT BODY
          -------------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto primary-panel-scroll p-2 flex flex-col gap-3">
        {/* PALETTE VIEW */}
        {activeTab === 'palette' && (
          <>
            {/* Quick Component Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Layout Blocks
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handlePlacePreset(preset)}
                    className="flex flex-col gap-1 p-2 rounded-lg bg-surface-secondary hover:bg-surface-primary-hover border border-subtle hover:border-blue-400/50 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-strong group-hover:text-white">
                      <span>{preset.icon}</span>
                      <span className="truncate">{preset.label}</span>
                    </div>
                    <span className="text-[10px] text-muted line-clamp-2">
                      {preset.description}
                    </span>
                    <span className="text-[9px] font-mono text-blue-400 mt-auto">
                      {preset.defaultColSpan}/12 cols • {preset.defaultRowSpan} rows
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Fields to Place */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Template Fields ({fields.length})
                </span>
                <span className="text-[10px] font-mono text-muted">
                  {placedFieldIds.size} placed
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {fields.map((field) => {
                  const isPlaced = placedFieldIds.has(field.id);
                  return (
                    <div
                      key={field.id}
                      className={`flex items-center justify-between p-1.5 rounded-lg border transition ${
                        isPlaced
                          ? 'bg-slate-900/30 border-subtle opacity-70'
                          : 'bg-surface-secondary border-subtle hover:border-blue-400/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs">
                          {field.field_type === 'number'
                            ? '🔢'
                            : field.field_type === 'select'
                            ? '📋'
                            : field.field_type === 'boolean'
                            ? '🔘'
                            : field.field_type === 'date'
                            ? '📅'
                            : '📝'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-strong truncate block">
                            {field.label}
                          </span>
                          <span className="text-[9.5px] font-mono text-muted truncate block">
                            {field.name}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlaceField(field)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition cursor-pointer shrink-0 ${
                          isPlaced
                            ? 'bg-slate-800 text-muted hover:text-white'
                            : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30'
                        }`}
                        title={isPlaced ? 'Add another instance to canvas' : 'Place on canvas'}
                      >
                        {isPlaced ? '+ Add again' : '+ Place'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Section Quick Bar */}
            <form onSubmit={handleCreateSection} className="flex gap-1 pt-2 border-t border-subtle">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="New section title..."
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-surface-panel border border-subtle rounded-md text-strong focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md border border-subtle cursor-pointer transition"
              >
                + Section
              </button>
            </form>
          </>
        )}

        {/* OUTLINE / TREE VIEW */}
        {activeTab === 'tree' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Sections & Blocks
              </span>
              <button
                type="button"
                onClick={onResetLayout}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
                title="Reset layout to default field grid"
              >
                Reset Default
              </button>
            </div>

            {sections.map((sec, secIdx) => (
              <div
                key={sec.id}
                className="flex flex-col gap-1 p-2 rounded-xl bg-surface-secondary border border-subtle"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs">📁</span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => onUpdateSection(sec.id, { title: e.target.value })}
                      className="text-xs font-bold text-strong bg-transparent border-b border-transparent hover:border-subtle focus:border-blue-400 focus:outline-none flex-1 truncate"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-muted">
                      {sec.blocks.length} blocks
                    </span>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove section "${sec.title}"?`)) {
                            onRemoveSection(sec.id);
                          }
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                        title="Delete Section"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Blocks inside Section */}
                <div className="flex flex-col gap-1 pl-3 border-l border-subtle mt-1">
                  {sec.blocks.length === 0 ? (
                    <span className="text-[10px] text-muted italic p-1">
                      No blocks in this section. Add from Palette.
                    </span>
                  ) : (
                    sec.blocks.map((b) => {
                      const isSelected = selectedBlockId === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            onSelectBlock(b.id);
                            setActiveTab('block');
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-500/20 border-blue-500 text-white font-semibold'
                              : 'bg-surface-panel border-subtle text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                            <span>
                              {b.type === 'media'
                                ? '🖼️'
                                : b.type === 'table'
                                ? '📊'
                                : b.type === 'stat'
                                ? '📈'
                                : '📝'}
                            </span>
                            <span className="truncate">{b.label || 'Block'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1 rounded">
                              {b.col_span}/12 • {b.row_span}r
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveBlock(sec.id, b.id);
                              }}
                              className="text-[10px] text-muted hover:text-red-400 p-0.5 cursor-pointer"
                              title="Remove Block"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SELECTED BLOCK INSPECTOR */}
        {activeTab === 'block' && selectedInfo && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-subtle">
              <span className="text-xs font-bold text-strong truncate">
                Block: {selectedInfo.block.label || selectedInfo.block.type}
              </span>
              <button
                type="button"
                onClick={() => onRemoveBlock(selectedInfo.section.id, selectedInfo.block.id)}
                className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
              >
                Remove
              </button>
            </div>

            {/* Custom Label Override */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Display Label
              </label>
              <input
                type="text"
                value={selectedInfo.block.label || ''}
                onChange={(e) =>
                  onUpdateBlock(selectedInfo.section.id, selectedInfo.block.id, {
                    label: e.target.value,
                  })
                }
                className="px-2 py-1 text-xs bg-surface-panel border border-subtle rounded-md text-strong focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Grid Width (Columns Span out of 12) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Column Width</span>
                <span className="font-mono text-blue-400">{selectedInfo.block.col_span} of 12</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { cols: 3, label: '1/4' },
                  { cols: 4, label: '1/3' },
                  { cols: 6, label: '1/2' },
                  { cols: 12, label: 'Full' },
                ].map((opt) => (
                  <button
                    key={opt.cols}
                    type="button"
                    onClick={() =>
                      onUpdateBlock(selectedInfo.section.id, selectedInfo.block.id, {
                        col_span: opt.cols,
                      })
                    }
                    className={`py-1 text-xs font-bold rounded-md border transition cursor-pointer ${
                      selectedInfo.block.col_span === opt.cols
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-surface-panel border-subtle text-muted hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Height (Vertical Row Span) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Vertical Grid Height</span>
                <span className="font-mono text-blue-400">{selectedInfo.block.row_span} spaces</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      onUpdateBlock(selectedInfo.section.id, selectedInfo.block.id, {
                        row_span: r,
                      })
                    }
                    className={`py-1 text-xs font-bold rounded-md border transition cursor-pointer ${
                      selectedInfo.block.row_span === r
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-surface-panel border-subtle text-muted hover:text-white'
                    }`}
                  >
                    {r}x {r === 4 ? 'Tall' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Variant Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Visual Style
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['standard', 'compact', 'stat', 'table_row', 'hero', 'callout'] as LayoutVariant[]).map(
                  (v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        onUpdateBlock(selectedInfo.section.id, selectedInfo.block.id, {
                          variant: v,
                        })
                      }
                      className={`py-1 px-2 text-[11px] rounded-md border transition cursor-pointer text-left truncate ${
                        selectedInfo.block.variant === v
                          ? 'bg-blue-500/20 text-white border-blue-500 font-bold'
                          : 'bg-surface-panel border-subtle text-muted hover:text-white'
                      }`}
                    >
                      {v === 'table_row'
                        ? 'Table Row'
                        : v === 'hero'
                        ? 'Hero Banner'
                        : v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
