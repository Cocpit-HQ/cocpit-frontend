# Changelog

## [Unreleased] — Railway hosting readiness (2026-10-17)

These changes prepare the Next.js frontend to run on Railway as the `frontend` service. It sits in the same project as the backend (`main-api`, `admin-api`, `worker`, Postgres, Redis) and reaches main-api over the private network.

No files or packages were deleted. Everything was verified with a production build on Linux (`node:22-bookworm-slim`, the same OS family Railway builds on), followed by a runtime smoke test of `/api/health`, the home page, and the image optimiser.

---

### 1. Secrets removed from logs

- **What:**
  - Added a small logger. `logger.debug` prints only in development, or when `DEBUG_AUTH_LOGS=true`.
  - Every auth and middleware `console.log` now goes through `logger.debug`.
  - The log lines that printed secrets were rewritten so they never print them, even in development:
    - the whole token object
    - the refresh response body
    - the `Set-Cookie` header
    - the full login response
  - Added `describeToken()`, which logs `present (…abcd)` instead of a token value.
  - Error logs now record only the status and error code, not the response body.
- **Where:**
  - New: `src/lib/logger.ts`
  - Changed: `src/lib/auth.ts` (refresh flow, `authorize`, `jwt` callback), `middleware.ts`
- **Why:** Railway stores service logs. Before this change, every login and token refresh wrote access tokens, refresh tokens and `Set-Cookie` headers into those logs, so anyone with log access could take over an account.
- **Effect:**
  - Production logs contain no tokens. Verified: no `token`/`eyJ` in the server log during the smoke test.
  - Middleware no longer logs on every protected page view.
  - Local development output is the same, except that tokens are masked.

### 2. Google Maps key no longer hardcoded

- **What:** removed the hardcoded fallback key. The key now comes only from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. If it's missing, the map shows "Map unavailable" instead of quietly using a built-in key.
- **Where:** `src/config/env.ts`, `src/features/company-onboarding/components/InteractiveLocationMap.tsx`
- **Why:** a key inside the code ships to every browser and stays in git history. It can't be rotated per environment or restricted cleanly.
- **Effect:**
  - Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` locally (added to `.env`) and on Railway (added to `.env.railway`).
  - **Still to do:** the old key is in git history, so rotate it in Google Cloud and restrict it by HTTP referrer.

### 3. Image optimiser is no longer an open proxy

- **What:**
  - Replaced the `hostname: '**'` wildcard in `images.remotePatterns` with an explicit allowlist: Cloudinary, Google avatars, Unsplash (event-card placeholders), Dicebear and ui-avatars.
  - More hosts can be added without a code change through `IMAGE_REMOTE_HOSTS` (comma-separated, read at build time).
- **Where:** `next.config.ts`
- **Why:** with the wildcard, anyone could make `/_next/image` download and resize any image on the internet, using our Railway compute and bandwidth.
- **Effect:** verified in the smoke test.
  - `/_next/image?url=https://example.com/…` now returns **400**.
  - Unsplash still returns **200**.
  - An image hosted anywhere else and rendered through `next/image` will now fail. Add its host to `IMAGE_REMOTE_HOSTS`.

### 4. Backend URL: one default, and the deploy build fails if it's missing

- **What:**
  - Added `resolveBackendUrl()` in `next.config.ts`.
  - The local fallback is now `https://cocpit-backend-staging.up.railway.app//api` in both `next.config.ts` and `env.ts`. Before, the rewrites used `:5001` (the admin API) while `env.ts` used `:5000`.
  - On Railway (`RAILWAY_ENVIRONMENT_NAME` set), or when `REQUIRE_INTERNAL_API_URL=true`, the build now **fails** if `INTERNAL_API_URL` is missing.
- **Where:** `next.config.ts`, `src/config/env.ts`
- **Why:** the `rewrites()` destinations are fixed into the build output. A missing variable on Railway would have built a frontend that sends every API call to localhost.
- **Effect:** a misconfigured Railway build stops with a clear message instead of deploying a broken app (verified). Local development falls back to the main API.

### 5. Health check endpoint

- **What:** added `GET /api/health`, which returns `{ status: "ok", service: "frontend", uptime }` with `Cache-Control: no-store`.
- **Where:** `src/app/api/health/route.ts`
- **Why:** without it, Railway can't tell a broken deploy from a working one, and a bad build would receive traffic. Next.js serves its own route files before applying the `/api/*` rewrite, so this is never forwarded to the backend.
- **Effect:** `railway.toml` points the health check here. Returns 200 (verified).

### 6. Node version pinned, scripts fixed, undeclared packages declared

