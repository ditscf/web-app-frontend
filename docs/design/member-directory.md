# Frontend: Member directory

Consumes backend step 10c. Design authority: backend `docs/design/member-directory.md`. Access: `lib/auth/access.ts`. Charts: shadcn Chart + Recharts (`docs/design/ui-components.md`).

## Visibility

`canViewMemberDirectory(actor)` mirrors `member.viewDirectory`: onboarded, operative year present, and office is Chairman, Vice Chairman, General Secretary, or Vice General Secretary. Ministry Leaders do not see the nav item.

## UI

| Piece | Where |
| --- | --- |
| Route | `/dashboard/members` |
| Nav | “Members” in the dashboard sidebar when `canViewMemberDirectory` |
| Feature | `components/members/member-directory.tsx` |
| API | `lib/api/members.ts` — `listMembers`, `getMemberSummary` |

Layout: search field, status filter, onboarded filter, three bar charts from `/members/summary`, then a table of name + Fellowship ID from `/members/list`. Filters apply to both requests. Direct visits without access show the no-access state.

## Charts

Use the shadcn `Chart` wrapper and Recharts `BarChart`. Three series from the summary: by status, by onboarded, by year of study. Do not invent table columns for chart dimensions.
