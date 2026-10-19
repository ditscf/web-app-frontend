# Frontend UI Components

Technical design for how the DITSCF-MS frontend builds its interface: the layers, the component library, and the styling setup. It does not set business rules (see `docs/analysis/requirements-analysis.md`).

## Layers

| Layer | Where | Responsibility |
| --- | --- | --- |
| Routes | `app/` | URLs, layouts, and thin pages. A page renders one feature component and holds no UI of its own, for example `app/dashboard/profile/page.tsx` renders `MyProfile`. |
| Feature components | `components/<feature>/` | DITSCF screens: forms, lists, dialogs, and their API calls. Built from UI parts. |
| UI parts | `components/ui/` | Generic shadcn parts such as `Button`, `Select`, and `AlertDialog`. No DITSCF logic. The code is copied into the project by the shadcn CLI, so the project owns it. |
| Primitives | `radix-ui` package | Behaviour and accessibility (open and close, keyboard, focus, screen readers) with no styling. UI parts are built on them. |
| Styling | Tailwind CSS v4, `app/globals.css` | Utility classes, plus shadcn's theme variables (`--background`, `--primary`, `--radius`, and so on). |

## Current setup

| Concern | Choice |
| --- | --- |
| Component library | shadcn (CLI 4.x) |
| shadcn style | `radix-sera` in `components.json`: the Radix engine with the Sera look |
| Theme preset | Applied via shadcn (`b1HFGqoWu`), then **manually remapped** to DITSCF brand roles in `app/globals.css` (see Brand token map below) |
| Primitives | `radix-ui`, the single Radix package |
| Verification code input | `input-otp`, the package shadcn uses with Radix (Radix has no OTP part) |
| Toasts | `sonner`, with `next-themes` for the light or dark theme |
| Icons | `lucide-react` (UI / feature); `react-icons` for brand/social marks Lucide no longer ships |
| Date picker | shadcn `Calendar` + `Popover` (Radix) + `react-day-picker` / `date-fns` — used on sign-up DOB |
| Class names | `cn` from `@/lib/utils`, which re-exports shadcn's `cn` package (it replaces `clsx` and `tailwind-merge`) |
| Variants | `class-variance-authority` |
| Animations | `tw-animate-css` |
| Tailwind | v4 through `@tailwindcss/postcss` (`postcss.config.js`). There is no `tailwind.config` file; theme values are in `app/globals.css`. |
| Font | Inter through `next/font` in `app/layout.tsx`, exposed as `--font-sans` |

## Brand token map (custom — re-apply after every preset)

DITSCF brand colors are mapped onto shadcn semantic tokens. There are **no** custom Tailwind color names (`royal`, `gold`, `navy`, etc.). Live site reference: [ditscf.com](https://ditscf.com) (`#0F3D91` royal, `#F4B400` gold, `#07142F` / `#0B1020` navy shells).

| Brand role | Hex (approx.) | shadcn token | Typical utilities |
| --- | --- | --- | --- |
| Gold / CTA | `#F4B400` | `--primary` | `bg-primary`, `text-primary`, `Button` default |
| Ink on gold | navy | `--primary-foreground` | `text-primary-foreground` on gold buttons only |
| Royal / links | `#0F3D91` | `--accent` | `bg-accent`, `text-accent`, outline / secondary brand actions |
| White on royal | `#fff` | `--accent-foreground` | `text-accent-foreground` |
| Navy shells | `#07142F` | `--sidebar` | `bg-sidebar`, hero / footer / auth / dashboard chrome |
| Light on navy | near-white | `--sidebar-foreground` | `text-sidebar-foreground` on navy shells |
| Gold on navy | `#F4B400` | `--sidebar-primary` | accents inside navy shells |
| Page / cards | light / white | `--background`, `--card` | page wash and elevated surfaces |
| Body ink | dark navy | `--foreground`, `--card-foreground` | default readable text |

### Why this mapping exists

shadcn presets treat `--primary` as the main brand fill. For DITSCF, the main **button** color is gold and the main **shell** color is navy. Mapping primary → gold and shells → `sidebar` keeps `Button` correct without painting the whole hero gold.

### Rules that survive a preset change

1. **Never use `bg-primary` / `from-primary` for large dark shells.** Use `bg-sidebar` / `from-sidebar`. Primary is gold.
2. **Never use `bg-primary-foreground` as a “white glass” overlay.** `--primary-foreground` is navy (ink on gold). Glass cards must use `bg-card` / `bg-card/92` with `text-card-foreground` and `text-muted-foreground`.
3. **Do not invent brand utilities** (`bg-royal`, `text-gold`, raw hex in components). Remap tokens in `:root` / `.dark` only.
4. After any command that rewrites `app/globals.css`, **re-apply the Brand token map** and landing helpers. Full inventory + checklist: `docs/design/custom-styling.md`.
5. Feature code should prefer semantic roles: CTA → `primary`, royal action → `accent`, dark chrome → `sidebar`, readable surface → `card` / `background`.

## Rules

- Add a part with `npx shadcn@latest add <name>`. Do not hand-write a part shadcn provides.
- Use the stock variants. `Button`: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. `Badge`: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
- **Do not override preset shape.** Sera is sharp-edged (`rounded-none` on Card, Button, inputs). Do not add `rounded-*` on Cards, card-like shells, or shadcn parts unless there is a strong product reason (document it). Radius comes from the preset / `--radius`, not feature CSS.
- Import primitives from `radix-ui`, not from `@base-ui/react` or individual `@radix-ui/react-*` packages.
- Import `cn` from `@/lib/utils`.
- Changing the look rewrites `components/ui/`, and often `app/globals.css` and the font in `app/layout.tsx`. Then typecheck and follow **`docs/design/custom-styling.md`** (restore brand map + landing CSS, smoke-check roles).

### Using the Radix parts

- **Select**: put `id` on `SelectTrigger`, not on `Select`, so the field's label focuses it. "Nothing chosen" is `''`, not `null`. `onValueChange` receives a `string`.
- **InputOTP**: pass `maxLength`, `value`, and `onChange`, and render one `InputOTPSlot` per digit inside `InputOTPGroup`. See `components/auth/sign-in-form.tsx`.
- **AlertDialog**: control it with `open` and `onOpenChange(isOpen)`.
- **Button**: use `asChild` to render a link that looks like a button.
