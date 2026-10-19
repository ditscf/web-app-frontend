# Frontend Roadmap

The order the frontend is being built in, and where each step stands. Business rules live in `docs/Project BRS.md` and `docs/analysis/requirements-analysis.md`. Frontend technical decisions live in `docs/design/`. What the API offers is decided by the backend project (`docs/roadmap.md` and `docs/design/` there); the frontend consumes an endpoint only after it exists.

Status: **Done**, **Next**, **Blocked** (waiting for a backend endpoint), **Later**.

Each step follows the same loop: inspect, make the smallest change, verify, report, and wait for approval before the next step.

## Done

| Step | Where |
| --- | --- |
| Passwordless sign-in, the two sessions, `401`/`403` handling, sign-out, route protection | `docs/design/authentication.md` |
| Visibility rules, no-access state, nav driven by rules | `docs/design/access-and-dashboard.md` |
| Public sign-up wired to the API | `components/auth/sign-up-form.tsx` |
| Applications queue with the two approval steps | `components/applications/applications-review.tsx` |
| GS-assisted registration on the applications page | `docs/design/assisted-registration.md` |
| Onboarding gate and ministry selection | `components/onboarding/` |
| Home page with "Needs your attention" | `components/dashboard/needs-attention.tsx` |
| My profile and email change | `docs/design/profile.md` |
| Ministries, leaders, and ministry members | `docs/design/ministries.md` |
| Home count of ministries without a leader | `docs/design/access-and-dashboard.md` |
| My ministries links and Fellowship ID lookup before appoint/add | `docs/design/ministries.md` |
| UI stack: Tailwind CSS v4, shadcn on Radix instead of Base UI, stock styling | `docs/design/ui-components.md` |

## Next

Nothing is unblocked. Every remaining module waits for a backend endpoint (see "Blocked" below). The next frontend phase starts when the backend ships its next step (Events); its plan is written here first.

## Phase record: GS-assisted registration (done 2026-10-19)

Consumed the assisted-registration piece of backend step 3. Decisions: form on `/dashboard/applications` via a top-right button; show "Registered by GS" in the queue; no home shortcut. Requirement docs synced from the backend.

### Contracts added

| Endpoint | Who | Responses |
| --- | --- | --- |
| `POST /v1/applications/assisted` | GS, year OPEN | Same body and result shape as public sign-up. Stores `GS_ASSISTED`; counts as the GS step |
| `GET /v1/applications/list` (extended) | GS or VGS | Each pending row includes `submissionSource` and `gsApprovalRecorded` (true for assisted without a GS decision row) |

### Steps

1. Foundation: `canRegisterAssisted`, `registerAssistedApplication`, pending schema `submissionSource`.
2. Queue: label and status copy for assisted rows; GS has no Approve on those rows.
3. Form: "Register a member" on the applications page.
4. Docs: `docs/design/assisted-registration.md`, access table, this roadmap.

## Phase record: member profile and ministries (done 2026-10-05)

Consumed backend roadmap steps 7–9 (member profile, ministry leadership, ministry membership). Kept as a record of the contracts, decisions, and rule changes.

### Backend contracts

Verified against the backend source on 2026-10-05. Full response shapes are in the backend's `docs/design/profile.md`, `docs/design/ministry-leadership.md`, and `docs/design/ministry-membership.md`. Every route below needs a session and completed onboarding.

| Endpoint | Who | Responses |
| --- | --- | --- |
| `GET /v1/profile/view` | The member (Active) | Own profile: `personId`, `email`, `firstName`, `lastName`, `phone`, `class`, `course`, `yearOfStudy`, `dateOfBirth` (`YYYY-MM-DD`), `fellowshipId`, `membershipStatus` |
| `PATCH /v1/profile/update` | The member (Active) | Any of `firstName`, `lastName`, `phone`, `class`, `course`, `yearOfStudy`; returns the profile. `400` for an empty body, an empty field, or any other field (`email`, `dateOfBirth`, `fellowshipId` are refused) |
| `POST /v1/profile/email/request` | The member (Active) | `{ newEmail }`; returns `{ message, expiresAt }`. `400` invalid or same email, `409` email in use, `429` too many requests in an hour, `503` the code email could not be sent |
| `POST /v1/profile/email/confirm` | The member (Active) | `{ code }` (6 digits); returns the profile. `400` wrong or expired code (the request ends after too many attempts), `409` the email was taken meanwhile |
| `GET /v1/ministries/mine` | The member (onboarded) | Current ministries: `{ ministries: [{ ministry, since }] }`. Uses `member.viewOwn` |
| `GET /v1/ministries/leaders` | Any onboarded member | `{ operativeYear, ministries: [{ ministry, leader \| null }] }`. Leader: `personId`, `fellowshipId`, `firstName`, `lastName`, `since` |
| `POST /v1/ministries/:ministryId/leader` | Chairman, year OPEN | `{ fellowshipId }`; returns `{ ministry, fellowshipYear, leader, replaced \| null, joinedMinistry }`. `404` ministry or Fellowship ID, `400` not an Active Member, `409` already leads this or another ministry this year, not onboarded, or a concurrent change |
| `GET /v1/ministries/:ministryId/members/list` | Chairman, that ministry's current-year leader, or a member of that ministry; year OPEN or CLOSED | `{ ministry, members: [person] }`, ordered by last name. `403` anyone else, `404` unknown ministry |
| `POST /v1/ministries/:ministryId/members/add` | Chairman or that ministry's current-year leader, year OPEN | `{ fellowshipId }`; `201` with `{ ministry, member }`. `404`, `400` not Active, `409` not onboarded or already a member |
| `POST /v1/ministries/:ministryId/members/remove` | Same as add | `{ fellowshipId }`; `200` with `{ ministry, member, removedAt }`. `404` unknown, or not in the ministry; `409` the member is that ministry's current leader |
| `GET /v1/members/lookup/:fellowshipId` | Chairman, GS, VGS, or a Ministry Leader; year OPEN or CLOSED | `{ personId, fellowshipId, firstName, lastName, membershipStatus, onboarded }`. `400` malformed ID, `404` unknown |

