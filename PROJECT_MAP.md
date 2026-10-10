# Project file map

A quick-reference index of every source file and what it's responsible for. Grouped by directory,
alphabetical within each group. Update this when you add, remove, split or rename a file — it's
meant to stay accurate, not to be regenerated occasionally.

Conventions and architecture (data access, theming, template editor internals, backlog) live in
[CLAUDE.md](CLAUDE.md), not here. This file only says what each file *is*.

## app/

- `layout.tsx` — root HTML shell: fonts, theme class on `<html>`, global providers.
- `page.tsx` — the workspace's composition root. Wires together the docking, tree/search, template
  editor and hierarchy hooks and renders the header/sidebars/canvas/footer shell. Delegates the
  tree/template panel bodies to `hooks/usePanelRenderers.tsx`.
- `test_connection/page.tsx` — a diagnostic route that pings Supabase; unavailable in production.
- `globals.css` — Tailwind entry point; imports the theme and component CSS files below.
- `styles/themes/*.css` — the three runtime themes (Dark = EmberSteel in `theme-oklch-embersteel.css`, Light = Aquaglass Horizon in `theme-oklch-aquaglass.css`, and Sunset Tide = the original blue/orange), their shared OKLCH recipe,
  the semantic variable aliases components consume, and the Premium Contrast generator input.
  `styles/themes/OKLCH.md` explains how they relate and how to recolor; `styles/themes/README.md`
  is the `--primary-*`/`--secondary-*`/`--surface-*`/`--text-*` naming guide for new component CSS.
