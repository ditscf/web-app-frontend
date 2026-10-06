# Frontend: Ministries

Technical design for the ministries pages. The business rules are under "Scoped responsibilities", "Ministry", and "Ministry membership" in `docs/analysis/requirements-analysis.md`. The API side is in the backend project's `docs/design/ministry-leadership.md` and `docs/design/ministry-membership.md`.

## Endpoints

`lib/api/ministries.ts`, validated with Zod:

| Function | Endpoint | Notes |
| --- | --- | --- |
| `listMinistries()` | `GET /v1/ministries/list` | Names only; used by onboarding |
| `listMinistryLeaders()` | `GET /v1/ministries/leaders` | `{ operativeYear, ministries: [{ ministry, leader \| null }] }` |
| `appointMinistryLeader(ministryId, fellowshipId)` | `POST /v1/ministries/:ministryId/leader` | Returns `{ ministry, fellowshipYear, leader, replaced \| null, joinedMinistry }` |
| `listMinistryMembers(ministryId)` | `GET /v1/ministries/:ministryId/members/list` | `{ ministry, members }`, ordered by last name |
| `addMinistryMember(ministryId, fellowshipId)` | `POST /v1/ministries/:ministryId/members/add` | Returns `{ ministry, member }` |
| `removeMinistryMember(ministryId, fellowshipId)` | `POST /v1/ministries/:ministryId/members/remove` | Returns `{ ministry, member, removedAt }` |

People in these responses carry `personId`, `fellowshipId`, `firstName`, `lastName`, and `since` only. No contact details or date of birth.

## Ministries page

- `/dashboard/ministries`, rendered by `components/ministries/ministries-overview.tsx`.
- The "Ministries" nav item and the page use `canViewMinistryLeaders`: any onboarded member. The API has no policy action for this list; it only requires onboarding.
- Each ministry shows its leader for the operative year ("Led by Bea Leader · 25160002 · since 1 Nov 2025") or "No leader yet".
- A ministry name links to its member page for `canOverseeMinistryMembers(actor, ministryId)`: the Chairman on every ministry, and a Ministry Leader only on the ministry they lead.
- The heading line names the year and its status, taken from the response. With no operative year, it says no leaders are listed.

## Appointing a leader

- "Appoint leader" or "Replace leader" appears on every ministry for `canAppointMinistryLeaders`: the Chairman while the year is OPEN (`ministry.appointLeader`). There is no remove action, because leaders are only replaced.
- `components/ministries/appoint-leader-dialog.tsx` has two stages:
  1. **Enter** the member's Fellowship ID (8 digits, checked with `fellowshipIdSchema`). When replacing, the dialog names the current leader.
  2. **Confirm**: repeats the Fellowship ID, the ministry, the year, and who is replaced, and warns that the member's name is only shown after appointing. There is no lookup by Fellowship ID yet (see `docs/roadmap.md`, decision 2).
- Appointing makes the leader a member of that ministry if they were not one already (`joinedMinistry: true`). A replaced leader stays a member.
- On success: the dialog closes, a toast names the new leader, the replaced one (who stays a member), and whether the leader also joined the ministry, and the list reloads. If the Chairman appointed themselves, `useRefreshCurrentActor()` reloads `/auth/me` so their new responsibility shows.

Errors, by status:

| Status | Where | Meaning |
| --- | --- | --- |
| `404` | Back to the first stage, under the field | Unknown ministry or no member with that Fellowship ID |
| `400` | Same | The member is not an Active Member |
| `409` | Same | The member already leads this ministry or another ministry this year, has not finished onboarding, or the ministry changed at the same time |
| `403` | Toast; the dialog closes and the list reloads | The Chairman can no longer appoint (for example, the year is no longer open) |

Other errors show a toast and keep the dialog open. The dialog cannot be closed while the request runs. A `401` signs out through the global handler.

## Ministry members page

- `/dashboard/ministries/[ministryId]`, rendered by `components/ministries/ministry-members.tsx`. The page reads `ministryId` from the awaited `params` promise (`PageProps<'/dashboard/ministries/[ministryId]'>`).
- The page always asks the API, because `ministry.viewMembership` also allows current members of that ministry, which `/auth/me` cannot tell. A `403` shows the no-access state with the API's message. A `404`, or `400` for an id that is not a UUID, shows "We couldn't find that ministry" with a link back.
- Ordinary members have no link to this page until the backend can say which ministries they belong to (`docs/roadmap.md`, decision 1). A direct visit works for members of that ministry. Another ministry's leader gets `403`.
- The page loads the member list and `GET /v1/ministries/leaders` together, to find this ministry's leader. If either fails, the page shows the error state.
- Each member shows name, Fellowship ID, and the date their membership started. No contact details. The leader's row is marked "Leader".
- The heading shows the ministry name, member count, and "Led by …" or "No leader yet". For the Chairman and this ministry's leader while the year is CLOSED, it adds that members can't be added or removed.

### Adding and removing

Shown for `canManageMinistryMembers(actor, ministryId)`: the Chairman in any ministry, or the leader of this ministry, while the year is OPEN (`ministry.manageMembership`).

- **Add**: a Fellowship ID field (`components/ministries/fellowship-id-field.tsx`, shared with the appoint dialog), checked with `fellowshipIdSchema`, then an Alert Dialog that repeats the ID before adding. The member's name is shown in the success toast.
- **Remove**: a Remove button per member except the current leader, then an Alert Dialog naming the member. Removing someone from their last ministry is allowed. The leader can only leave after another leader is appointed.
- After either action the list reloads.

Errors, by status:

| Action | Status | Where | Meaning |
| --- | --- | --- | --- |
| Add | `404` | Under the field | No member has that Fellowship ID (or the ministry is gone) |
| Add | `400` | Under the field | The member is not an Active Member |
| Add | `409` | Under the field | The member has not finished onboarding, or is already in the ministry |
| Remove | `404` | Toast, list reloads | The member is no longer in the ministry |
| Remove | `409` | Toast, list reloads | The member became this ministry's leader since the list loaded |
| Either | `403` | Toast, list reloads | The action is no longer allowed (for example, the year closed) |

Other errors show a toast. The dialog cannot be closed while the request runs. A `401` signs out through the global handler.

## Local test accounts

- Chairman: "Chairman Mushi", Fellowship ID `25140001`, `vicoba.sgiafrica@gmail.com`, onboarded.
- Ministry Leader: "Ev. Johnson Rutabangwa", `25140006`, leads Evangelists and is a member of it. He is also a member of Media Team, so he can view that list but not manage it.
- Test member: Gilbert, `25140007`, `officialgilbert45@gmail.com`.

## Verification

- Type check and lint.
- Signed out, both ministries routes redirect to sign-in, and the API answers `401` to the leader list and member list.
- Manual, as the Chairman: appoint and replace a leader and check the toast says when the leader joined the ministry; every ministry links to its members; add and remove members anywhere; the home page counts ministries without a leader.
- Manual, as a Ministry Leader: only their own ministry links to its members; add and remove there; their own row says "Leader" with no Remove button; another ministry's member page shows no access unless they are a member of it, and then it is read-only.
- Manual, as a member: the ministries page lists leaders only; a direct visit to their own ministry's members is read-only.
