# Cleanup backlog

Found in the code audit, not yet done. Moved out of CLAUDE.md.

- `PrimarySidePanel` takes ~87 props (title, tabs, search/filter, dock/pin/move, drag state, the
  create/loading/error props every panel repeats). The four large files that fed it that many flat
  props are already split (see below), and the 27 it only forwards to its header are declared once
  (`PanelHeaderPassThroughProps` in `PrimarySidePanelHeader.tsx`, rest-spread by both side panels;
  add a new pass-through prop there, not to each panel); the props themselves are still flat. Moving workspace,
  template-editor and tree/search state into contexts would let panels read what they need instead
  of receiving it, but that changes re-render behavior and needs its own sign-off before doing it.
- CI is set up in `.github/workflows/ci.yml` (typecheck, lint, build, tests) but has not run on GitHub yet, so
  it is unverified. To make the build and tests use the real database, add the two `NEXT_PUBLIC_SUPABASE_*` values as repository
  secrets (tests that need seeded data are skipped).
