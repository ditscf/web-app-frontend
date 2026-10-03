# Frontend Access and Dashboard

Technical design for how the DITSCF-MS frontend decides what each member sees. Business rules stay in `docs/Project BRS.md` and `docs/analysis/requirements-analysis.md`. Sign-in and sessions are in `docs/design/authentication.md`. The authority for every action is the backend authorization policy (`src/authorization/authorization.policy.ts` in the backend project).

## Principles

- **The backend decides every action.** Frontend rules only decide what to show. A hidden link or button is a convenience, not security.
- **One source for visibility.** All rules live in `lib/auth/access.ts`. They read the profile from `GET /v1/auth/me` (offices, ministry leadership, event roles, operative year). The API does not send permission flags.
- **No roles in the Auth.js session or `proxy.ts`.** The proxy only checks that a session exists. Responsibilities are loaded from `/me` on each dashboard load, so a change on the API applies on the next load.
- **Routes are organised by resource, not by role.** For example `/dashboard/applications`, later `/dashboard/ministries/[id]`. There is no role switcher: a member who holds several responsibilities sees all of their links.

## Visibility rules

| Rule in `lib/auth/access.ts` | Mirrors backend policy action | Used for |
|---|---|---|
| `isOnboardingRequired(actor)` | The API's onboarding requirement on member routes | Onboarding gate, sign-in redirect |
| `getApprovalStep(actor)` | `member.approveAsGs`, `member.approveAsVgs` | Which approve button the queue shows; home counts |
| `canReviewApplications(actor)` | `member.reviewApplications`, plus onboarding | Applications nav link and page; home counts |

Notes:

- `/me` returns no responsibilities when there is no operative year (the holiday). The rules therefore check that `operativeYear` is present and do not repeat the year-status rule: OPEN and CLOSED are the only statuses `/me` returns, and both allow application review.
- A member who holds the General Secretary office is treated as the General Secretary step. The backend prevents one person from recording both steps.
- When a backend policy action changes, update the matching rule and this table together.

## When access is refused

- **Direct visit the rule refuses:** the page shows `components/dashboard/no-access.tsx` and makes no data request.
- **`403` from the API:** the same no-access state, with the API's message when there is one. A `403` never signs the member out; only a `401` does (see `docs/design/authentication.md`).
- **`403`, `404`, or `409` on an action** (for example approving an application that expired or was already approved): the page shows the API's message as a toast and reloads its data, because the state changed on the server.

## Onboarding gate

Members must finish onboarding before using member pages. The API enforces this; the frontend routes around it so members don't land on `403` pages.

- `/onboarding` is its own protected page with its own layout (logo and sign-out only), outside the dashboard shell. `proxy.ts` protects it like `/dashboard`.
- **Sign-in** sends a member who has not onboarded to `/onboarding`, everyone else to `/dashboard/home`.
- **Dashboard:** `components/onboarding/require-onboarding-complete.tsx` wraps the dashboard layout. A member who has not onboarded is redirected to `/onboarding` and no dashboard content renders.
- **Onboarding page:** a member who has already onboarded is redirected to `/dashboard/home`.
- **The form** loads `GET /v1/ministries/list`, requires at least one ministry, states that the choice is final, and submits `POST /v1/onboarding/complete`. On success, or `409` (already complete), it goes to `/dashboard/home`.
- Each layout has its own `CurrentActorProvider`, so moving from `/onboarding` to `/dashboard` loads a fresh profile.

## Home page

`components/dashboard/home-overview.tsx` shows the welcome, "Needs your attention", the fellowship year, and the member's responsibilities.

"Needs your attention" (`components/dashboard/needs-attention.tsx`):

- Appears only for members with `canReviewApplications`. Other members never trigger the request.
- Counts pending applications from `GET /v1/applications/list`, split by who they are waiting for:
  - waiting for the General Secretary: the General Secretary step is not recorded;
  - waiting for the Vice General Secretary: the General Secretary step is recorded.
- Each officer sees both counts, worded from their side ("waiting for your approval" and "waiting for the …"), so either can remind the other. The approval order is unchanged.
- The list endpoint returns at most 100 (`PENDING_APPLICATIONS_LIMIT`). At that limit the counts show a `+`.
- Items with a zero count are hidden, and the whole section is hidden when it has no items or the request fails. The home page never shows an error for it.

## Adding a module

1. Confirm the backend endpoint and its policy action exist. Frontend work starts after the endpoint.
2. Add a rule to `lib/auth/access.ts` that names the policy action it mirrors, and add a row to the table above.
3. Add API functions with Zod response schemas under `lib/api/`.
4. Add the page under `app/dashboard/<resource>/`. Render `NoAccess` when the rule refuses, and handle `403` from the API the same way.
5. Add a nav item to `NAV_ITEMS` in `components/dashboard/sidebar.tsx` with `isVisible` set to the new rule.
6. If the module creates work for someone, add an item to "Needs your attention", hidden when empty or on error.

## Files

| File | Role |
|---|---|
| `lib/auth/access.ts` | Visibility rules |
| `components/dashboard/sidebar.tsx` | Dashboard shell; nav items filtered by their rules |
| `components/dashboard/no-access.tsx` | Shared no-access state |
| `components/dashboard/home-overview.tsx` | Home page |
| `components/dashboard/needs-attention.tsx` | Pending work on the home page |
| `components/applications/applications-review.tsx` | Applications queue and step-aware approval |
| `components/onboarding/require-onboarding-complete.tsx` | Dashboard onboarding gate |
| `components/onboarding/onboarding-form.tsx` | Ministry selection and onboarding submission |
| `lib/api/applications.ts` | Sign-up, pending list, approval |
| `lib/api/ministries.ts` | Ministry list |
| `lib/api/onboarding.ts` | Onboarding submission |

## Known limitations

- **Visibility can lag the API by one load.** The profile is loaded when a layout mounts. If an office changes while a member is signed in, links update on the next load; the API refuses any action in the meantime.
- **Home counts can be stale.** They are loaded once per home visit, not refreshed live.
- **Most modules are not built yet.** Member pages, ministries, events, fellowship year closure, and graduation wait for their backend endpoints.
