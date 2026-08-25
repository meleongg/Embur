# Embur working notes

Read [AGENTS.md](AGENTS.md) first; it is the canonical contributor guide for this repository.

Additional context:

- The app uses Supabase browser clients for most protected-page data reads. Authentication is refreshed by the Next proxy layer, so do not replace that flow with ad-hoc client redirects.
- `next-pwa` writes generated service-worker files into `public/`. They are build artifacts; use `npm run clean-pwa` if a local PWA build leaves stale generated files.
- Session-history pagination is intentionally client-side and limits individual sessions, not date headings. Preserve that distinction when modifying filtering or grouping.
