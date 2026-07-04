# Vercel deployment checklist (malaconstruction)

## Phase 1: Frontend build (Vercel)
- [ ] Update `client/src/api/api.js` to read API base URL from `import.meta.env.VITE_API_BASE_URL`.
- [ ] Configure Vercel to build from `client/` (install, build, output).

## Phase 2: Backend
- [ ] Decide where backend runs (Render/Railway/etc OR Vercel serverless).
- [ ] If Vercel serverless conversion is chosen, document the needed structure under `/api/*`.
- [ ] Ensure CORS allows the Vercel frontend domain.

## Phase 3: Environment variables
- [ ] Set frontend: `VITE_API_BASE_URL`.
- [ ] Set backend: MySQL + JWT secrets.

## Phase 4: Validate
- [ ] Login works.
- [ ] One authenticated API endpoint works.