- `styles/Z_INDEX.md` — every `z-index` value used in the app, why it's set where it is, and the
  stacking-context contract (what can and can't escape a parent context). Keep it in sync with any
  new or changed `z-index`.
- `styles/components/*.css` — one stylesheet per component area (tree, panels, modals, nav,
  template editor), each imported from `globals.css`.

## components/ (top level)

- `BottomPanel.tsx` — the dockable bottom panel shell (open/pinned state, resize, tab drag-out).
- `CanvasViewControls.tsx` — zoom/preview-width controls for the template editor canvas.
- `CollectionFilterTree.tsx` — the collection checkbox tree inside the advanced-search filter menu.
- `ConnectionStatus.tsx` — the header's Supabase live/offline indicator.
- `ContainerResizeHandles.tsx` — drag handles for a selected Custom-sized layout container.
- `CreateCollectionModal.tsx` / `DeleteCollectionModal.tsx` — collection create/delete dialogs.
- `CreateItemModal.tsx` / `EditItemModal.tsx` / `DeleteItemModal.tsx` — item create/edit/delete
  dialogs; Create and Edit share `hooks/useItemForm.ts` and `components/item-form/*`.
- `CautionModal.tsx` — the shared "check before you go on" dialog (amber caution heading, Cancel + actions, Escape /
  backdrop cancel) under `LeaveTemplateEditorModal` and `DeleteContainerModal`.
- `DeleteContainerModal.tsx` — confirm deleting a layout container that holds anything, listing the containers and
  content inside it (`hooks/useConfirmRemoveContainer.ts`).
- `DeleteTemplateModal.tsx` — styled confirm dialog for deleting a template (used by both the tree
  and editor template menus).
- `LeaveTemplateEditorModal.tsx` — the Save / Discard / Keep Editing `CautionModal` shown when leaving the template editor
  with unsaved layout changes (`hooks/useLeaveTemplateEditorGuard.ts`).
- `DynamicWatermark.tsx` — the idle-state hero watermark/video on an empty main canvas.
- `EmptyPanelDropZone.tsx` — the "nothing docked here" placeholder shown in an empty panel/dock zone.
- `ItemDetailView.tsx` — the main canvas's read view for a selected item: drawn through its template's saved layout when
  it has one, else the original detail view.
- `MainContent.tsx` — chooses between ItemDetailView, the template editor stage, or the empty state.
- `ModalContainers.tsx` — mounts whichever modal `useModals()` says is active.
- `NavigationHeader.tsx` / `NavigationFooter.tsx` — the app's top bar and bottom status/dock bar.
- `OklchSeedControls.tsx` / `SeedColorPicker.tsx` — the footer's primary/secondary/background color pickers
  that override the three OKLCH seeds (saved per theme family).
- `ThemeSelector.tsx` — the footer's theme pulldown (Embersteel / Aquaglass / Sunset Tide) and the gear that shows the color pickers.
- `ThemeColorsBar.tsx` — the five theme color pickers as a bottom toolbar (portaled into `#theme-colors-slot`), shown by the theme gear.
- `PanelContentTransition.tsx` — keeps outgoing panel content mounted briefly during a tab switch.
- `PanelDockDropZones.tsx` — the drop-target overlays shown while dragging a panel/tab to dock it.
- `PrimarySidePanel.tsx` / `SecondarySidePanel.tsx` — the left/right dockable side panel shells
  (open/pinned/flyout state, resize, tab bar); both use `PrimarySidePanelHeader`.
- `PrimarySidePanelHeader.tsx` — composes a panel's header from `components/panel-header/*`
  (toolbar row, search/filter section, view tabs).
- `TemplateBodyDimensions.tsx` — Body-only sizing controls (Content Width: input, px/% pulldown,
  slider, Fill) in the Body flyout and the template properties inspector.
- `HoverHint.tsx` — the help bubble for an inline `?` icon or a button: action-menu-styled popup with a title bar, a Settings list and a Notes paragraph (portaled, opens on hover/focus).
- `icons/SectionIcons.tsx` — the large Size / Spacing / Layout / Appearance icons on a flyout section's header tile.
- `icons/HintIcons.tsx` — the how-to-use / tip / caution icons that lead each note in a help bubble.
- `icons/AlignIcons.tsx` — Align Items / Justify Content icons, drawn for a Row (rotated for a Column).
- `lib/measureContainer.ts` — measures a container's rendered width/height from the canvas DOM (what a split halves).
- `FloatingNodeMenuHost.tsx` — draws the floating node menu (`lib/floatingNodeMenu.ts`) in the template editor: a node's container /
  content flyout as a draggable, closable window when the Layout tree isn't showing.
- `HelpWindowHost.tsx` — renders the help windows (a `?` bubble popped out by its title bar's pop-out button: draggable, closable) once, from the root layout, so they outlive the flyout that opened them.
- `SubsectionHeading.tsx` — the centered "--- Title ---" heading (Primary Accent, optional `?` help bubble at the right) for a group of controls inside a flyout section (Width, Height, Background, Border...).
- `TemplateContentControls.tsx` — the property controls for a content element (what it shows and its display style, label, text style),
  used by its gear flyout; no layout/spacing/size (the container owns those).
- `TemplateAppearanceControls.tsx` — a container's or content element's Background, Border and Shadow controls (colors via the
  footer's `SeedColorPicker`, px-only sizes) in the flyout's Appearance section.
- `TemplateMinMaxSlider.tsx` — the two-thumb Min / Max slider for width or height (with number boxes and a shared px/%
  pulldown) in a container's Size section; styles in `styles/components/minMaxSlider.css`.
- `TemplateSpacingBox.tsx` — the box-model Spacing control (Margin around Padding, per-side inputs,
  slider + unit + link-sides for the selected side); styles in `styles/components/spacingBox.css`.
- `UnitSelect.tsx` — the px / % pulldown beside a length input (Padding, Content Width): a plain
  native `<select>`, white text on black (`unitSelect.css`).
- `TemplateContainerSizing.tsx` — Width/Height/Min/Max/Stack-below controls for a layout container.
- `TemplateEditorBar.tsx` — the chrome for the template-wide toolbar, portaled into the workspace
  footer slot (`#template-toolbar-slot-bottom`) above the bottom panel; its content is
  `TemplateEditorBarTop`.
- `TemplateEditorBarTop.tsx` — the template-wide toolbar's content: template icon + name (click either to
  change it), View toggle, Zoom, Width/Fit, Undo / Redo, Reset Layout and Save.
- `TemplateIconPicker.tsx` — the toolbar's template icon button and its pop-up: a grid of common icons plus
  an "any emoji" box (choices and the first-character rule in `lib/templateIcons.ts`).
- `TemplateEditorContainerBar.tsx` — the selected container's own toolbar (used more often, so it
  gets the header slot), portaled into `#template-toolbar-slot`: eye, name, Size, Layout, Add, Split,
  properties gear and delete.
- `TemplateEditorContentBar.tsx` — the selected content element's toolbar, in the same slot: eye, name, Shows,
  Display, Label, Text (style, bold/italic/underline, alignment), properties gear and delete.
- `editorBarControls.tsx` — controls shared by those two toolbars: grouped pulldowns, the in-place name,
  section labels, toggles, and the eye / gear / delete buttons.
- `VisibilityEyeIcon.tsx` — the show / hide eye (Layout tree and toolbars), which blinks when it changes state.
- `TemplateEditorStage.tsx` — the template editor's canvas: composes
  `components/template-canvas/*`; its header and mode toggle live in the toolbar.
- `TemplateFieldActionMenu.tsx` / `TemplateLayoutActionMenu.tsx` / `TemplateRootActionMenu.tsx` —
  the tree-gear popup menus for a field, a layout container/component, and the template root.
- `TemplateFieldInspector.tsx` — the template editor's field schema tree (Content tab).
- `TemplateHierarchyTree.tsx` — the template editor's container hierarchy tree (Layout tab), with drag-and-drop reordering and
  per-node show/hide eyes for the edit canvas.
- `TemplateLayoutPalette.tsx` — the Components palette: layout primitives (row, column, splits, card) and the
  pre-defined content cards (Field List, Header, Stat Row).
- `TemplatePresetPicker.tsx` — the step after choosing a pre-defined block: which built-ins and fields it includes
  (and a field list's row style), then add.
- `TemplateManagerModal.tsx` — browse/apply/create-custom template picker (from Collections menus).
- `TreeCollectionActionMenu.tsx` / `TreeItemActionMenu.tsx` / `TreeTemplateActionMenu.tsx` — the
  tree-gear popup menus for a collection (or category), item, and template row: Actions | Properties tabs
  (a category has Actions only).
- `TreeItemProperties.tsx` — an item flyout's Properties tab: name, Template, Photo, Fields and Custom Fields cards,
  saved with Save (`useItemEditor`).
- `TreeMenuProperties.tsx` — shared pieces of those Properties tabs: `PropertyField`, the Revert / Save `PropertiesSaveBar`,
  and `NameProperties` (a collection's or template's name).
- `TreeContent.tsx` — the shared tree view (Items/Collections/Templates), rendered per dock/flyout.
- `TreeGearButton.tsx` — a tree row's gear (idle / hovered open / pinned looks) for every tree: Items, Collections,
  Templates, Layout and Content.
- `TreeSearchMenu.tsx` — the advanced-search popup (positioning, portal, click-outside/Escape
  close) that `SearchAndFilterSection` renders its filter UI into; reuses TreeSubMenu.css's own
  split head/body shell markup (menuShellSplit/menuShellHead/menuShellBody/headerPill/menuTabs),
  with the tab band showing the filtered item-type count instead of tab buttons.
- `TreeSubMenu.tsx` — the shared popup menu shell (positioning, portal, styling) every
  `Tree*ActionMenu` and `Template*ActionMenu` renders into, always as a `splitBody` two-card menu
  styled from `TreeSubMenu.css`; `ActionMenuTabs` renders real tab buttons once there are two or
  more, or an empty divider band for just one, so the head card's own chrome never has to vary.
- `UnifiedTree.tsx` — the recursive tree-row renderer `TreeContent` builds on.
- `editorBarStyles.ts` — shared Tailwind class strings for the template editor toolbar's buttons.

## components/icons/

SVG icon components, grouped by area: `LayoutIcons.tsx` (template editor), `NavigationIcons.tsx`
(header/footer), `PanelIcons.tsx` (dock/pin/panel chrome), `TreeIcons.tsx` (tree rows and search), `GlyphIcons.tsx` (small chevron/arrow/check/tag/star/tab-stack/hourglass
glyph replacements), `ContentIcons.tsx` (field types, layout components, files/folders, and the
`FieldTypeIcon` / `ComponentTypeIcon` / `HierarchyCategoryIcon` lookups),
`TextIcons.tsx` (bold / italic / underline and text alignment, for the content toolbar). Import each from its own file (there is no barrel).

## components/item-form/

Shared pieces of the Create/Edit item modals, driven by `hooks/useItemForm.ts`:
`FieldValueInput.tsx` (one template field's input by type -- also used by an item flyout's Properties tab),
`AdHocAttributesEditor.tsx` (free-form key/value rows), `ItemImagePicker.tsx` (photo upload/preview),
`ItemModalShell.tsx` (keeps the error banner and buttons in view), `ItemTemplatePicker.tsx`
(template dropdown), `TemplateFieldInputs.tsx` (renders inputs for the chosen template's fields).

## components/panel-header/

`PrimarySidePanelHeader.tsx`'s three row sections: `PanelToolbarRow.tsx` (drag grip, title,
dock/move/pin/close), `SearchAndFilterSection.tsx` (search bar, applied-filter chips, the advanced
search/filter menu), `PanelViewTabs.tsx` (paper folder view tabs, add/expand-all actions).

## components/template-canvas/

`TemplateEditorStage.tsx`'s canvas pieces: `ScaledCanvas.tsx` (fits the Body to the available width,
applies zoom), `FlexContainerRenderer.tsx` (recursive container renderer: selection, drag-drop,
resize handles), `FlexComponentRenderer.tsx` (a single content component: bound content draws through
`ContentValue.tsx`, the old table/media/stat blocks stay placeholders), `ContentValue.tsx` (one bound value in
its display style, with label and typography).

## context/

- `CanvasZoomContext.tsx` — the template editor's preview-width/zoom state (editor-only, resets on close).
- `ContentDataContext.tsx` — the item (and its collections' names) content elements draw their values from; the
  template editor provides a sample item, the item view will provide the viewed one.
- `TreeActionsContext.tsx` — the tree-gear menus' CRUD callbacks (rename/delete/edit), provided once
  near the tree root instead of threaded through every row.
- `TreePanelContext.tsx` — whether the current tree is inside a flyout and whether it's pinned.
- `LayoutNavigationContext.tsx` — what a node flyout's Select Previous / Next need: the layout and how to go to a node (provided
  by the Layout tree and the floating node menu, each its own way).
- `TreeSelectionContext.tsx` — the current tree's selected item/collection id.
- `UIPreferencesContext.tsx` — persisted user prefs: pin state, theme, animations, audio (via
  `hooks/useLocalStorage.ts`).

## hooks/

- `useCollections.ts` — loads all collections/items/templates (`lib/data/workspace.ts`), builds the
  unified forest, and exposes rename/delete mutations.
- `useDismissOnOutsideOrEscape.ts` — calls a callback on outside-click or Escape while active.
- `useFlyoutLifecycle.ts` — a flyout/sidebar's mount-and-animate-out lifecycle.
- `useHierarchyState.ts` — the Layout tree's expansion state and open-properties/place-field/
  add-container handlers; takes `useTemplateEditor`'s return value as its argument.
- `useConfirmRemoveContainer.ts` — `requestRemoveContainer`, every container delete's entry point: an empty one goes at
  once, one that holds anything waits for `DeleteContainerModal`.
- `useItemForm.ts` — shared state/logic for the Create and Edit item modals.
- `useItemEditor.ts` — editing an existing item: `useItemForm` loaded with it, unsaved-change tracking, Save and Revert
  (the Edit Item modal and an item flyout's Properties tab).
- `useKeyboardShortcuts.ts` — registers a list of global key bindings.
- `useLeaveTemplateEditorGuard.ts` — `leaveEditorThen`: leaving the template editor for an item or another template
  closes it straight away, or with unsaved layout changes first asks (`LeaveTemplateEditorModal`) to Save or Discard them.
- `useLocalStorage.ts` — SSR-safe persisted state with cross-tab sync.
- `useModals.ts` — which modal (if any) is open and its payload.
- `usePanelDockDrag.ts` — the pointer-drag machinery for docking/reordering panel tabs; also
  exports the `DockContent`/`TabReorderInfo`/dock-content types used throughout the workspace.
- `usePanelRenderers.tsx` — the tree/template panel body renderers (`renderTreePanel`,
  `renderPanelBody`) and the header props they all need (`treeHeaderProps`); what `app/page.tsx`
  delegates to instead of holding this logic itself.
- `usePresence.ts` — delays a portaled element's unmount until its close animation finishes.
- `useReducedMotion.ts` — reads the OS "prefers reduced motion" setting.
- `useScreenWidth.ts` — reads the user's actual monitor width (SSR-safe; 0 until mount).
- `useResizableDimension.ts` — shared drag/keyboard resize logic used by the width/height hooks below.
- `useResizableHeight.ts` / `useResizablePanel.ts` — the bottom panel's height and a side panel's
  width resize behavior, built on `useResizableDimension`.
- `useLayoutHistory.ts` — the layout editor's in-memory, session-only undo/redo history (wraps `lib/layoutHistory.ts`).
- `useTemplateEditor.ts` — template editing: load/start/stop editing, metadata, field CRUD, and the
  localStorage + debounced remote layout save, and the layout the editor opened with (unsaved-change check, Save, Discard).
  Composes `useTemplateLayoutTree` for the layout tree
  and `useLayoutHistory` for undo/redo.
- `useTemplateLayoutTree.ts` — the flex layout tree's selection and CRUD (add/insert/split/update/
  remove container or component, place a field, reset to default).
- `useTreeActionMenu.ts` — a tree-gear popup's open/close/position state; broadcasts a window event
  so only one popup is open at a time.
- `useTreeCategories.ts` — a tree's category expand/collapse state and search query.
- `useTreePanels.ts` — the Items/Collections/Templates tree state: forests, search, category
  filters, per-panel expansion.
- `useWorkspaceDock.ts` — which content is docked where (primary/secondary/bottom), open/pinned
  state, panel widths/height, and the slide animation when content changes sides.

## lib/

- `canvasMeasure.ts` — converts a pointer position on the (possibly CSS-scaled) editor canvas back
  to real layout pixels.
- `color.ts` — default OKLCH seed colors, shared between the editor and the CSS.
- `data/collections.ts`, `data/items.ts`, `data/templates.ts`, `data/templateFields.ts` — all
  Supabase reads/writes for their table; components and hooks never import `supabase` directly.
- `data/mappers.ts` — converts Supabase rows to the app's own types (`toItemRecord`, `toFieldDefinition`, etc).
- `data/workspace.ts` — loads the whole workspace (all pages of every table) and the DB health check.
- `errors.ts` — `errorMessage()`: turns a thrown value into a user-facing string.
- `fetchAllPages.ts` — pages through a Supabase query until it's exhausted.
- `fieldTypeMetas.ts` — display metadata (label, icon) for each field type.
- `filterTreeForest.ts` — builds the dynamic template-category nodes merged into the unified forest,
  and the forest search/filter logic.
- `hierarchyFilterMetas.ts` — the Layout tree's three node categories (Layout/Content/Pre-defined
  Content) for its filter menu: display metadata and `hierarchyNodeCategory()`.
