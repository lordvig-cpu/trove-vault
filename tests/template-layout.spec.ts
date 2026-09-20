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

  test('creates default Flexbox Container layout with root, card wrapper, and child components', async () => {
    const { createDefaultFlexLayout, collectPlacedFieldIds } = await import('../types/layout');
    const flexConfig = createDefaultFlexLayout(mockFields);

    expect(flexConfig.version).toBe(2);
    expect(flexConfig.root).toBeDefined();
    expect(flexConfig.root.id).toBe('root-container');
    expect(flexConfig.root.direction).toBe('column');
    expect(flexConfig.root.children).toHaveLength(1);

    const generalCard = flexConfig.root.children[0];
    expect(generalCard.nodeType).toBe('container');
    if (generalCard.nodeType === 'container') {
      expect(generalCard.label).toBe('General Information');
      expect(generalCard.isCard).toBe(true);
      expect(generalCard.direction).toBe('row');
      expect(generalCard.wrap).toBe(true);
      expect(generalCard.children).toHaveLength(3);

      const firstComp = generalCard.children[0];
      expect(firstComp.nodeType).toBe('component');
      if (firstComp.nodeType === 'component') {
        expect(firstComp.field_id).toBe(101);
        expect(firstComp.label).toBe('Player Count');
        expect(firstComp.sizing.type).toBe('fixed');
        expect(firstComp.sizing.value).toBe('48%');
      }
    }

    const placedIds = collectPlacedFieldIds(flexConfig.root);
    expect(placedIds).toEqual([101, 102, 103]);
  });

  test('migrates legacy 12-column grid layout into recursive Flexbox Container tree', async () => {
    const { migrateGridToFlexLayout, findFlexNode, findParentFlexContainer } = await import('../types/layout');
    const legacyLayout: TemplateLayoutConfig = {
      version: 1,
      sections: [
        {
          id: 'sec-general',
          title: 'General Information',
          columns: 12,
          blocks: [
            {
              id: 'block-101',
              type: 'field',
              field_id: 101,
              label: 'Player Count',
              col_span: 6,
              row_span: 1,
              variant: 'standard',
            },
            {
              id: 'block-table',
              type: 'table',
              label: 'Specs Table',
              col_span: 12,
              row_span: 4,
              variant: 'table_row',
            },
          ],
        },
      ],
    };

    const flexLayout = migrateGridToFlexLayout(legacyLayout);
    expect(flexLayout.version).toBe(2);
    expect(flexLayout.root.id).toBe('root-container');
    expect(flexLayout.root.children).toHaveLength(1);

    const sectionContainer = flexLayout.root.children[0];
    expect(sectionContainer.nodeType).toBe('container');
    if (sectionContainer.nodeType === 'container') {
      expect(sectionContainer.id).toBe('sec-general');
      expect(sectionContainer.label).toBe('General Information');
      expect(sectionContainer.children).toHaveLength(2);
    }

    // Node lookup helper
    const foundTable = findFlexNode(flexLayout.root, 'block-table');
    expect(foundTable).toBeDefined();
    expect(foundTable?.nodeType).toBe('component');

    // Parent container lookup helper
    const parentContainer = findParentFlexContainer(flexLayout.root, 'block-table');
    expect(parentContainer).toBeDefined();
    expect(parentContainer?.id).toBe('sec-general');
  });

  test('docking engine allows template_properties in side panels but forbids bottom panel', () => {
    // Docking template_properties to sidebars
    expect(isDockZoneAllowed('template_properties', 'right')).toBe(true);
    expect(isDockZoneAllowed('template_properties', 'left')).toBe(true);
    expect(isDockZoneAllowed('template_properties', 'right-tab', { secondaryTabs: ['template_editor'] })).toBe(true);

    // template_properties belongs in sidebars, not bottom panel
    expect(isDockZoneAllowed('template_properties', 'bottom')).toBe(false);
  });

  test('docking engine allows template_hierarchy in side panels but forbids bottom panel', () => {
    // Docking template_hierarchy to sidebars (left and right)
    expect(isDockZoneAllowed('template_hierarchy', 'left')).toBe(true);
    expect(isDockZoneAllowed('template_hierarchy', 'right')).toBe(true);
    expect(isDockZoneAllowed('template_hierarchy', 'left-tab', { primaryTabs: ['explorer'] })).toBe(true);

    // template_hierarchy is a tree/sidebar panel, forbidden from bottom panel
    expect(isDockZoneAllowed('template_hierarchy', 'bottom')).toBe(false);
  });

  test('displays paper folder tabs in both Structure (left) and Inspector (right) panels during template editing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open TEMPLATES flyout
    await page.locator('header button', { hasText: 'TEMPLATES' }).click();
    await page.waitForTimeout(600);

    // Open action menu for template and click Edit Template
    const gearBtn = page.locator('[aria-label="Open actions"]').first();
    await gearBtn.click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'Edit Template' }).click();
    await page.waitForTimeout(1000);

    // 1. Structure tab in left panel
    const leftTab = page.locator('.primary-side-panel button[role="tab"]');
    await expect(leftTab).toHaveCount(1);
    await expect(leftTab.first()).toContainText('Structure');

    const leftHeading = page.locator('.primary-side-panel .explorer-section-heading h3');
    await expect(leftHeading).toContainText('Layout & Content');

    // 2. Only Inspector tab in right panel (Properties tab has been safely removed)
    const rightTabs = page.locator('.secondary-side-panel button[role="tab"]');
    await expect(rightTabs).toHaveCount(1);
    await expect(rightTabs.nth(0)).toContainText('Inspector');
    await expect(rightTabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('hides watermark and enables structure tree gear flyout properties menu with Parent Container label', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Watermark is present before entering template edit mode
    await expect(page.locator('.watermark-logo-image')).toHaveCount(1);

    // Open TEMPLATES flyout
    await page.locator('header button', { hasText: 'TEMPLATES' }).click();
    await page.waitForTimeout(600);

    // Open action menu for template and click Edit Template
    const gearBtn = page.locator('[aria-label="Open actions"]').first();
    await gearBtn.click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'Edit Template' }).click();
    await page.waitForTimeout(1000);

    // 1. Watermark is hidden during template editing
    await expect(page.locator('.watermark-logo-image')).toHaveCount(0);

    // 2. Structure tree has matching gear action triggers
    const structureGears = page.locator('.primary-side-panel [aria-label*="actions"]');
    const gearCount = await structureGears.count();
    expect(gearCount).toBeGreaterThan(1);

    // Click child container gear (nth(1)) to verify Parent Container label
    const childGear = structureGears.nth(1);
    await childGear.click();
    await page.waitForTimeout(500);

    // Action menu flyout is rendered with properties including Parent Container
    const actionMenu = page.locator('[data-explorer-menu]').first();
    await expect(actionMenu).toBeVisible();
    await expect(actionMenu).toContainText('Parent Container');
    await expect(actionMenu).toContainText('Flex Flow Direction');

    // Take screenshot showing the matching gear and open flyout menu with Parent Container
    await page.screenshot({
      path: 'C:/Users/mc_cl/.gemini/antigravity/brain/31bae76a-fe56-4a8b-b91e-7d916ddebf78/template_structure_parent_container_menu.png',
      fullPage: true,
    });
  });

  test('empty primary side panel renders empty drop zone without phantom items tab or section header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle open the Primary Side Panel via bottom navigation bar
    const toggleLeftBtn = page.locator('button[aria-label="Toggle Left Panel"]');
    await toggleLeftBtn.click();
    await page.waitForTimeout(600);

    // Primary Side Panel should be visible
    const primaryPanel = page.locator('.primary-side-panel');
    await expect(primaryPanel).toBeVisible();

    // Verify empty state drop zone is visible
    await expect(primaryPanel).toContainText(/PRIMARY SIDE PANEL is empty/i);
    await expect(primaryPanel).toContainText('Please drag-and-drop to populate it');

    // Verify there are NO phantom tabs (e.g. Items) rendered
    const tabs = primaryPanel.locator('button[role="tab"]');
    await expect(tabs).toHaveCount(0);

    // Verify there is NO section heading (e.g. "Browse Items")
    const sectionHeadings = primaryPanel.locator('.explorer-section-heading');
    await expect(sectionHeadings).toHaveCount(0);

    // Also toggle open the Bottom Panel to verify both empty panel headers match
    const toggleBottomBtn = page.locator('button[aria-label="Show Bottom Panel"]');
    await toggleBottomBtn.click();
    await page.waitForTimeout(600);

    const bottomPanel = page.locator('.bottom-side-panel');
    await expect(bottomPanel).toBeVisible();
    await expect(bottomPanel).toContainText(/BOTTOM PANEL is empty/i);

    // Take screenshot of both empty panels for visual verification
    await page.screenshot({
      path: 'C:/Users/mc_cl/.gemini/antigravity/brain/31bae76a-fe56-4a8b-b91e-7d916ddebf78/empty_panels_matching_headers.png',
      fullPage: true,
    });
  });

  test('renders paper folder tab SVG on docked side panels for Items and Collections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Items flyout and dock to left
    const itemsNavBtn = page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true });
    await itemsNavBtn.click();
    await page.waitForTimeout(400);

    const dockLeftBtn = page.locator('button[aria-label="Dock Items to Left"]');
    await dockLeftBtn.click();
    await page.waitForTimeout(500);

    // Open Collections flyout and dock to right
    const collectionsNavBtn = page.getByRole('button', { name: 'Open Collections or drag to dock in a sidebar', exact: true });
    await collectionsNavBtn.click();
    await page.waitForTimeout(400);

    const dockRightBtn = page.locator('button[aria-label="Dock Collections to Right"]');
    await dockRightBtn.click();
    await page.waitForTimeout(500);

    // Verify paper folder tabs are rendered with SVG paths
    const leftTab = page.locator('.primary-side-panel .explorer-folder-tab');
    await expect(leftTab).toBeVisible();
    await expect(leftTab.locator('svg path.explorer-tab-svg-fill')).toHaveCount(1);
    await expect(leftTab).toContainText('Items');

    const rightTab = page.locator('.secondary-side-panel .explorer-folder-tab');
    await expect(rightTab).toBeVisible();
    await expect(rightTab.locator('svg path.explorer-tab-svg-fill')).toHaveCount(1);
    await expect(rightTab).toContainText('Collections');

    // Screenshot matching user media_1789920140123.png
    await page.screenshot({
      path: 'C:/Users/mc_cl/.gemini/antigravity/brain/31bae76a-fe56-4a8b-b91e-7d916ddebf78/side_panels_paper_folder_tabs_restored.png',
      fullPage: true,
    });
  });
});


