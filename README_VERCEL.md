# Deployment to Vercel (malaconstruction)

This repo is a **frontend (Vite/React)** in `client/` and a **backend (Express/MySQL)** in `src/`.

## What’s implemented in this repo
- `client/src/api/api.js` now uses `import.meta.env.VITE_API_BASE_URL`.
- Added `vercel.json` rewrite (keeps `/api/*` routing work-friendly).
- Added backend serverless adapter files:
  - `src/app.js` (creates Express app without `app.listen`)
  - `api/index.js` (Vercel serverless entrypoint calling `src/app.js`)

## 1) Deploy the frontend
1. Create a Vercel project from this repository.
2. Set framework/build to Vite (build from `client/`).
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `client/dist`

Also set environment variable in Vercel for the frontend:
- `VITE_API_BASE_URL=https://<YOUR_BACKEND_DOMAIN>/api`

## 2) Deploy the backend (serverless)
In the same Vercel project (same repo):
- Ensure Node runtime is available.
- Create environment variables:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `JWT_SECRET` (required by `authController`)
  - `CORS_ORIGIN` (comma-separated allowed origins; include your Vercel frontend domain)

Then deploy.

## Local note
Backend currently still runs in dev with:
- `npm run dev` (from repo root)

## API base paths
Backend routes are mounted under `/api/*`.

## Common gotchas
- MySQL credentials must be set in Vercel env vars.
- Seed runs on every start; in serverless it may run more than once.