- `helpWindows.ts` — module-level store of the help windows (open/toggle, move, raise, close; at most 4) plus the `useHelpWindows` / `useIsHelpWindowOpen` hooks; rendered by `HelpWindowHost.tsx`.
- `layoutHistory.ts` — pure undo/redo snapshot logic for the layout (coalesces drag bursts, caps depth);
  covered by `tests/layout-history.spec.ts`.
- `layoutTree.ts` — pure functions over the flex layout tree (build/insert/split/update/remove/move node,
  label helpers); covered by `tests/layout-tree.spec.ts`.
- `layoutContent.ts` — pure functions for content elements: bindings, display styles per data type, resolving
  values from an item (or samples), labels, text presets, box-look CSS; covered by `tests/layout-content.spec.ts`.
- `layoutPresets.ts` — pure builders for pre-defined content (Field List, Header, Stat Row): a request in, an ordinary
  container subtree out; covered by `tests/layout-presets.spec.ts`.
- `layoutRecipes.ts` — pure whole-layout recipes (Classic, Spec Sheet, Gallery) built from the pre-defined blocks;
  covered by `tests/layout-recipes.spec.ts`.
- `layoutStorage.ts` — where a template's layout lives (localStorage key) and which copy wins when resolving it.
- `layoutNavigation.ts` — the layout in the Layout tree's order (`flattenLayout`), a node's previous / next (`layoutNeighbors`), and
  the name a node shows in the tree (`layoutNodeName`).
