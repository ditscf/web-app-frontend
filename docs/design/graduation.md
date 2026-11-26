# Frontend Graduation

Consumes backend roadmap step 13. Business rules: backend `docs/design/graduation.md`.

## Routes

| Path | Who | Content |
| --- | --- | --- |
| `/dashboard/graduation` | Chairman, Graduation Chairman, or eligible / pending applicant (`canViewGraduation`) | Appoint Graduation Chairman; Apply / Cancel; pending Confirm / Reject |

Nav: Graduation item in `components/dashboard/sidebar.tsx`, visible when `canViewGraduation`.

## API helpers

`lib/api/graduation.ts` — chairman get/appoint, me, apply, cancel, pending list, confirm, reject.

## Visibility rules

In `lib/auth/access.ts`:

| Rule | Mirrors |
| --- | --- |
| `canAppointGraduationChairman` | `graduation.appointChairman` (Chairman, year OPEN) |
| `canDecideGraduation` | Current Graduation Chairman |
| `canApplyGraduation` | From `GET /graduation/me` — Active Member, Graduation Chairman appointed, no pending application |
| `canViewGraduation` | Appoint, decide, eligible apply, or own pending |

## UI behaviour

- Chairman: look up Active Member by Fellowship ID and appoint / replace Graduation Chairman.
- Eligible member: Apply; Cancel while PENDING.
- Graduation Chairman: pending queue with Confirm and Reject.
- After confirm of self, session ends (account disabled); after appoint, `refresh()` so `/auth/me` updates.

## Files

| File | Role |
| --- | --- |
| `lib/api/graduation.ts` | API client |
| `lib/auth/access.ts` | Visibility rules |
| `components/graduation/graduation-page.tsx` | Page UI |
| `app/dashboard/graduation/page.tsx` | Route |
