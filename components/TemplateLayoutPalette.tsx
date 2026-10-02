'use client';

import React, { useState } from 'react';
import type { FlexContainerNode } from '@/types/layout';
import type { FieldDefinition } from '@/types/field';
import { PRESET_INFO, type PresetKind, type PresetRequest } from '@/lib/layoutPresets';
import { RECIPES, type RecipeId } from '@/lib/layoutRecipes';
import TemplatePresetPicker from '@/components/TemplatePresetPicker';
import { BodyIcon, FlexRowIcon, FlexColumnIcon } from '@/components/icons/LayoutIcons';
import { ResetIcon } from '@/components/icons/GlyphIcons';
import { ChartIcon, ImageIcon, ListIcon, PuzzleIcon, CardsIcon, RowsLayoutIcon, ColumnsLayoutIcon } from '@/components/icons/ContentIcons';

/** The "Components" bottom-panel palette: click a layout primitive (row, column, columns, card) to add it
    to `selectedContainer`, or pick a pre-defined content block (Field List, Header, Stat Row), choose what
    it includes, and add it. A pre-defined block is built from ordinary containers and content, so once
    added it is edited like anything else. The Reset button restores the template's default layout. */
interface TemplateLayoutPaletteProps {
  selectedContainer: FlexContainerNode | null;
  /** The template's fields, offered when choosing what a pre-defined block includes. */
  fields: FieldDefinition[];
  onAddContainer: (preset: 'row' | 'column' | '2-col' | '3-col' | 'card') => void;
  onPlacePreset: (request: PresetRequest) => void;
  /** Replaces the whole layout with a simple-template recipe (Undo restores the old one). */
  onApplyRecipe: (id: RecipeId) => void;
  onResetLayout: () => void;
}

interface LayoutPrimitive {
  id: 'row' | 'column' | '2-col' | '3-col' | 'card';
  label: string;
  icon: React.ReactNode;
  description: string;
}

const LAYOUT_PRIMITIVES: LayoutPrimitive[] = [
  {
    id: 'row',
    label: 'Row Container',
    icon: <FlexRowIcon className="w-5 h-5 text-[var(--primary-accent)]" />,
    description: 'Horizontal flow; items sit side-by-side',
  },
  {
    id: 'column',
    label: 'Column Container',
    icon: <FlexColumnIcon className="w-5 h-5 text-[var(--primary-accent)]" />,
    description: 'Vertical flow; items stack top-to-bottom',
  },
  {
    id: '2-col',
    label: '2-Column Split',
    icon: <ColumnsLayoutIcon className="w-5 h-5 text-[var(--primary-accent)]" />,
    description: 'Two equal 50/50 flexible columns',
  },
  {
    id: '3-col',
    label: '3-Column Split',
    icon: <RowsLayoutIcon className="w-5 h-5 text-[var(--primary-accent)]" />,
    description: 'Three equal 33% flexible columns',
  },
  {
    id: 'card',
    label: 'Card Wrapper',
    icon: <CardsIcon className="w-5 h-5 text-[var(--primary-accent)]" />,
    description: 'Bordered card frame with surface background',
  },
];

/** The pre-defined content cards, in display order. */
const PRESET_CARDS: { kind: PresetKind; icon: React.ReactNode }[] = [
  { kind: 'fieldList', icon: <ListIcon className="w-5 h-5 text-[var(--primary-accent)]" /> },
  { kind: 'header', icon: <ImageIcon className="w-5 h-5 text-[var(--primary-accent)]" /> },
  { kind: 'statRow', icon: <ChartIcon className="w-5 h-5 text-[var(--primary-accent)]" /> },
];

