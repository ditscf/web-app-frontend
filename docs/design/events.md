# Frontend Event Management

Consumes backend roadmap steps 10, 10b (attendance), 11 (contributions), and 13 (participant self-join). Business rules: backend `docs/design/event-management.md`, `docs/design/event-attendance.md`, `docs/design/event-contributions.md`. Fellowship offerings (11b) and event reports stay out of this phase.

## Routes

| Path | Who | Content |
| --- | --- | --- |
| `/dashboard/events` | Any onboarded member (`canViewEvents`) | Operative-year event list; create for Chairman while OPEN |
| `/dashboard/events/[eventId]` | Same; `403` / missing event → no-access | Committee, sessions/attendance, contributions, participants, details, close, archive |

Nav: Events item in `components/dashboard/sidebar.tsx`, visible when `canViewEvents`.

## API helpers

`lib/api/events.ts` — Zod-parsed clients for list, create, committee, participants (list, join, withdraw, committee add/remove), sessions, attendance mark/unmark, contributions, update, close, archive.

## Visibility rules

In `lib/auth/access.ts`:

| Rule | Mirrors |
| --- | --- |
| `canViewEvents` | List: any onboarded member |
| `canCreateEvents` / `canAppointEventCommittee` | `event.create` / `event.appointCommittee` |
| `canOperateEvent(actor, eventId)` | `event.manageOperations` (Event Chairman of that event, year OPEN) |
| `canJoinEvent` | Event ACTIVE, year OPEN, onboarded (not already current participant) |
| `canWithdrawFromEvent` | Current `SELF` participant on that event |
| `canCloseEvent` | `event.close` |
| `canManageEventAttendance(actor, eventId)` | `event.manageAttendance` (Event Chairman or Secretary, year OPEN) |
| `canViewEventFinances(actor, eventId)` | `event.viewFinances` (Event Chairman, Treasurer, or Secretary) |
| `canManageEventFinances(actor, eventId)` | `event.manageFinances` (Event Treasurer, year OPEN) |
| `canCorrectOrArchiveEvent` | `event.correctClosed` / `event.archive` (Vice Chairman) |

## UI behaviour

- **Create:** Chairman enters name and optional venue. Event starts ACTIVE.
- **Committee:** Active-member lookup (`GET /v1/members/lookup/:fellowshipId`), then confirm. Associates are refused by that lookup. After appoint, `refresh()` so `/auth/me` event roles update. Appoint also creates a `COMMITTEE` participant.
- **Participants:** Any onboarded member may read the list (includes join source). Members see **Join** / **Withdraw** when eligible. Event Chairman (ACTIVE) or Vice Chairman (CLOSED) add/remove **committee** participants via Fellowship ID lookup — always `COMMITTEE`.
- **Sessions / attendance:** Any onboarded member may view sessions and rolls. Event Chairman or Event Secretary may create/remove sessions and mark present while ACTIVE; Vice Chairman while CLOSED. Present-only toggles on the participant roll for that session.
- **Contributions:** Event Chairman, Treasurer, or Secretary may view the ledger. Event Treasurer sets pledges and records payments while ACTIVE; Vice Chairman while CLOSED. Whole TZS; outstanding = pledge − paid.
- **ACTIVE:** Event Chairman may edit name/venue, add/remove committee participants, and close.
- **CLOSED:** Vice Chairman may correct name/venue/committee participants/sessions/attendance/contributions and archive.
- **ARCHIVED:** Read-only.

## Files

| File | Role |
| --- | --- |
| `lib/api/events.ts` | API client |
| `components/events/events-overview.tsx` | List and create |
| `components/events/create-event-dialog.tsx` | Create form |
| `components/events/event-detail.tsx` | Detail, participants, lifecycle |
| `components/events/event-sessions.tsx` | Session list and create |
| `components/events/session-attendance-roll.tsx` | Present-only roll |
| `components/events/event-contributions.tsx` | Pledge/payment ledger |
| `components/events/appoint-committee-dialog.tsx` | Committee appoint/replace |
| `app/dashboard/events/` | Pages |
