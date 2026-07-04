# Vercel backend (Express) deployment notes

This repo currently runs the backend as a single Express server from `src/index.js`.
Vercel deploys Node apps as **serverless functions**. The simplest correct way is to use a framework/runtime that translates Express into serverless (e.g., `@vercel/node` + a thin adapter, or migrating to Vercel's recommended serverless routing).

Recommended approach for this project:
1) Keep Express code mostly intact.
2) Add a `api/` entrypoint per route (or use an adapter) that forwards to Express.
3) Ensure environment variables are set in Vercel for DB + JWT.

## Required env vars
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional)

## CORS
- Update `src/index.js` to allow the Vercel frontend domain (or use the env var for allowed origins).

## Important
- Your `src/index.js` calls `seedDatabase()` on every server start. In serverless, this can run multiple times.
  Consider moving seeding to a separate one-time job, or guard it more strictly.

