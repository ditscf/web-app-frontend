# Frontend: GS-assisted registration

Technical design for the General Secretary registering a person on their behalf. The business rules are under "GS-assisted registration" in `docs/analysis/requirements-analysis.md`. The API side is in the backend project's `docs/design/assisted-registration.md`.

## Endpoint

`lib/api/applications.ts`:

| Function | Endpoint | Notes |
| --- | --- | --- |
| `registerAssistedApplication(request)` | `POST /v1/applications/assisted` | Same body as public sign-up (`class` for study class). Returns `{ applicationId, status: PENDING, submittedAt, expiresAt }` |

Requires a session and completed onboarding. Only the open-year General Secretary may call it (`member.registerAssisted`).

## Visibility

`canRegisterAssisted(actor)` in `lib/auth/access.ts`: onboarded, year OPEN, holds `GENERAL_SECRETARY`. Used for the "Register a member" button on the applications page.

## Applications page

`/dashboard/applications`, still gated by `canReviewApplications` (GS or VGS).

- While `canRegisterAssisted` and the form is closed, a **Register a member** button sits at the top right of the header.
- Opening it shows `components/applications/assisted-registration-form.tsx` instead of the queue. Cancel returns to the queue; success toasts, closes the form, and reloads the list.
- The form collects the same fields as public sign-up (name, date of birth, email, phone, class, course, year of study), in one card, with the same option lists and local checks.
- Creating the application counts as the GS step. The copy states that the VGS must still approve, and that the row expires in 48 hours.

Errors on submit:

| Status | Where | Meaning |
| --- | --- | --- |
| `400` / `409` | Under the form | Invalid fields, email already a member, a pending registration already waiting, or registration not open |
| `403` | Toast; form closes | Caller is no longer allowed to register assisted |
| `401` | Global sign-out | Session ended |

## Pending queue

`GET /v1/applications/list` includes `submissionSource` (`SELF` \| `GS_ASSISTED`) and `gsApprovalRecorded` (true when a GS decision exists, **or** the source is `GS_ASSISTED`).

- Assisted rows show a **Registered by GS** label and the status line "Registered by the General Secretary. Waiting for the Vice General Secretary."
- The GS sees no Approve button when `gsApprovalRecorded` is true (covers both a recorded GS decision and assisted rows).
- The VGS can approve assisted rows immediately. Completing approval creates the member and sends the activation email, as for self registrations.

Home "Needs your attention" counts still split on `gsApprovalRecorded`, so assisted rows count as waiting for the VGS. There is no separate home shortcut for assisted registration.

## Verification

- Type check and lint.
- As GS while OPEN: Register a member, submit, see the row labelled Registered by GS, no Approve for yourself.
- As VGS: Approve an assisted row and see membership created.
- As VGS or any non-GS: no Register button.
- While the year is CLOSED: GS still sees the queue, but not the Register button.