- **What:**
  - Added `"engines": { "node": "22.x" }` and `.nvmrc` (22).
  - `lint` now runs `eslint .` (`next lint` no longer exists in Next 16).
  - Added the `type-check` and `ci` scripts.
  - Declared `date-fns`, `clsx`, `embla-carousel` and `@radix-ui/react-dialog`, pinned to the versions already installed.
  - Re-synced `package-lock.json`: metadata only, no installed version changed.
- **Where:** `package.json`, `package-lock.json`, `.nvmrc`
- **Why:**
  - Railway could otherwise build with a different Node major than local (Next 16 needs Node ≥ 20.9).
  - Those four packages are imported directly but only worked because other packages happened to pull them in. An upstream update could have broken the build with no code change on our side.
- **Effect:**
  - Builds are reproducible.
  - `npm run lint` now runs, but it reports errors that were already in the code (for example 10 `no-explicit-any` errors in `InteractiveLocationMap.tsx`, unchanged by this work). So `npm run ci` won't pass until those are fixed.
  - The Railway build only runs `npm run build`, which passes.

### 7. Session cookie `sameSite: "lax"`

- **What:** the NextAuth session cookie now uses `sameSite: "lax"` in every environment; production was `"none"`.
- **Where:** `src/lib/auth.ts` (`cookies.sessionToken.options`)
- **Why:** NextAuth and the app share one origin, so `"none"` was never needed and only allowed the cookie to be sent on cross-site requests (CSRF exposure).
- **Effect:** no visible change for users. Still `secure` in production.

### 8. Railway config and provisioning script

- **What:**
  - Added `railway.toml`: Railpack builder, `npm run build`, `npm start`, health check `/api/health` (120 s), restart on failure, `numReplicas = 1`.
  - Added `scripts/railway/setup.sh`. It works like the backend's script: a dry run by default, `--apply` to make changes. It:
    - creates the `frontend` service;
    - makes sure the public domains for `frontend` and `main-api` exist **before** the first build;
    - sets the frontend variables (`INTERNAL_API_URL` over the private network, `NEXTAUTH_URL`, the socket URL, `NEXT_PUBLIC_BASE_URL`, and a generated `NEXTAUTH_SECRET`);
    - updates the backend: main-api's `ALLOWED_ORIGINS`, `FRONTEND_URL`, `CLIENT_URL` and `API_URL`, and the worker's URLs.
  - Template: `scripts/railway/env.railway.example`. The real `.env.railway` is gitignored.
- **Where:** `railway.toml`, `scripts/railway/setup.sh`, `scripts/railway/env.railway.example`
- **Why:**
  - `NEXT_PUBLIC_*` values and the rewrite destination are fixed at build time, so the domains and variables must exist before the first build.
  - Next.js forwards the browser's `Origin` header when it passes `/api` calls to the backend, so main-api must allow the frontend's address or every API call fails CORS.
- **Effect:** frontend provisioning is one reviewed command. Replicas stay at 1 because the token-refresh deduplication in `src/lib/auth.ts` only works within a single process.
  - **Status:** the `--apply` run stopped at the first step with "Free plan resource provision limit exceeded". Nothing on Railway was changed. See the decision note below.

---

### Environment variables

| Variable | Local `.env` | Railway (`frontend`) |
|---|---|---|
| `INTERNAL_API_URL` | `https://cocpit-backend-staging.up.railway.app//api` | `http://main-api.railway.internal:8080/api` |
| `REQUIRE_INTERNAL_API_URL` | — | `true` |
| `NEXT_PUBLIC_API_URL` | `https://cocpit-backend-staging.up.railway.app//api` (unchanged) | `/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://cocpit-backend-staging.up.railway.app/` | `https://<main-api domain>` |
| `NEXT_PUBLIC_SOCKET_TRANSPORT_MODE` | `polling` (unchanged) | `websocket` |
| `NEXT_PUBLIC_BASE_URL` | `https://cocpit-backend-staging.up.railway.app/` | `https://<main-api domain>` |
| `NEXTAUTH_URL` | `https://cocpit-frontend-staging.up.railway.app/` | `https://<frontend domain>` |
| `NEXTAUTH_SECRET` | existing | newly generated |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | added (formerly hardcoded) | same key (rotate) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | existing | copied |
| `DEBUG_AUTH_LOGS` | `false` | not set |
| `IMAGE_REMOTE_HOSTS` | — | optional |
| `PORT` | — | `8080` |

### Known follow-ups (not done here)

- Rotate the Google Maps key, and add the frontend domain to the Google OAuth origins and the Maps key's referrer restrictions.
- Disable `.github/workflows/deploy-frontend.yml` (the self-hosted PM2 deploy) when switching to Railway.
- Items from the audit that don't block hosting: security headers / CSP, phone-screen fixes (`viewportFit`, `100vh`, zoom), scrolling performance, the 292 unused files, and the unused packages (`prisma`, `bcryptjs`, `react-player`, all left in place on purpose).
