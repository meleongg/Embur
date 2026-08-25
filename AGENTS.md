# Embur contributor guide

## Project facts worth knowing

- Embur is a client-heavy Next.js 16 strength-training log. Protected screens live under `app/protected`; authentication/session refresh is handled by `proxy.ts` and `utils/supabase/middleware.ts`.
- Supabase is the source of truth, but its schema and migrations are not checked into this repository. Do not guess table columns, relationships, RLS policies, or production data migrations from UI code; confirm them with the project owner before changing database-dependent behavior.
- Active workout state is deliberately persisted in both IndexedDB and `localStorage` (`contexts/SessionContext.tsx`) to survive PWA backgrounding. Changes there must preserve both paths and cleanup on sign-out.
- UI data is fetched through TanStack Query and the shared keys in `lib/query-keys.ts`. Mutations must invalidate the affected shared key(s), otherwise routes can show stale workout/session data.
- Dates in the session history are displayed and grouped in the browser's local timezone. Keep filtering and grouping on the same local-date basis unless a product decision explicitly changes that rule.

## Development workflow

1. Install dependencies with `npm install`; provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2. Run `npm run dev` for local work. PWA generation is disabled in development; use `npm run pwa-dev` only when validating service-worker behavior.
3. Before handoff, run `npm run format:check` and `npm run build`. There is currently no dedicated test script.

## Implementation conventions

- Use the `@/` import alias and existing NextUI/Tailwind patterns.
- Keep browser-only APIs (`window`, storage, IndexedDB) inside client components/effects and preserve the `"use client"` boundary where needed.
- Use `lib/queries/*` for reusable Supabase reads, and use `queryKeys` rather than inline query-key arrays.
- Avoid unrelated formatting churn. The repository uses Prettier for formatting.