- `layoutTreeMenu.ts` — `openNodeMenu`: opens a node's gear flyout from outside the Layout tree (the toolbars' gear, a
  canvas right-click) -- out of its tree row when the Layout tree is showing, otherwise as the floating menu.
- `flyoutHold.ts` — keeps a header pulldown (Items / Collections / Templates) mounted, hidden, while a gear menu
  pinned in it floats after it closed or was docked.
- `floatingNodeMenu.ts` — the store for that floating menu (which node, where, which tab; open / move / close).
- `menuTabRequest.ts` — the event the toolbar gear sends so a Layout-tree flyout opens on its Properties tab.
- `panelTitles.ts` — `getPanelTitle()`: the header title for a panel's docked tab(s).
- `storage.ts` — item photo upload/remove/validate against Supabase Storage.
- `templateIcons.ts` — the template icon picker's quick choices and `firstGrapheme` (a typed icon keeps one character).
- `supabase.ts` — the typed Supabase client instance.
- `treeUtils.ts` — shared tree helpers (the standalone-collection sentinel id, search highlighting,
  item-matches-query).

## types/

Hand-written domain types: `collection.ts`, `field.ts`, `item.ts`, `template.ts`, `theme.ts`
(theme preset + legacy-preference normalization), `layout.ts` (the flex layout tree's node types and
direction/sizing helpers), `database.ts` (the Supabase-shaped `Database` type, hand-written from
`.supabase/schema.sql`; regenerate via the Supabase CLI once it's set up).

## tests/

Playwright specs, run against a production build on port 3100: `workspace.spec.ts` (docking,
preferences, keyboard shortcuts), `collections-panel.spec.ts`, `template-layout.spec.ts` (the
template editor), `template-drag-highlight.spec.ts`, `layout-tree.spec.ts` (the pure functions in
`lib/layoutTree.ts`), `layout-content.spec.ts` (content bindings, display styles, values, styles), `layout-presets.spec.ts` (pre-defined content builders), `layout-recipes.spec.ts` (simple-template recipes and saved-layout resolution), `layout-history.spec.ts` (undo/redo history), `stacking.spec.ts` (responsive row-to-column stacking), `floating-menu.spec.ts` (gear menus floating when the Layout tree is hidden), `data.spec.ts`, `item-images.spec.ts` (photo cleanup on item edit / delete, against a fake fetch), `pure-helpers.spec.ts` (colors, box / alignment / direction values, row mappers, tree categories and item search).

## Root & config

- `.supabase/schema.sql` — the database schema (tables, RLS policies, seed data) as hand-maintained SQL.
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `playwright.config.ts` — tool config.
- `scripts/generate-oklch-theme.mjs` — recalibrates `theme-oklch.css` from `theme-premium-contrast.css`.
- `CLAUDE.md` (imports `AGENTS.md`) — project conventions, the template editor's design notes, and
  the cleanup backlog. `AGENTS.md` is regenerated by `next dev`; don't hand-edit it.
- `README.md` — the standard project readme (setup/run instructions).
