# Frontend — development recovery notes

Supplements [`docs/roadmap.md`](roadmap.md). Cross-repo context: [`../../docs/PROJECT_CONTEXT.md`](../../docs/PROJECT_CONTEXT.md) (workspace root, not in this Git repo).

Last updated: **8 Nov 2026**.

## Cursor chat references

| Transcript ID | Topics |
| --- | --- |
| `20ff79a6-1ec7-4d33-9b2e-ba57b0c43659` | Auth.js + API cookie, `/auth/me`, dashboard RBAC, applications/onboarding, profile & ministries consumption |
| `913cbfa5-3d46-48f1-9e3b-74a376855e85` | Sign-up flow, Tailwind v4; Base UI → shadcn/Radix; landing + dashboard UI revamp; assisted registration UI |
| `f0690b5e-2133-4ebf-919d-1adcb58ef8b8` | Radix vs Base UI; documenting UI stack; `custom-styling.md` |

Stored under Cursor’s local `agent-transcripts` for `Users-gilbertmunuo-Gilbert-apps-ditscf-ms-frontend`.

## Timeline (frontend-focused)

| When | Milestone |
| --- | --- |
| Oct 1 2026 | Auth pages, sign-up steps, sonner, onboarding-options |
| Oct 2–3 2026 | Auth.js integration, dashboard shell, applications queue |
| Oct 5–6 2026 | Profile, ministries, lookup; ministry rule fixes after backend update |
| Oct 6 2026 | Full shadcn/Radix migration (`docs/design/ui-components.md`) |
| Oct 19 2026 | GS-assisted form; dashboard UX pass; Vercel analytics/speed insights (`aa0a82e`) |

**Blocked:** all post-step-9 modules until backend ships Events (see roadmap **Blocked** section).

## Stack (current)

Documented in [`docs/design/ui-components.md`](design/ui-components.md): shadcn (Radix + Sera), Tailwind v4, brand tokens manually mapped in `app/globals.css` (re-apply after preset changes — see [`docs/design/custom-styling.md`](design/custom-styling.md)).

## Known limitations

- Auth.js session name/email may lag profile updates; screens use `/auth/me` (`docs/roadmap.md`).
- Landing “Events” section is marketing content only — not connected to Event Management APIs.

## Git snapshot (Nov 2026 inspection)

- Branch: `feature/member-events` → `origin/feature/member-events`
- Clean working tree aside from normal `.next` / dev artifacts
