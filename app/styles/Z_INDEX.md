# Z-index map

Every `z-index` value used across the app, so a new one can be placed correctly instead of guessed.
Stacking context determines how far a value actually reaches — see the contract at the bottom.

Verified against the live app (computed styles, DOM ancestry) on 2026-09-22: the documented tiers
below are accurate as of that check, including the tree-menu/panel overlap described in the
contract, which is intentional, not a bug.

## Top-level layers

Reach the whole app (or the workspace), except where a narrower scope is noted.

| z-index    | Element / state                       | Placement / scope                                  | Source                                       |
|------------|----------------------------------------|------------------------------------------------------|-----------------------------------------------|
| 400        | Modal backdrops                       | Shared `--z-modal`; overrides legacy utility classes | ItemModal.css; fieldManagerModal.css         |
| 300        | Seed color picker                     | Portal to `document.body`                            | SeedColorPicker.tsx; navigationFooter.css    |
| 150        | Dock drop-target overlay              | Fixed; rendered inside workspace                     | PanelDockDropZones.tsx / CSS                 |
| 100        | Logo introduction trigger             | Application shell                                    | DynamicWatermark.tsx                         |
| 80         | Header wrapper / navigation bar       | Contains local navigation and flyout layers          | page.tsx; NavigationHeader.tsx               |
| 70         | Tree menus while flyout is open       | Above backdrop (60), beneath flyout panel (80)       | globals.css; Tree*Menu.tsx                   |
| 60         | Footer wrapper / navigation footer    | Contains local footer layers                         | page.tsx; NavigationFooter.tsx               |
| 60         | Tree flyout backdrop                  | Body portal; begins below navigation                 | PrimarySidePanel.tsx                         |
| 55 / 54    | Moving / displaced panel content      | Workspace; transient swap animation                  | page.tsx                                     |
| 50 / 40    | Primary / secondary sidebar asides    | 50: open + unpinned; 40: pinned or closed             | PrimarySidePanel.tsx; SecondarySidePanel.tsx |
| 45 / 35    | Tree action / search menus            | Body portals; unpinned / pinned; under panel edge     | Both Tree*Menu.tsx components                |
| 36         | Bottom template editor toolbar slot   | Workspace; above the bottom panel it sits in front of | page.tsx; TemplateEditorBarBottom.tsx        |
| 35         | Bottom panel aside                    | Workspace; same value pinned or unpinned              | BottomPanel.css                              |
| 30         | Expand tabs / workspace header shadow | Workspace                                             | Panel CSS; navigationHeader.css              |
| 10         | Center canvas wrapper                 | Workspace; owns MainContent local layers              | page.tsx                                     |
| 0          | Watermark / intro video container     | Application shell; grid is root background            | DynamicWatermark.tsx; mainContent.css        |

## Nested / local layers

Local values cannot escape their parent stacking context.

| z-index    | Element / state                       | Placement / scope                                  | Source                                       |
|------------|----------------------------------------|------------------------------------------------------|-----------------------------------------------|
| 160        | Cursor-following drag badge           | LOCAL to the z=150 dock overlay                       | PanelDockDropZones.tsx / CSS                 |
| 85         | Top template editor toolbar slot      | LOCAL to header wrapper (thus above its 80)            | NavigationHeader.tsx; TemplateEditorBar.tsx  |
| 80         | Tree flyout aside                     | LOCAL to header / flyout containers                   | PrimarySidePanel.tsx                         |
| 60 / 50    | Active / inactive navigation tab      | LOCAL to the header; stable on hover                  | navigationHeader.css                         |
| 50         | Panel resize handles                  | LOCAL to their isolated panel                         | ContentPrimitives.css                        |
| 40         | Panel reset buttons                   | LOCAL to their isolated panel                         | Side-panel and BottomPanel components        |
| 40         | Hovered sticky tree category          | LOCAL to panel; scoped hover override                 | primarySidePanel.css                         |
| 30         | Panel bottom topper / canvas fades    | LOCAL to panel / canvas respectively                  | primarySidePanel.css; mainContent.css        |
| 20 - depth | Idle sticky tree category headers     | LOCAL to panel; hovered category uses 40              | UnifiedTree.tsx                              |
| 20         | MainContent wrapper                   | LOCAL to the z=10 center canvas wrapper                | MainContent.tsx                              |
| 20 / 10    | Selected / idle tree folder tabs      | LOCAL to panel header                                 | PrimarySidePanelHeader.tsx                   |
| 10 / 5 / 1 | Content / decoration / texture layers | LOCAL to header, footer or panel                       | Component CSS and TSX                        |
| -1         | Folder-tab decorative pseudo-element  | LOCAL to isolated tab                                  | primarySidePanel.css                         |

## Contract

- Tree and Collections menus use their owning panel's layer: 35 when pinned and 45 when unpinned,
  beneath sidebar layers 40 / 50 **so panel edges overlap the slide-out menus** — this is
  deliberate (a ~14px tuck at the seam where the menu meets the panel edge), not a mismatch to fix.
  Menus belonging to a flyout use 70: above its dismissal backdrop (60) for clicks, but beneath the
  flyout/header (80) for the same overlap.
- `--z-modal` (400) keeps all modal backdrops above menus, navigation, drag UI, and the seed picker
  (300). Shared unlayered CSS overrides old `z-50`/`z-[100]` utility classes; `ModalContainers` adds
  no portal or higher-z wrapper.
- Only `.tree-category-sticky-header:hover` forces a local z-index of 40. Navigation tabs, resize
  controls and unrelated `.group` elements keep their tiers.
- Header/footer/panel isolation, transforms, filters and opacity create nested contexts. Equal-z
  siblings use DOM paint order; portals participate at their DOM destination. Workspace opacity
  below 1 temporarily confines its drag UI.
- Browser and Next.js DevTools are outside this application's layer contract.

Reference: <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context>