Facts that shape the UI:

- Fellowship IDs are 8 digits. Appointing a leader and adding a member identify the person by Fellowship ID; `GET /v1/members/lookup/:fellowshipId` confirms the name before the action.
- Leaders are never removed, only replaced. One person leads at most one ministry per year.
- A Ministry Leader sees and manages members only in the ministry they lead; the Chairman in every ministry (changed 2026-10-05, see "Rule changes after testing").
- Appointing a leader makes them a member of that ministry. A replaced leader stays a member. The current leader cannot be removed from their ministry.
- Member and leader lists show names, Fellowship IDs, and start dates only. Date of birth appears only in the member's own profile.
- Ministry membership carries over between years; leadership does not.
- An email change does not end sessions. It ends unused sign-in codes, and the next sign-in uses the new address.

### Visibility rules added

In `lib/auth/access.ts`, each naming the policy action it mirrors. All of them read `/auth/me`, which only reports current-year offices and leadership.

| Rule | Mirrors | Logic |
| --- | --- | --- |
| `canManageOwnProfile` | `member.viewOwn`, `member.editOwnProfile` | `membershipStatus` is `ACTIVE` |
| `canAppointMinistryLeaders` | `ministry.appointLeader` | Year `OPEN` and Chairman |
| `canManageMinistryMembers(actor, ministryId)` | `ministry.manageMembership` | Year `OPEN` and (Chairman or leads that ministry) |
| `canOverseeMinistryMembers(actor, ministryId)` | `ministry.viewMembership` | An operative year and (Chairman or leads that ministry) |
| `canViewMinistryMembers(actor, ministryId, ownMinistryIds)` | `ministry.viewMembership` plus `/ministries/mine` | Oversee, or the ministry is in the caller's own ministries |
| `canLookupMember(actor)` | `member.lookup` | An operative year and (Chairman, GS, VGS, or leads a ministry) |

`ministry.viewMembership` also allows current members of that ministry. The ministries page loads `GET /v1/ministries/mine` for those links. A direct visit still works, because the API decides.

### Steps

**Step 1: Foundation** (Done)

- `refresh()` on `CurrentActorProvider`, to reload `/auth/me` after an in-dashboard change that affects it: a name or email change, or a Chairman appointing themselves as a leader.
- The visibility rules above.
- A shared Fellowship ID schema (8 digits) in `lib/validation.ts`.

**Step 2: My profile** (Done, `docs/design/profile.md`) (`/dashboard/profile`, nav item for `canManageOwnProfile`)

