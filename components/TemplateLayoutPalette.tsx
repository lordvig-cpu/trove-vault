'use client';

import React, { useState } from 'react';
import {
  FlexContainerNode,
  FlexComponentNode,
  LayoutBlockType,
  LayoutVariant,
} from '@/types/layout';
import { BodyIcon, FlexRowIcon, FlexColumnIcon } from '@/components/icons/LayoutIcons';

interface TemplateLayoutPaletteProps {
  selectedContainer: FlexContainerNode | null;
  onAddContainer: (preset: 'row' | 'column' | '2-col' | '3-col' | 'card') => void;
  onAddComponent: (component: Omit<FlexComponentNode, 'id' | 'nodeType'>) => void;
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
    icon: <span className="text-base">▥</span>,
    description: 'Two equal 50/50 flexible columns',
  },
  {
    id: '3-col',
    label: '3-Column Split',
    icon: <span className="text-base">▤</span>,
    description: 'Three equal 33% flexible columns',
  },
  {
    id: 'card',
    label: 'Card Wrapper',
    icon: <span className="text-base">🗂️</span>,
    description: 'Bordered card frame with surface background',
  },
];

interface ComponentCategory {
  category: string;
  items: {
    type: LayoutBlockType;
    label: string;
    icon: string;
    variant: LayoutVariant;
    sizingType: 'fill' | 'fixed' | 'auto';
    sizingValue?: string;
    description: string;
  }[];
}

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    category: 'Data Display',
    items: [
      {
        type: 'table',
        label: 'Attribute Table',
        icon: '📊',
        variant: 'table_row',
        sizingType: 'fill',
        description: 'Multi-row specifications table',
      },
      {
        type: 'field',
        label: 'Field Card',
        icon: '📝',
        variant: 'standard',
        sizingType: 'fill',
        description: 'Standard card displaying field label & value',
      },
    ],
  },
  {
    category: 'Media & Visuals',
    items: [
      {
        type: 'media',
        label: 'Hero Media Box',
        icon: '🖼️',
        variant: 'hero',
        sizingType: 'fixed',
        sizingValue: '320px',
        description: 'Featured artwork or photo box',
      },
    ],
  },
  {
    category: 'Highlights & Metrics',
    items: [
      {
        type: 'stat',
        label: 'Metric / Stat Card',
        icon: '📈',
        variant: 'stat',
        sizingType: 'fill',
        description: 'Large highlighted score or number',
      },
    ],
  },
  {
    category: 'Notes & Text',
    items: [
      {
        type: 'note',
        label: 'Notes & Description',
        icon: '📋',
        variant: 'standard',
        sizingType: 'fill',
        description: 'Full-width rich text or overview',
      },
    ],
  },
];

export default function TemplateLayoutPalette({
  selectedContainer,
  onAddContainer,
  onAddComponent,
  onResetLayout,
}: TemplateLayoutPaletteProps) {
  const [activeTab, setActiveTab] = useState<'layout' | 'components'>('layout');

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
                ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border border-[var(--primary-accent)] shadow-sm'
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
                ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border border-[var(--primary-accent)] shadow-sm'
                : 'text-muted hover:text-strong hover:bg-slate-800/60'
            }`}
          >
            <span>🧩</span>
            <span>Pre-defined Components</span>
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
            ↺ Reset Layout
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
                  <span className="text-xs font-bold text-strong group-hover:text-white truncate">
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
        {activeTab === 'components' && (
          <div className="flex items-center gap-4 h-full">
            {COMPONENT_CATEGORIES.map((cat, idx) => (
              <div key={cat.category} className="flex items-center gap-2.5 shrink-0 h-full">
                {idx > 0 && <div className="w-[1px] h-3/4 bg-slate-800 shrink-0" />}
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-[9.5px] font-bold text-muted uppercase tracking-wider">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {cat.items.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          onAddComponent({
                            componentType: item.type,
                            label: item.label,
                            variant: item.variant,
                            sizing: {
                              type: item.sizingType,
                              value: item.sizingValue,
                            },
                          })
                        }
                        className="flex flex-col justify-between p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-primary-hover border border-subtle hover:border-[var(--primary-accent)] transition cursor-pointer text-left h-[90px] min-w-[150px] max-w-[170px] shrink-0 group shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span className="text-xs font-bold text-strong group-hover:text-white truncate">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-muted truncate">
                          {item.description}
                        </span>
                        <span className="text-[9px] font-semibold text-[var(--primary-accent)] group-hover:underline">
                          + Add Component
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

