# Frontend Event Management

Consumes backend roadmap step 10 (Event Management) and step 10b (Event attendance). Business rules: backend `docs/design/event-management.md`, `docs/design/event-attendance.md`, and requirements analysis. Contributions and reports stay out of this phase.

## Routes

| Path | Who | Content |
| --- | --- | --- |
| `/dashboard/events` | Any onboarded member (`canViewEvents`) | Operative-year event list; create for Chairman while OPEN |
| `/dashboard/events/[eventId]` | Same; `403` / missing event → no-access | Committee, sessions/attendance, participants, details, close, archive |

Nav: Events item in `components/dashboard/sidebar.tsx`, visible when `canViewEvents`.

## API helpers

`lib/api/events.ts` — Zod-parsed clients for list, create, committee, participants, sessions, attendance mark/unmark, update, close, archive.

## Visibility rules

In `lib/auth/access.ts`:

| Rule | Mirrors |
| --- | --- |
| `canViewEvents` | List: any onboarded member |
| `canCreateEvents` / `canAppointEventCommittee` | `event.create` / `event.appointCommittee` |
| `canOperateEvent(actor, eventId)` | `event.manageOperations` (Event Chairman of that event, year OPEN) |
| `canCloseEvent` | `event.close` |
| `canManageEventAttendance(actor, eventId)` | `event.manageAttendance` (Event Chairman or Secretary, year OPEN) |
| `canCorrectOrArchiveEvent` | `event.correctClosed` / `event.archive` (Vice Chairman) |

## UI behaviour

- **Create:** Chairman enters name and optional venue. Event starts ACTIVE.
- **Committee:** Active-member lookup (`GET /v1/members/lookup/:fellowshipId`), then confirm. Associates are refused by that lookup. After appoint, `refresh()` so `/auth/me` event roles update.
- **Participants:** Any onboarded member may read the list. Event-scoped lookup (`…/participants/lookup/:fellowshipId`) so Active and Associate names can be confirmed before add or remove (Event Chairman while ACTIVE; Vice Chairman while CLOSED).
- **Sessions / attendance:** Any onboarded member may view sessions and rolls. Event Chairman or Event Secretary may create/remove sessions and mark present while ACTIVE; Vice Chairman while CLOSED. Present-only toggles on the participant roll for that session.
- **ACTIVE:** Event Chairman may edit name/venue, add/remove participants, and close.
- **CLOSED:** Vice Chairman may correct name/venue/participants/sessions/attendance and archive.
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
| `components/events/appoint-committee-dialog.tsx` | Committee appoint/replace |
| `app/dashboard/events/` | Pages |
