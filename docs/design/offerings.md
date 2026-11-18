# Frontend Fellowship Offerings

Consumes backend roadmap step 11b. Business rules: backend `docs/design/fellowship-offerings.md`.

## Routes

| Path | Who | Content |
| --- | --- | --- |
| `/dashboard/offerings` | Five top officers (`canViewOfferings`) | Daily anonymous totals; Treasurer (OPEN) or Chairman (CLOSED) may upsert/remove |

Nav: Offerings item in `components/dashboard/sidebar.tsx`, visible when `canViewOfferings`.

## API helpers

`lib/api/offerings.ts` — list, upsert, remove.

## Visibility rules

In `lib/auth/access.ts`:

| Rule | Mirrors |
| --- | --- |
| `canViewOfferings` | `offering.view` (Chairman, VC, GS, VGS, Treasurer; year OPEN or CLOSED) |
| `canManageOfferings` | `offering.manage` (Treasurer, year OPEN) |
| Mutate while CLOSED | Chairman (`fellowshipYear.correctClosed` / same as correcting closed-year records) |

## UI behaviour

- List offerings for the operative year, newest date first, with a running total.
- Form: date (`YYYY-MM-DD`) + amount (whole TZS). Upsert replaces that day’s amount.
- Remove a mistaken day when the actor may mutate.
- ARCHIVED / no operative year: no access (nav hidden).

## Files

| File | Role |
| --- | --- |
| `lib/api/offerings.ts` | API client |
| `lib/auth/access.ts` | Visibility rules |
| `components/offerings/offerings-page.tsx` | List and form |
| `app/dashboard/offerings/page.tsx` | Page |