export default function TemplateLayoutPalette({
  selectedContainer,
  fields,
  onAddContainer,
  onPlacePreset,
  onApplyRecipe,
  onResetLayout,
}: TemplateLayoutPaletteProps) {
  const [activeTab, setActiveTab] = useState<'layout' | 'components' | 'recipes'>('layout');
  // The pre-defined block being set up (its field picker is showing), if any.
  const [pendingPreset, setPendingPreset] = useState<PresetKind | null>(null);

  const targetName = selectedContainer?.label || 'Root Page';

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* --------------------------------------------------------------------
          1. PALETTE TABS HEADER
          -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/40 border-b border-subtle shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'layout'
                ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-[var(--text-strong)] border border-[var(--primary-accent)] shadow-sm'
                : 'text-muted hover:text-strong hover:bg-slate-800/60'
            }`}
          >
            <BodyIcon className="w-3.5 h-3.5" />
            <span>Layout (Flexbox)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'components'
                ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-[var(--text-strong)] border border-[var(--primary-accent)] shadow-sm'
                : 'text-muted hover:text-strong hover:bg-slate-800/60'
            }`}
          >
            <PuzzleIcon className="w-3.5 h-3.5" />
            <span>Pre-defined Components</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recipes')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recipes'
                ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-[var(--text-strong)] border border-[var(--primary-accent)] shadow-sm'
                : 'text-muted hover:text-strong hover:bg-slate-800/60'
            }`}
          >
            <CardsIcon className="w-3.5 h-3.5" />
            <span>Simple Templates</span>
          </button>
        </div>

        {/* Target Destination & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span>Inserting into:</span>
            <span className="font-semibold text-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] px-2 py-0.5 rounded border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] max-w-[160px] truncate">
              {targetName}
            </span>
          </div>

          <button
            type="button"
            onClick={onResetLayout}
            className="text-[10px] font-semibold text-muted hover:text-rose-300 transition cursor-pointer"
            title="Reset layout to default flex structure"
          >
            <ResetIcon className="inline w-3 h-3 align-text-bottom" /> Reset Layout
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. TAB CONTENT DECK (HORIZONTAL SCROLL / GRID)
          -------------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden primary-panel-scroll p-3 flex items-center">
        {/* LAYOUT PRIMITIVES TAB */}
        {activeTab === 'layout' && (
          <div className="flex items-center gap-2.5 h-full w-full">
            {LAYOUT_PRIMITIVES.map((prim) => (
              <button
                key={prim.id}
                type="button"
                onClick={() => onAddContainer(prim.id)}
                className="flex flex-col justify-between p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-primary-hover border border-subtle hover:border-[var(--primary-accent)] transition cursor-pointer text-left h-[100px] min-w-[170px] max-w-[200px] shrink-0 group shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] group-hover:scale-105 transition-transform shrink-0">
                    {prim.icon}
                  </span>
                  <span className="text-xs font-bold text-strong group-hover:text-[var(--text-strong)] truncate">
                    {prim.label}
                  </span>
                </div>
                <span className="text-[10px] text-muted line-clamp-2 leading-relaxed">
                  {prim.description}
                </span>
                <span className="text-[9.5px] font-semibold text-[var(--primary-accent)] group-hover:underline">
                  + Add to {targetName}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* PRE-DEFINED COMPONENTS TAB */}
        {activeTab === 'components' &&
          (pendingPreset ? (
            <TemplatePresetPicker
              key={pendingPreset}
              kind={pendingPreset}
              fields={fields}
              targetName={targetName}
              onAdd={(request) => {
                onPlacePreset(request);
                setPendingPreset(null);
              }}
              onCancel={() => setPendingPreset(null)}
            />
          ) : (
            <div className="flex items-center gap-2.5 h-full w-full">
              {PRESET_CARDS.map(({ kind, icon }) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setPendingPreset(kind)}
                  className="flex flex-col justify-between p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-primary-hover border border-subtle hover:border-[var(--primary-accent)] transition cursor-pointer text-left h-[100px] min-w-[170px] max-w-[200px] shrink-0 group shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] group-hover:scale-105 transition-transform shrink-0">
                      {icon}
                    </span>
                    <span className="text-xs font-bold text-strong group-hover:text-[var(--text-strong)] truncate">
                      {PRESET_INFO[kind].label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted line-clamp-2 leading-relaxed">
                    {PRESET_INFO[kind].description}
                  </span>
                  <span className="text-[9.5px] font-semibold text-[var(--primary-accent)] group-hover:underline">
                    Choose what it includes...
                  </span>
                </button>
              ))}
            </div>
          ))}

        {/* SIMPLE TEMPLATES TAB: a whole layout in one click */}
        {activeTab === 'recipes' && (
          <div className="flex items-center gap-2.5 h-full w-full">
            {RECIPES.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onApplyRecipe(recipe.id)}
                className="flex flex-col justify-between p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-primary-hover border border-subtle hover:border-[var(--primary-accent)] transition cursor-pointer text-left h-[100px] min-w-[190px] max-w-[220px] shrink-0 group shadow-sm"
              >
                <span className="text-xs font-bold text-strong group-hover:text-[var(--text-strong)] truncate">
                  {recipe.label}
                </span>
                <span className="text-[10px] text-muted line-clamp-2 leading-relaxed">{recipe.description}</span>
                <span className="text-[9.5px] font-semibold text-[var(--primary-accent)] group-hover:underline">
                  Use for this template
                </span>
              </button>
            ))}
            <span className="text-[10px] text-muted max-w-[200px] leading-relaxed shrink-0">
              Replaces the whole layout with one built from this template&apos;s fields. Undo brings the old one back.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

