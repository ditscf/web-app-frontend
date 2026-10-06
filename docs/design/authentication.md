# Frontend Authentication

Technical design for how the DITSCF-MS frontend signs members in and talks to the API. Business rules stay in `docs/analysis/requirements-analysis.md`. The API's own design is in the backend project's `docs/design/authentication.md`. This document does not change either.

## Two sessions, one authority

| | NestJS session | Auth.js session |
|---|---|---|
| Purpose | Authenticates every API request | Frontend UI state and route protection |
| Stored | PostgreSQL on the API | Encrypted JWT cookie on the frontend host |
| Cookie | `ditscf.session`, `httpOnly`, host-only on the API host | Auth.js session cookie on the frontend host |
| Contains | An opaque session id | `accountId`, name, and email only |
| Authority | **Authoritative** | A hint; never trusted for data or permissions |

Rules:

- The frontend never reads, copies, or stores the `ditscf.session` value. The browser attaches it to API requests because the API client uses `withCredentials: true`.
- There is no bearer token and no second API credential.
- Roles and responsibilities are never stored in the Auth.js session. They come from `GET /v1/auth/me` on each dashboard load, so a change on the API takes effect on the next load.
- When the two sessions disagree, the API wins: a `401` from the API signs the user out of Auth.js.

## Flows

### Sign in

All steps run in the browser, because only the browser can receive the API's `Set-Cookie`.

1. `POST /v1/auth/login` with the email. The API always answers the same way, so the form cannot tell whether the email has an account.
2. `POST /v1/auth/login/verify` with the email and 6-digit code. On success the API sets `ditscf.session`. A `401` here means a wrong or expired code, so it is excluded from the global `401` handling.
3. `GET /v1/auth/me` confirms the browser kept the cookie. If this returns `401` straight after a successful verify, the browser is blocking the API cookie, and the form asks the user to allow cookies.
4. `signIn('credentials', …)` creates the Auth.js session from the `/me` profile (name, email, and account id only).
5. The user is sent to `/onboarding` if they have not finished onboarding, otherwise to `/dashboard/home` (see `docs/design/access-and-dashboard.md`).

### Loading the dashboard

`app/dashboard/layout.tsx` wraps every dashboard page in `CurrentActorProvider`.

- It calls `GET /v1/auth/me` and validates the response with Zod.
- While loading it shows "Checking your session...". On a non-`401` failure it shows an error with "Try again".
- Components read the profile with `useCurrentActor()`.

### Global 401 and 403 handling

The API client converts every failure into an `ApiError` whose `kind` comes from the HTTP status, never from the message text.

- `401` (`unauthenticated`): the API session is missing, expired, or revoked. The provider's handler calls Auth.js `signOut` once and redirects to `/auth/signin`. Requests that pass `skipUnauthenticatedHandler: true` (login verify, logout) opt out.
- `403` (`forbidden`): the user is signed in but not allowed to do this. It never signs the user out.

### Sign out

1. `POST /v1/auth/logout` revokes the API session and clears its cookie. The endpoint succeeds even when there is no session.
2. Auth.js `signOut` clears the frontend session and redirects to `/auth/signin`.

If step 1 fails for any reason other than `401` (network, server error, origin rejected), the user stays signed in and sees an error, so the frontend never claims a sign-out the API did not perform.

### Route protection

`proxy.ts` runs Auth.js on `/dashboard/:path*` and `/onboarding` only. Without a valid Auth.js session the request is redirected to `/auth/signin?callbackUrl=…` before the page renders.

This is an optimistic check on the Auth.js cookie. It does not contact the API and does not check roles. The API still decides every data request.

## Session lifetime

The API session has a fixed lifetime from login (`SESSION_TTL_SECONDS`, currently 1 hour). Auth.js normally renews its JWT on every read, so the `jwt` callback in `auth.ts` stores `sessionExpiresAt` at sign-in and ends the Auth.js session at that time.

