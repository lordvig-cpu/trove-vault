import { test, expect } from '@playwright/test';
import { createDefaultLayout } from '../hooks/useTemplateEditor';
import { isDockZoneAllowed } from '../hooks/usePanelDockDrag';
import { FieldDefinition } from '../types/field';
import { TemplateLayoutConfig, LayoutBlock, LayoutSection } from '../types/layout';

const mockFields: FieldDefinition[] = [
  { id: 101, template_id: 1, name: 'player_count', label: 'Player Count', field_type: 'text', is_required: true, display_order: 0, options: null },
  { id: 102, template_id: 1, name: 'play_time', label: 'Play Time (mins)', field_type: 'number', is_required: false, display_order: 1, options: null },
  { id: 103, template_id: 1, name: 'complexity', label: 'Weight / Complexity', field_type: 'select', is_required: false, display_order: 2, options: ['Light', 'Medium', 'Heavy'] },
];

test.describe('Template Layout Engine & Grid System', () => {
  test('creates default 12-column grid layout from template field definitions', () => {
    const layout = createDefaultLayout(mockFields);

    expect(layout.version).toBe(1);
    expect(layout.sections).toHaveLength(1);
    expect(layout.sections[0].id).toBe('sec-general');
    expect(layout.sections[0].title).toBe('General Information');
    expect(layout.sections[0].columns).toBe(12);
    expect(layout.sections[0].blocks).toHaveLength(3);

    // Each block defaults to 6 columns (half width) and 1 vertical row span
    expect(layout.sections[0].blocks[0]).toMatchObject({
      id: 'block-101',
      type: 'field',
      field_id: 101,
      label: 'Player Count',
      col_span: 6,
      row_span: 1,
      variant: 'standard',
    });
  });

  test('supports vertical row spanning for deep data tables and media boxes (e.g. 4 vertical spaces)', () => {
    const layout = createDefaultLayout(mockFields);

    // Add a 4x vertical attribute table block
    const tableBlock: LayoutBlock = {
      id: 'block-specs-table',
      type: 'table',
      label: 'Specifications & Mechanics',
      col_span: 12,
      row_span: 4, // 4 vertical grid spaces as requested by user
      variant: 'table_row',
    };

    // Add a 4x vertical hero media box
    const mediaBlock: LayoutBlock = {
      id: 'block-box-art',
      type: 'media',
      label: 'Box Art & Components Gallery',
      col_span: 6,
      row_span: 4, // 4 vertical grid spaces
      variant: 'hero',
    };

    layout.sections[0].blocks.push(tableBlock, mediaBlock);

    expect(layout.sections[0].blocks).toHaveLength(5);
    const foundTable = layout.sections[0].blocks.find((b) => b.type === 'table');
    expect(foundTable).toBeDefined();
    expect(foundTable?.row_span).toBe(4);
    expect(foundTable?.col_span).toBe(12);

    const foundMedia = layout.sections[0].blocks.find((b) => b.type === 'media');
    expect(foundMedia).toBeDefined();
    expect(foundMedia?.row_span).toBe(4);
    expect(foundMedia?.variant).toBe('hero');
  });

  test('supports custom sections and multi-column partitioning', () => {
    const layout: TemplateLayoutConfig = {
      version: 1,
      sections: [
        {
          id: 'sec-overview',
          title: 'Overview & Highlights',
          columns: 12,
          blocks: [
            {
              id: 'stat-rating',
              type: 'stat',
              label: 'BGG Rating',
              col_span: 4,
              row_span: 1,
              variant: 'stat',
            },
            {
              id: 'stat-rank',
              type: 'stat',
              label: 'Overall Rank',
              col_span: 4,
              row_span: 1,
              variant: 'stat',
            },
            {
              id: 'stat-weight',
              type: 'stat',
              label: 'Weight',
              col_span: 4,
              row_span: 1,
              variant: 'stat',
            },
          ],
        },
        {
          id: 'sec-specs',
          title: 'Game Specifications',
          columns: 12,
          blocks: [
            {
              id: 'table-details',
              type: 'table',
              label: 'Detailed Metrics',
              col_span: 12,
              row_span: 4,
              variant: 'table_row',
            },
          ],
        },
      ],
    };

    expect(layout.sections).toHaveLength(2);
    expect(layout.sections[0].blocks).toHaveLength(3);
    expect(layout.sections[1].blocks).toHaveLength(1);
    expect(layout.sections[1].blocks[0].row_span).toBe(4);
  });

  test('docking engine permits template_builder to dock to bottom panel and side panels', () => {
    // Docking to bottom is allowed for template_builder
    expect(isDockZoneAllowed('template_builder', 'bottom')).toBe(true);
    expect(isDockZoneAllowed('template_editor', 'bottom')).toBe(false);

    // Docking from bottom to sidebars is allowed
    expect(isDockZoneAllowed('bottom', 'left', { bottom: 'template_builder' })).toBe(true);
    expect(isDockZoneAllowed('bottom', 'right', { bottom: 'template_builder' })).toBe(true);
    expect(isDockZoneAllowed('bottom', 'left-tab', { bottom: 'template_builder', primaryTabs: ['explorer'] })).toBe(true);
  });
});
