# TroveVault

A Next.js collection workspace backed by Supabase.

## Development

Install dependencies with `npm ci`, configure `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then run `npm run dev`.
The `/test_connection` diagnostic is available only in development; production
returns 404. A successful diagnostic means the collections query succeeded.

## Checks

- `npm run lint:workspace` checks everything except TSX files with Modal in their
  names, which are deferred from the current cleanup. `npm run lint` checks all files.
- `npm run build` validates types and builds the production app. Google Fonts
  must be reachable during a cold build.
- After building, `npm test` runs data and browser regressions against a temporary
  production server on port 3100. Database requests are mocked; tests do not change
  live Supabase data. Windows uses installed Edge. On other systems, first run
  `npx playwright install chromium`.

## Media and interaction

Brand images live in `assets/images` as lossless WebP files and use Next Image
optimization. They are imported from outside `public` to avoid shipping duplicate
public and bundled copies. Retired media remains available in Git history.
The intro video loads on first interaction and respects reduced-motion preferences.

Panel separators support arrow keys (Shift for larger steps), Home for minimum
size, and End for available space. Pointer cancellation and window blur restore
cursor and selection styles. Explorer selection and action controls are keyboard
accessible; Escape dismisses an action menu before its enclosing panel.

Data loading paginates every table, including item/collection links, and cancels
outdated refreshes. Tree construction indexes parent and membership relationships;
regressions cover missing parents, cycles, inherited membership, and row caps.
