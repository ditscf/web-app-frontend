# Frontend: My Profile

Technical design for the member's own profile page. The business rules are under "Member profile" in `docs/analysis/requirements-analysis.md`. The API side is in the backend project's `docs/design/profile.md`.

## Route and access

- `/dashboard/profile`, rendered by `components/profile/my-profile.tsx`.
- The "My profile" nav item and the page use `canManageOwnProfile` (`lib/auth/access.ts`): an Active Member who has finished onboarding. It mirrors `member.viewOwn` and `member.editOwnProfile`.
- A refused rule or a `403` from the API shows the shared no-access state.

## Endpoints

`lib/api/profile.ts`, validated with Zod:

| Function | Endpoint | Notes |
| --- | --- | --- |
| `getProfile()` | `GET /v1/profile/view` | Own profile, including `dateOfBirth` (`YYYY-MM-DD`) |
| `updateProfile(changes)` | `PATCH /v1/profile/update` | Changed fields only; returns the updated profile |
| `requestEmailChange(newEmail)` | `POST /v1/profile/email/request` | Sends a 6-digit code to the new address; returns `{ message, expiresAt }` |
| `confirmEmailChange(code)` | `POST /v1/profile/email/confirm` | Applies the change; returns the updated profile |

The frontend uses the API's field names, including `class`, so no mapping is needed. `EditableProfileField` lists the six fields the API accepts: `firstName`, `lastName`, `phone`, `class`, `course`, `yearOfStudy`.

## The page

- **Personal details**: the six editable fields, with an Edit button that switches the card to `components/profile/profile-details-form.tsx`.
- **Email address**: the sign-in email, with "Change email" (`components/profile/email-change-card.tsx`).
- **Membership**: Fellowship ID, membership status, and date of birth. All read-only.

## Editing

- Only changed fields are sent. Values are trimmed before comparing, and Save is disabled while nothing changed. The API refuses an empty body.
- Only changed values are checked against the form rules (non-empty names, the phone format used at sign-up, a chosen course). Older stored values that don't meet today's rules therefore don't block editing other fields.
- Class, course, and year of study use the sign-up option lists (`lib/onboarding-options.ts`). Some stored values are not in those lists (for example "Bachelor Degree" for officers created by the open-year script). An unlisted stored value is added to its list as the current choice, so the member keeps it unless they choose another.
  - The stored course stays available only while the stored class is selected. Choosing another class keeps the course if the new class lists it, otherwise clears it.
- Length limits match the API: names 80, phone 32. Class, course, and year come from lists.
- A `400` shows the API's messages under the form. Other errors show a toast. A `401` signs out through the global handler.

## After saving

- The page shows the returned profile and a success toast.
- If the first or last name changed, the page calls `useRefreshCurrentActor()` so the dashboard header and home greeting show the new name. If that reload fails, a toast asks the member to reload the page; the save itself already succeeded.
- The Auth.js session keeps the name from sign-in. Nothing in the UI reads it, so it is not updated (see `docs/roadmap.md`).

## Email change

Email is the sign-in address, so the change only applies after the member enters a code sent to the new address.

1. **New address.** Checked with the sign-in email rules, and refused locally when it equals the current email. The API also normalises it to lowercase and refuses the current email.
2. **Code.** The card shows the new address and the code's expiry time, with the same code input as sign-in. "Resend code" asks again for the same address, which ends the earlier code. "Use a different email" returns to step 1.
3. **Done.** The page shows the returned profile and "Use {email} the next time you sign in", then reloads `/auth/me`.

Errors, by status:

| Status | Where | Meaning |
| --- | --- | --- |
| `400` on request | Under the email field | Invalid address, or already the member's email |
| `409` on request | Under the email field | The address belongs to another person |
| `429` on request or resend | Under the field, or a toast on resend | Too many requests in an hour |
| `503` on request or resend | Under the field, or a toast on resend | The code email could not be sent; the API's message is shown, because the member can retry |
| `400` on confirm | Under the code input | Wrong or expired code. After too many wrong codes the request ends and the member must resend |
| `409` on confirm | Under the code input | The address was taken in the meantime |

Other errors show a toast. A `401` signs out through the global handler.

After the change, the member stays signed in. The API ends unused sign-in codes sent to the old address and emails a notice to it. The Auth.js session keeps the old email, which nothing in the UI reads.

## Verification

- Type check and lint.
- Signed out, `/dashboard/profile` redirects to sign-in, and the API answers `401` to both profile routes.
- Manual: view the profile, edit a name and see the header update, edit class and course, and check that an officer with an unlisted class can save a phone change without changing the class.
- Manual: change the email with a code from the new inbox, sign out, and sign in with the new address.
