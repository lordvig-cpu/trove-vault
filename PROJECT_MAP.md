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
- `styles/themes/*.css` — the two runtime themes (OKLCH dark/light), their shared OKLCH recipe,
  the semantic variable aliases components consume, and the Premium Contrast generator input.
  `styles/themes/OKLCH.md` explains how they relate and how to recolor; `styles/themes/README.md`
  is the `--primary-*`/`--secondary-*`/`--surface-*`/`--text-*` naming guide for new component CSS.
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
- `DeleteTemplateModal.tsx` — styled confirm dialog for deleting a template (used by both the tree
  and editor template menus).
- `DynamicWatermark.tsx` — the idle-state hero watermark/video on an empty main canvas.
- `EmptyPanelDropZone.tsx` — the "nothing docked here" placeholder shown in an empty panel/dock zone.
- `ItemDetailView.tsx` — the main canvas's read view for a selected item.
- `MainContent.tsx` — chooses between ItemDetailView, the template editor stage, or the empty state.
- `ModalContainers.tsx` — mounts whichever modal `useModals()` says is active.
- `NavigationHeader.tsx` / `NavigationFooter.tsx` — the app's top bar and bottom status/dock bar.
- `OklchSeedControls.tsx` / `SeedColorPicker.tsx` — the footer's primary/secondary color pickers
  that override the two OKLCH seeds.
- `PanelContentTransition.tsx` — keeps outgoing panel content mounted briefly during a tab switch.
- `PanelDockDropZones.tsx` — the drop-target overlays shown while dragging a panel/tab to dock it.
- `PrimarySidePanel.tsx` / `SecondarySidePanel.tsx` — the left/right dockable side panel shells
  (open/pinned/flyout state, resize, tab bar); both use `PrimarySidePanelHeader`.
- `PrimarySidePanelHeader.tsx` — composes a panel's header from `components/panel-header/*`
  (toolbar row, search/filter section, view tabs).
- `TemplateBodyDimensions.tsx` — Body-only sizing controls (max content width) in the template
  properties inspector.
- `TemplateContainerSizing.tsx` — Width/Height/Min/Max/Stack-below controls for a layout container.
- `TemplateEditorBar.tsx` — the editor toolbar portaled into the header (`#template-toolbar-slot`).
- `TemplateEditorStage.tsx` — the template editor's canvas: composes
  `components/template-canvas/*` around the Blueprint header banner and mode toggle.
- `TemplateFieldActionMenu.tsx` / `TemplateLayoutActionMenu.tsx` / `TemplateRootActionMenu.tsx` —
  the tree-gear popup menus for a field, a layout container/component, and the template root.
- `TemplateFieldInspector.tsx` — the template editor's field schema tree (right panel).
- `TemplateHierarchyTree.tsx` — the template editor's layout structure tree (Structure panel).
- `TemplateLayoutPalette.tsx` — the "Add container / Add component" palette (Builder panel).
- `TemplateManagerModal.tsx` — browse/apply/create-custom template picker (from Collections menus).
- `TemplatePropertiesInspector.tsx` — the selected layout node's property editor (Properties panel).
- `TreeActionMenu.tsx` — the shared popup menu shell (positioning, portal, styling) every
  `Tree*ActionMenu` and `Template*ActionMenu` renders into.
- `TreeCollectionActionMenu.tsx` / `TreeItemActionMenu.tsx` / `TreeTemplateActionMenu.tsx` — the
  tree-gear popup menus for a collection, item, and template row.
- `TreeContent.tsx` — the shared tree view (Items/Collections/Templates), rendered per dock/flyout.
- `TreeSearchMenu.tsx` — the advanced-search popup shell (positioning, portal) that
  `SearchAndFilterSection` renders its filter UI into.
- `UnifiedTree.tsx` — the recursive tree-row renderer `TreeContent` builds on.
- `editorBarStyles.ts` — shared Tailwind class strings for the template editor toolbar's buttons.

## components/icons/

SVG icon components, grouped by area: `LayoutIcons.tsx` (template editor), `NavigationIcons.tsx`
(header/footer), `PanelIcons.tsx` (dock/pin/panel chrome), `TreeIcons.tsx` (tree rows and search).
`index.ts` re-exports all four as one barrel.

## components/item-form/

Shared pieces of the Create/Edit item modals, driven by `hooks/useItemForm.ts`:
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
resize handles), `FlexComponentRenderer.tsx` (a single field/table/media/stat/note component).

## context/

- `CanvasZoomContext.tsx` — the template editor's preview-width/zoom state (editor-only, resets on close).
- `TreeActionsContext.tsx` — the tree-gear menus' CRUD callbacks (rename/delete/edit), provided once
  near the tree root instead of threaded through every row.
- `TreePanelContext.tsx` — whether the current tree is inside a flyout and whether it's pinned.
- `TreeSelectionContext.tsx` — the current tree's selected item/collection id.
- `UIPreferencesContext.tsx` — persisted user prefs: pin state, theme, animations, audio (via
  `hooks/useLocalStorage.ts`).

## hooks/

- `useCollections.ts` — loads all collections/items/templates (`lib/data/workspace.ts`), builds the
  unified forest, and exposes rename/delete mutations.
- `useDismissOnOutsideOrEscape.ts` — calls a callback on outside-click or Escape while active.
- `useFlyoutLifecycle.ts` — a flyout/sidebar's mount-and-animate-out lifecycle.
- `useHierarchyState.ts` — the Structure tree's expansion state and open-properties/place-field/
  add-container handlers; takes `useTemplateEditor`'s return value as its argument.
- `useItemForm.ts` — shared state/logic for the Create and Edit item modals.
- `useKeyboardShortcuts.ts` — registers a list of global key bindings.
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
- `useTemplateEditor.ts` — template editing: load/start/stop editing, metadata, field CRUD, and the
  localStorage + debounced remote layout save. Composes `useTemplateLayoutTree` for the layout tree.
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
- `layoutTree.ts` — pure functions over the flex layout tree (build/insert/split/update/remove node,
  label helpers); covered by `tests/layout-tree.spec.ts`.
- `panelTitles.ts` — `getPanelTitle()`: the header title for a panel's docked tab(s).
- `storage.ts` — item photo upload/remove/validate against Supabase Storage.
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
`lib/layoutTree.ts`), `stacking.spec.ts` (responsive row-to-column stacking), `data.spec.ts`.

## Root & config

- `.supabase/schema.sql` — the database schema (tables, RLS policies, seed data) as hand-maintained SQL.
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `playwright.config.ts` — tool config.
- `scripts/generate-oklch-theme.mjs` — recalibrates `theme-oklch.css` from `theme-premium-contrast.css`.
- `CLAUDE.md` (imports `AGENTS.md`) — project conventions, the template editor's design notes, and
  the cleanup backlog. `AGENTS.md` is regenerated by `next dev`; don't hand-edit it.
- `README.md` — the standard project readme (setup/run instructions).
