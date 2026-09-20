'use client';

import React, { useState } from 'react';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition } from '@/types/field';
import {
  TemplateLayoutConfig,
  LayoutSection,
  LayoutBlock,
  LayoutBlockType,
  LayoutVariant,
} from '@/types/layout';

interface TemplateEditorStageProps {
  template: ItemTemplate;
  layoutConfig: TemplateLayoutConfig | null;
  selectedBlockId: string | null;
  selectedFieldId: number | null;
  canvasMode: 'edit' | 'preview';
  onSelectBlock: (blockId: string | null) => void;
  onSelectField: (fieldId: number | null) => void;
  onDoneEditing: () => void;
  onAddField: () => void;
  onAddSection: (title?: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, partial: Partial<LayoutSection>) => void;
  onAddBlock: (sectionId: string, block: Omit<LayoutBlock, 'id'>) => void;
  onUpdateBlock: (sectionId: string, blockId: string, partial: Partial<LayoutBlock>) => void;
  onRemoveBlock: (sectionId: string, blockId: string) => void;
  onMoveBlock: (fromSectionId: string, toSectionId: string, blockId: string, toIndex?: number) => void;
  onResetLayout: () => void;
  onToggleCanvasMode: () => void;
}

export default function TemplateEditorStage({
  template,
  layoutConfig,
  selectedBlockId,
  selectedFieldId,
  canvasMode,
  onSelectBlock,
  onSelectField,
  onDoneEditing,
  onAddField,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onResetLayout,
  onToggleCanvasMode,
}: TemplateEditorStageProps) {
  const fields = template.fields || [];
  const sections = layoutConfig?.sections || [];

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Helper to find field definition for a block
  const getFieldForBlock = (block: LayoutBlock): FieldDefinition | undefined => {
    if (!block.field_id) return undefined;
    return fields.find((f) => f.id === block.field_id);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-6 select-none">
      {/* --------------------------------------------------------------------
          1. BLUEPRINT HEADER BANNER & CANVAS TOOLBAR
          -------------------------------------------------------------------- */}
      <div className="tmpl-editor-stage-banner flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl shadow-md shrink-0">
            {template.icon || '📦'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide truncate">
                {template.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                12-Col Grid Builder
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {template.description || 'Custom visual layout schema'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canvas Mode Toggle: Edit vs Preview */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'edit') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'edit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>✏️</span>
              <span>Builder Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'preview') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>👁️</span>
              <span>Live Item Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onDoneEditing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition hover:scale-[1.02] cursor-pointer"
            title="Exit template editor and restore previous tab workspace"
          >
            <span>✓</span>
            <span>Done Editing</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. VISUAL CANVAS STAGE (12-Column Grid Layout)
          -------------------------------------------------------------------- */}
      {sections.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <span className="text-4xl">📐</span>
          <span className="text-sm font-bold text-slate-300">No Layout Sections Created</span>
          <p className="text-xs text-slate-500 max-w-sm">
            Generate a starter layout based on template fields or add custom sections to begin visual design.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onResetLayout}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer"
            >
              Auto-Generate Layout
            </button>
            <button
              type="button"
              onClick={() => onAddSection('General Information')}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-subtle transition cursor-pointer"
            >
              + Add First Section
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((sec, secIdx) => (
            <div
              key={sec.id}
              className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm"
            >
              {/* Section Header Row */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm select-none">📁</span>
                  {editingSectionId === sec.id && canvasMode === 'edit' ? (
                    <input
                      type="text"
                      autoFocus
                      defaultValue={sec.title}
                      onBlur={(e) => {
                        onUpdateSection(sec.id, { title: e.target.value.trim() || sec.title });
                        setEditingSectionId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateSection(sec.id, {
                            title: (e.target as HTMLInputElement).value.trim() || sec.title,
                          });
                          setEditingSectionId(null);
                        }
                      }}
                      className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-blue-400 focus:outline-none"
                    />
                  ) : (
                    <h2
                      onClick={() => canvasMode === 'edit' && setEditingSectionId(sec.id)}
                      className={`text-xs font-bold text-slate-200 uppercase tracking-wider truncate ${
                        canvasMode === 'edit' ? 'cursor-pointer hover:text-blue-300' : ''
                      }`}
                      title={canvasMode === 'edit' ? 'Click to rename section' : undefined}
                    >
                      {sec.title}
                    </h2>
                  )}

                  <span className="text-[10px] font-mono text-muted bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {sec.blocks.length} blocks
                  </span>
                </div>

                {/* Section Controls (Edit Mode Only) */}
                {canvasMode === 'edit' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onAddBlock(sec.id, {
                          type: 'table',
                          label: 'Specifications Table',
                          col_span: 12,
                          row_span: 4,
                          variant: 'table_row',
                        })
                      }
                      className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-subtle transition cursor-pointer flex items-center gap-1"
                      title="Add 4-row specifications table"
                    >
                      <span>📊</span>
                      <span>+ Table (4x)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAddBlock(sec.id, {
                          type: 'media',
                          label: 'Hero Artwork',
                          col_span: 6,
                          row_span: 4,
                          variant: 'hero',
                        })
                      }
                      className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-subtle transition cursor-pointer flex items-center gap-1"
                      title="Add 4-row hero media box"
                    >
                      <span>🖼️</span>
                      <span>+ Media Box (4x)</span>
                    </button>

                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete section "${sec.title}" and its blocks?`)) {
                            onRemoveSection(sec.id);
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer transition ml-1"
                        title="Delete Section"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 12-Column Responsive Grid Canvas for Blocks */}
              {sec.blocks.length === 0 ? (
                <div className="py-8 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-xs text-muted italic">
                    This section is empty. Place template fields or layout components from the Builder tab.
                  </span>
                  {canvasMode === 'edit' && (
                    <button
                      type="button"
                      onClick={() =>
                        onAddBlock(sec.id, {
                          type: 'field',
                          label: fields[0]?.label || 'Field Attribute',
                          field_id: fields[0]?.id,
                          col_span: 6,
                          row_span: 1,
                          variant: 'standard',
                        })
                      }
                      className="px-3 py-1 text-[11px] font-semibold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md cursor-pointer transition"
                    >
                      + Add Block
                    </button>
                  )}
                </div>
              ) : (
                <div className="tmpl-grid-canvas">
                  {sec.blocks.map((block) => {
                    const isBlockSelected = selectedBlockId === block.id;
                    const boundField = getFieldForBlock(block);
                    const blockLabel = block.label || boundField?.label || block.type;

                    // Inline Grid Positioning Styles
                    const blockStyle: React.CSSProperties = {
                      gridColumn: `span ${block.col_span}`,
                      gridRow: `span ${block.row_span}`,
                    };

                    return (
                      <div
                        key={block.id}
                        style={blockStyle}
                        onClick={() => {
                          onSelectBlock(block.id);
                          if (boundField) onSelectField(boundField.id);
                        }}
                        className={`tmpl-grid-block tmpl-block-variant-${block.variant} ${
                          isBlockSelected ? 'tmpl-grid-block-selected' : ''
                        } ${canvasMode === 'edit' ? 'cursor-pointer' : ''}`}
                      >
                        {/* Hover Quick Controls for Resizing & Deleting (Edit Mode) */}
                        {canvasMode === 'edit' && (
                          <div className="tmpl-block-controls">
                            {/* Width Spans */}
                            <span className="text-[9px] text-muted font-mono mr-0.5">W:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { col_span: 3 });
                              }}
                              className={`tmpl-btn-pill ${block.col_span === 3 ? 'tmpl-btn-pill-active' : ''}`}
                              title="1/4 Width (3 cols)"
                            >
                              1/4
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { col_span: 4 });
                              }}
                              className={`tmpl-btn-pill ${block.col_span === 4 ? 'tmpl-btn-pill-active' : ''}`}
                              title="1/3 Width (4 cols)"
                            >
                              1/3
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { col_span: 6 });
                              }}
                              className={`tmpl-btn-pill ${block.col_span === 6 ? 'tmpl-btn-pill-active' : ''}`}
                              title="Half Width (6 cols)"
                            >
                              1/2
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { col_span: 12 });
                              }}
                              className={`tmpl-btn-pill ${block.col_span === 12 ? 'tmpl-btn-pill-active' : ''}`}
                              title="Full Width (12 cols)"
                            >
                              Full
                            </button>

                            {/* Height Spans (Row Span) */}
                            <span className="text-[9px] text-muted font-mono ml-1 mr-0.5">H:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { row_span: 1 });
                              }}
                              className={`tmpl-btn-pill ${block.row_span === 1 ? 'tmpl-btn-pill-active' : ''}`}
                              title="1 Space Height"
                            >
                              1x
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { row_span: 2 });
                              }}
                              className={`tmpl-btn-pill ${block.row_span === 2 ? 'tmpl-btn-pill-active' : ''}`}
                              title="2 Spaces Height"
                            >
                              2x
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock(sec.id, block.id, { row_span: 4 });
                              }}
                              className={`tmpl-btn-pill ${block.row_span === 4 ? 'tmpl-btn-pill-active' : ''}`}
                              title="4 Spaces Height (Table / Hero)"
                            >
                              4x
                            </button>

                            {/* Delete Block */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveBlock(sec.id, block.id);
                              }}
                              className="text-[11px] text-red-400 hover:text-red-200 ml-1 p-0.5 cursor-pointer leading-none"
                              title="Remove Block"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Block Content Renderers by Type */}
                        {block.type === 'table' ? (
                          /* Table Format Block (e.g. 4 spaces vertically) */
                          <div className="flex flex-col h-full w-full justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
                                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  <span>📊</span>
                                  <span>{blockLabel}</span>
                                </span>
                                <span className="text-[9.5px] font-mono text-blue-400">
                                  Table Grid ({block.row_span} rows)
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                                <div className="flex justify-between py-1 border-b border-slate-800">
                                  <span className="text-muted font-medium">Complexity Rating:</span>
                                  <span className="font-semibold text-slate-200">Medium (3.2 / 5.0)</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800">
                                  <span className="text-muted font-medium">Suggested Age:</span>
                                  <span className="font-semibold text-slate-200">14+ Years</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800">
                                  <span className="text-muted font-medium">Playing Time:</span>
                                  <span className="font-semibold text-slate-200">45 - 90 Minutes</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-muted font-medium">Edition:</span>
                                  <span className="font-semibold text-slate-200">1st Collector Edition</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-muted self-end">
                              Span: {block.col_span} cols × {block.row_span} rows
                            </span>
                          </div>
                        ) : block.type === 'media' ? (
                          /* Hero / Media Box Block (e.g. 4 spaces vertically) */
                          <div className="flex flex-col h-full w-full justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <span>🖼️</span>
                                <span>{blockLabel}</span>
                              </span>
                              <span className="text-[9.5px] font-mono text-amber-400">
                                Media Gallery
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
                              <span className="text-3xl opacity-60">📷</span>
                              <span className="text-xs text-muted mt-1">High-Res Artwork Preview</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted border-t border-slate-800/80 pt-1.5">
                              <span>Aspect: 16:9 Banner</span>
                              <span className="font-mono">{block.row_span} vertical spaces</span>
                            </div>
                          </div>
                        ) : block.type === 'stat' ? (
                          /* Metric / Stat Highlight Block */
                          <div className="flex flex-col items-center justify-center h-full gap-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                              {blockLabel}
                            </span>
                            <span className="text-2xl font-extrabold text-blue-400 font-mono tracking-tight">
                              98.5%
                            </span>
                            <span className="text-[9.5px] text-emerald-400 font-medium">
                              ★ High Condition Rank
                            </span>
                          </div>
                        ) : (
                          /* Standard Field Attribute Block */
                          <div className="flex flex-col justify-between h-full min-w-0">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-xs font-bold text-slate-200 truncate block">
                                  {blockLabel}
                                </span>
                                {boundField && (
                                  <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.5 rounded bg-slate-800/80 text-blue-400 border border-slate-700/60 shrink-0">
                                    {boundField.field_type}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-muted truncate block">
                                {boundField?.name || 'custom_attribute'}
                              </span>
                            </div>

                            <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 italic">
                                {boundField?.field_type === 'select'
                                  ? `${boundField.options?.length || 0} Options`
                                  : boundField?.is_required
                                  ? 'Required Field *'
                                  : 'Sample Value'}
                              </span>
                              <span className="font-mono text-muted text-[9px]">
                                {block.col_span}/12
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Quick Add Section Button (Bottom of Canvas) */}
          {canvasMode === 'edit' && (
            <button
              type="button"
              onClick={() => onAddSection('Additional Section')}
              className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>Add Another Layout Section</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
