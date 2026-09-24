import { test, expect } from '@playwright/test';
import { isDockZoneAllowed } from '../hooks/usePanelDockDrag';
import { FieldDefinition } from '../types/field';
import { createDefaultFlexLayout, isFlexLayoutConfig } from '../types/layout';

const mockFields: FieldDefinition[] = [
  { id: 101, template_id: 1, name: 'player_count', label: 'Player Count', field_type: 'text', is_required: true, display_order: 0, options: null },
  { id: 102, template_id: 1, name: 'play_time', label: 'Play Time (mins)', field_type: 'number', is_required: false, display_order: 1, options: null },
  { id: 103, template_id: 1, name: 'complexity', label: 'Weight / Complexity', field_type: 'select', is_required: false, display_order: 2, options: ['Light', 'Medium', 'Heavy'] },
];

test.describe('Template Layout Engine', () => {
  test('only current flex layouts are recognized; old grid layouts fall back to a default', () => {
    expect(isFlexLayoutConfig({ version: 1, sections: [] })).toBe(false);
    expect(isFlexLayoutConfig(null)).toBe(false);
    expect(isFlexLayoutConfig(createDefaultFlexLayout(mockFields))).toBe(true);
  });


  test('docking engine permits template_builder to dock to bottom panel and side panels', () => {
    // Docking to bottom is allowed for template_builder
    expect(isDockZoneAllowed('template_builder', 'bottom')).toBe(true);
    expect(isDockZoneAllowed('template_editor', 'bottom')).toBe(false);

    // Docking from bottom to sidebars is allowed
    expect(isDockZoneAllowed('bottom', 'left', { bottom: 'template_builder' })).toBe(true);
    expect(isDockZoneAllowed('bottom', 'right', { bottom: 'template_builder' })).toBe(true);
    expect(isDockZoneAllowed('bottom', 'left-tab', { bottom: 'template_builder', primaryTabs: ['items'] })).toBe(true);
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
    expect(isDockZoneAllowed('template_hierarchy', 'left-tab', { primaryTabs: ['items'] })).toBe(true);

    // template_hierarchy is a tree/sidebar panel, forbidden from bottom panel
    expect(isDockZoneAllowed('template_hierarchy', 'bottom')).toBe(false);
  });

  test('displays paper folder tabs in both Layout (left) and Content (right) panels during template editing', async ({ page }) => {
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

    // 1. Layout tab in left panel (icon-only, so check its aria-label rather than rendered text)
    const leftTab = page.locator('.primary-side-panel button[role="tab"]');
    await expect(leftTab).toHaveCount(1);
    await expect(leftTab.first()).toHaveAttribute('aria-label', 'Layout');

    const leftHeading = page.locator('.primary-side-panel .tree-section-heading h3');
    await expect(leftHeading).toContainText('Layout & Content');

    // 2. Only Content tab in right panel (Properties tab has been safely removed)
    const rightTabs = page.locator('.secondary-side-panel button[role="tab"]');
    await expect(rightTabs).toHaveCount(1);
    await expect(rightTabs.nth(0)).toHaveAttribute('aria-label', 'Content');
    await expect(rightTabs.nth(0)).toHaveAttribute('aria-selected', 'true');
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
    const sectionHeadings = primaryPanel.locator('.tree-section-heading');
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
    const leftTab = page.locator('.primary-side-panel .tree-folder-tab');
    await expect(leftTab).toBeVisible();
    await expect(leftTab.locator('svg path.tree-tab-svg-fill')).toHaveCount(1);
    await expect(leftTab).toContainText('Items');

    const rightTab = page.locator('.secondary-side-panel .tree-folder-tab');
    await expect(rightTab).toBeVisible();
    await expect(rightTab.locator('svg path.tree-tab-svg-fill')).toHaveCount(1);
    await expect(rightTab).toContainText('Collections');

    // Screenshot matching user media_1789920140123.png
    await page.screenshot({
      path: 'C:/Users/mc_cl/.gemini/antigravity/brain/31bae76a-fe56-4a8b-b91e-7d916ddebf78/side_panels_paper_folder_tabs_restored.png',
      fullPage: true,
    });
  });

  test('keyboard shortcuts: Ctrl+K targets left side search and Ctrl+L targets right side search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Dock Items to left panel
    const itemsNavBtn = page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true });
    await itemsNavBtn.click();
    await page.waitForTimeout(400);
    const dockLeftBtn = page.locator('button[aria-label="Dock Items to Left"]');
    await dockLeftBtn.click();
    await page.waitForTimeout(500);

    // 2. Dock Collections to right panel
    const collectionsNavBtn = page.getByRole('button', { name: 'Open Collections or drag to dock in a sidebar', exact: true });
    await collectionsNavBtn.click();
    await page.waitForTimeout(400);
    const dockRightBtn = page.locator('button[aria-label="Dock Collections to Right"]');
    await dockRightBtn.click();
    await page.waitForTimeout(500);

    // Verify left search has Ctrl-K shortcut
    const leftSearch = page.locator('.primary-side-panel [data-search-position="left"]');
    await expect(leftSearch).toBeVisible();
    await expect(leftSearch).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K');
    await expect(leftSearch).toHaveAttribute('title', /Ctrl-K/);

    // Verify right search has Ctrl-L shortcut
    const rightSearch = page.locator('.secondary-side-panel [data-search-position="right"]');
    await expect(rightSearch).toBeVisible();
    await expect(rightSearch).toHaveAttribute('aria-keyshortcuts', 'Control+L Meta+L');
    await expect(rightSearch).toHaveAttribute('title', /Ctrl-L/);

    // Press Ctrl+K -> Left search gets focused
    await page.keyboard.press('Control+k');
    await expect(leftSearch).toBeFocused();

    // Press Ctrl+L -> Right search gets focused
    await page.keyboard.press('Control+l');
    await expect(rightSearch).toBeFocused();

    // Now open template editor so right panel has Content search
    const templatesNav = page.locator('header button', { hasText: 'TEMPLATES' });
    await templatesNav.click();
    await page.waitForTimeout(500);

    const gearBtn = page.locator('[aria-label="Open actions"]').first();
    await gearBtn.click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'Edit Template' }).click();
    await page.waitForTimeout(1000);

    // In template editor: right panel has Content search with Ctrl-L
    const contentSearch = page.locator('.secondary-side-panel [data-search-position="right"]');
    await expect(contentSearch).toBeVisible();
    await expect(contentSearch).toHaveAttribute('aria-keyshortcuts', 'Control+L Meta+L');
    await expect(contentSearch).toHaveAttribute('title', /Ctrl-L/);

    // Press Ctrl+L -> Content search gets focused
    await page.keyboard.press('Control+l');
    await expect(contentSearch).toBeFocused();

    // Type a query in right search
    await page.keyboard.type('play_time');
    await expect(contentSearch).toHaveValue('play_time');
  });

  test('opens template editor from Items panel category gear -> Edit Item Template without error', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Dock Items to left panel
    const itemsNavBtn = page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true });
    await itemsNavBtn.click();
    await page.waitForTimeout(400);
    const dockLeftBtn = page.locator('button[aria-label="Dock Items to Left"]');
    await dockLeftBtn.click();
    await page.waitForTimeout(500);

    // 2. Locate Board Games category row in Items tree
    const categoryRow = page.locator('.primary-side-panel [title*="Board Games"]').first();
    await expect(categoryRow).toBeVisible();

    // 3. Hover and click gear on Board Games category
    const categoryGear = categoryRow.locator('[aria-label*="actions"]');
    await categoryGear.click();
    await page.waitForTimeout(400);

    // 4. Click "Edit Item Template"
    const editTemplateBtn = page.locator('[data-tree-menu] button', { hasText: 'Edit Item Template' });
    await expect(editTemplateBtn).toBeVisible();
    await editTemplateBtn.click();
    await page.waitForTimeout(1000);

    // 5. Verify Layout panel is loaded on the left (contains Body)
    const layoutPanel = page.locator('.primary-side-panel');
    await expect(layoutPanel).toContainText('LAYOUT');
    await expect(layoutPanel).toContainText('Body');

    // 6. Verify Content panel is loaded on the right (contains Board Games & Tabletop)
    const contentPanel = page.locator('.secondary-side-panel');
    await expect(contentPanel).toContainText('CONTENT');
    await expect(contentPanel).toContainText('Board Games & Tabletop');

    // 7. Verify the editor toolbar shows the template's name (the template-wide toolbar, footer slot)
    const editorToolbar = page.locator('#template-toolbar-slot-bottom');
    await expect(editorToolbar).toBeVisible();
    await expect(editorToolbar).toContainText('Board Games & Tabletop');

    // Take screenshot showing successfully loaded template editor from category gear
    await page.screenshot({
      path: 'C:/Users/mc_cl/.gemini/antigravity/brain/31bae76a-fe56-4a8b-b91e-7d916ddebf78/edit_template_from_category_gear_success.png',
      fullPage: true,
    });
  });
});