- View: name, email, phone, class, course, year of study, date of birth, Fellowship ID, membership status.
- Edit the six editable fields. Send only changed fields; disable saving when nothing changed. Class, course, and year use the sign-up option lists (see decisions below).
- Date of birth, Fellowship ID, and status are read-only. (The planned note that date of birth cannot be changed was removed at the project owner's request.)
- After saving, `refresh()` so the dashboard header shows the new name.

**Step 3: Email change** (Done, `docs/design/profile.md`) (on the profile page)

- Enter the new address, then the 6-digit code sent there (reusing the sign-in code input).
- Clear messages for `409` in use, `429` too many requests, `503` email not sent, and `400` wrong or expired code.
- On success, show the new email and `refresh()`.

**Step 4: Ministries and leaders** (Done, `docs/design/ministries.md`) (`/dashboard/ministries`, visible to every onboarded member)

- Every ministry with its current leader for the year, or "No leader yet".
- Chairman while OPEN: "Appoint leader" or "Replace leader" per ministry. A dialog takes the Fellowship ID, warns when it replaces someone, and confirms the result by name ("Bea Leader now leads Choir", noting who was replaced and whether Bea joined the ministry).
- The Chairman: every ministry links to its member page. A Ministry Leader: only their own ministry does.

**Step 5: Ministry members** (Done, `docs/design/ministries.md`) (`/dashboard/ministries/[ministryId]`)

- Member list with names, Fellowship IDs, and since dates. `403` shows the no-access state.
- `canManageMinistryMembers`: add by Fellowship ID, and remove from a row after an Alert Dialog confirmation. Reload the list after each change; show the API message for `400`, `404`, and `409`.
- Read-only while the year is CLOSED.
- "Led by …" in the heading; the leader's row is marked "Leader" and has no Remove button.

**Step 6: Home additions** (Done, `docs/design/access-and-dashboard.md`)

- "Needs your attention" adds "N ministries have no leader this year" for the Chairman while the year is OPEN (decision 5), linking to the ministries page. Hidden when zero or when the request fails; the application counts are unaffected.

**Step 7: Documentation** (Done)

- `docs/design/profile.md` (written with Step 2, extended in Step 3) and `docs/design/ministries.md` (with test accounts and a verification checklist) for the frontend side of these modules.
- The new rules, home counts, and files in `docs/design/access-and-dashboard.md`.
- This roadmap's status.

### Decisions (approved 2026-10-05)

1. **"My ministries" for ordinary members.** Done: `GET /v1/ministries/mine`. The ministries page links each of the caller's ministries to its member list while there is an operative year.
2. **Fellowship ID lookup before appoint/add.** Done: `GET /v1/members/lookup/:fellowshipId`. Appoint and add look up the name first; not Active or not onboarded is refused under the field before confirm.
3. **Profile values outside the option lists: keep the current value.** Some local profiles hold values that are not in the sign-up lists (for example "Bachelor Degree" instead of "Bachelor's Degree"). The edit form uses the sign-up lists, and an unlisted stored value is shown as the current choice, so saving other fields does not force a change.
4. **Test accounts: a Chairman inbox the project owner controls.** Done by the project owner: the Chairman (`25140001`) now uses `vicoba.sgiafrica@gmail.com` and has onboarded; the Vice General Secretary moved to `vicoba2.sgiafrica@gmail.com`. The Ministry Leader flows were tested with Ev. Johnson Rutabangwa (`25140006`, Evangelists); see `docs/design/ministries.md`.
5. **Home item: yes.** Step 6 adds "N ministries have no leader this year" for the Chairman while the year is OPEN, from `GET /v1/ministries/leaders`, hidden when zero or on error.

### Rule changes after testing (approved 2026-10-05)

Testing Step 5 showed that any Ministry Leader could manage every ministry, as the BRS then allowed, and that a leader did not have to be a member of their ministry. The project owner changed both rules. The backend updated the BRS, Vision, requirements analysis, policy, and services; the frontend copies of those documents were synced.

- A Ministry Leader sees and manages membership only in the ministry they lead. The Chairman still manages every ministry, and members can still see their own ministry's list.
- Appointing a leader makes them a member of that ministry (`joinedMinistry` in the response). The appointee must have finished onboarding. A replaced leader stays a member, and the current leader cannot be removed (`409`).
- Frontend: the ministry rules in `lib/auth/access.ts` take a `ministryId`; the member page shows the leader and hides Remove on their row; the appoint toast says when the leader joined the ministry.

### Follow-up: my ministries and lookup (done 2026-10-06)

Backend shipped `GET /v1/ministries/mine` and `GET /v1/members/lookup/:fellowshipId`. Frontend:

- Loads own ministries on the ministries page for member-list links (`canViewMinistryMembers`).
- Looks up the member before appointing a leader or adding a member; confirm dialogs name them.
- Access rules: `canViewMinistryMembers`, `canLookupMember` in `lib/auth/access.ts`; API helpers in `lib/api/ministries.ts` and `lib/api/members.ts`.

### Known limitations of this phase

- The Auth.js session keeps the name and email from sign-in. Nothing in the UI reads them (screens use `/auth/me`), so a profile or email change does not update the Auth.js session.

## Blocked: waiting for backend endpoints

In the backend's build order:

1. **Events**: Chairman creates events and appoints committees; Event Chairman, Treasurer, and Secretary pages; close; Vice Chairman correction and archive.
2. **Fellowship year closure and archive**: General Secretary request with a 12-hour window, Chairman confirmation, archive.
3. **Graduation**: Event Chairman request, Chairman confirmation.
4. **Member access views**: my events, CLOSED and ARCHIVED records (archived years only, after onboarding; the current CLOSED year read-only). My ministries was done with ministry membership.

## Later

- Choose the visual design, then keep or remove the remaining DITSCF styling listed in `docs/design/custom-styling.md`.
- Honour `callbackUrl` after sign-in (same-site paths only).
- Redirect signed-in users away from `/auth/signin`.
- Production API domain (`api.ditscf.com`) and `TRUST_PROXY=true` on the host.
- Automated frontend tests.