`SESSION_MAX_AGE_SECONDS` in `auth.ts` must equal the API's `SESSION_TTL_SECONDS`. Change both together.

## Calling the API

- Use `apiClient` from `lib/api/client.ts`. Do not create another Axios instance or call `fetch` directly for API data.
- Use paths relative to `NEXT_PUBLIC_API_URL`, such as `/v1/auth/me`.
- Do not add custom headers. The API's CORS policy allows `Content-Type` only.
- Validate responses at the boundary with `parseResponse(schema, data)`.
- Show errors with `getUserFacingMessage(error)`, and branch on `error.kind`, not on message text.
- Protected data must be fetched from Client Components. Server Components and route handlers cannot see the API cookie, because it is host-only on the API host.

## Files

| File | Role |
|---|---|
| `lib/api/client.ts` | Axios instance, error interceptor, `401` handler hook, `parseResponse` |
| `lib/api/errors.ts` | `ApiError`, status-based `kind`, user-facing messages |
| `lib/api/auth.ts` | Auth endpoints and the `/me` profile schema |
| `lib/auth/session-user.ts` | The only fields allowed in the Auth.js session |
| `auth.ts` | Auth.js configuration: credentials bridge, lifetime, `authorized` |
| `proxy.ts` | Optimistic route protection for `/dashboard` and `/onboarding` |
| `components/auth/sign-in-form.tsx` | Sign-in flow |
| `components/auth/current-actor-provider.tsx` | Loads `/me`, handles `401`, provides `useCurrentActor()` |
| `components/auth/sign-out-button.tsx` | Sign-out flow |

## Known limitations

- **The Auth.js session can be created without the API.** The credentials bridge cannot verify the profile it receives, so someone can create an Auth.js session with made-up details. This only reaches an empty dashboard shell: `/me` returns `401` and signs them out, and no API data is available without the `ditscf.session` cookie. Closing this fully needs a backend handoff endpoint.
- **`callbackUrl` is ignored.** After signing in, users always land on `/onboarding` or `/dashboard/home`. Honouring it must accept same-site paths only, to avoid open redirects.
- **Signed-in users can open `/auth/signin`.** They are not redirected to the dashboard, because the Auth.js session may outlive the API session.
- **No automated frontend tests.** Verification so far is manual.

## Deployment

The API cookie only works reliably when the frontend and API are **same-site**.

- **Different sites** (for example `ditscf.com` and `*.up.railway.app`): the cookie needs `SameSite=None; Secure` and is treated as a third-party cookie. Safari, iOS, Brave, and browsers that block third-party cookies will not keep it, so sign-in fails at step 3 above.
- **Same site** (for example `ditscf.com` and `api.ditscf.com`): the cookie is first-party, and `SameSite=Lax` works. Moving the API from Railway to a VPS later is a DNS change.

Recommendation: serve the API from a custom subdomain such as `api.ditscf.com`. This is an open team decision.

Settings that must match the deployment:

- API: `FRONTEND_ORIGIN` must be the exact frontend origin. Vercel preview URLs are rejected by CORS and the origin check.
- API: `COOKIE_SAME_SITE` and `COOKIE_SECURE` (`none`/`true` across sites, `lax`/`true` on one site), and `TRUST_PROXY=true` behind Railway or a reverse proxy.
- Frontend: `NEXT_PUBLIC_API_URL` and `AUTH_SECRET`. On a VPS (not Vercel), Auth.js also needs `AUTH_TRUST_HOST=true` or `AUTH_URL`.

Local development uses `localhost:3000` and `localhost:8000`, which are same-site. `COOKIE_SAME_SITE=none` with `COOKIE_SECURE=true` works in Chrome and Firefox over plain HTTP on localhost, but not in Safari. Use `lax`/`false` locally if Safari is needed.

## Environment variables

See `.env.example`.

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Browser | API base URL including `/api` |
| `AUTH_SECRET` | Server only | Signs and encrypts the Auth.js session cookie |
