# Frontend Fellowship Year Closure

Consumes backend roadmap step 12. Business rules: backend `docs/design/fellowship-year-closure.md`.

## Routes

| Path | Who | Content |
| --- | --- | --- |
| `/dashboard/year-closure` | GS or Chairman (`canViewYearClosure`) | Year status, pending countdown, event blockers, Request / Cancel / Confirm / Archive |

Nav: Year closure item in `components/dashboard/sidebar.tsx`, visible when `canViewYearClosure`.

## API helpers

`lib/api/year-closure.ts` — get status, request, cancel, confirm, archive.

## Visibility rules

In `lib/auth/access.ts`:

| Rule | Mirrors |
| --- | --- |
| `canViewYearClosure` | Operative year + GS or Chairman |
| `canRequestYearClosure` | `fellowshipYear.requestClosure` (GS, year OPEN) |
| `canConfirmYearClosure` | `fellowshipYear.confirmClosure` (Chairman, year OPEN) |
| `canArchiveYear` | `fellowshipYear.archive` (Chairman, year CLOSED) |

## UI behaviour

- Show operative year label and status.
- If a PENDING request exists, show expiry countdown; GS may Cancel; Chairman may Confirm (disabled when ACTIVE events remain).
- When CLOSED, Chairman may Archive (disabled until all events are ARCHIVED); link to Events for blockers.
- After mutations, refresh `/auth/me` so the sidebar year badge updates.

## Files

| File | Role |
| --- | --- |
| `lib/api/year-closure.ts` | API client |
| `lib/auth/access.ts` | Visibility rules |
| `components/year-closure/year-closure-page.tsx` | Page UI |
| `app/dashboard/year-closure/page.tsx` | Route |
