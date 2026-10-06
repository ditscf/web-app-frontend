# Frontend UI Components

Technical design for how the DITSCF-MS frontend builds its interface: the layers, the component library, and the styling setup. It does not set business rules (see `docs/analysis/requirements-analysis.md`) and does not decide the visual design, which is still open.

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
| Component library | shadcn (CLI 4.21) |
| shadcn style | `radix-vega` in `components.json`: the Radix engine with the Vega look |
| Primitives | `radix-ui`, the single Radix package |
| Verification code input | `input-otp`, the package shadcn uses with Radix (Radix has no OTP part) |
| Toasts | `sonner`, with `next-themes` for the light or dark theme |
| Icons | `lucide-react` |
| Class names | `cn` from `@/lib/utils`, which re-exports shadcn's `cn` package (it replaces `clsx` and `tailwind-merge`) |
| Variants | `class-variance-authority` |
| Animations | `tw-animate-css` |
| Tailwind | v4 through `@tailwindcss/postcss` (`postcss.config.js`). There is no `tailwind.config` file; theme values are in `app/globals.css`. |
| Font | Inter through `next/font` in `app/layout.tsx`, exposed as `--font-sans` |

## Rules

- Add a part with `npx shadcn@latest add <name>`. Do not hand-write a part shadcn provides.
- Use the stock variants. `Button`: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. `Badge`: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
- Import primitives from `radix-ui`, not from `@base-ui/react` or individual `@radix-ui/react-*` packages.
- Import `cn` from `@/lib/utils`.
- Changing the look rewrites every file in `components/ui/`, and also updates `app/globals.css` and the font in `app/layout.tsx`: `npx shadcn@latest init -b radix -p <style> -f --reinstall`. Then run the type check, because screens can depend on a part's props.

### Using the Radix parts

- **Select**: put `id` on `SelectTrigger`, not on `Select`, so the field's label focuses it. "Nothing chosen" is `''`, not `null`. `onValueChange` receives a `string`.
- **InputOTP**: pass `maxLength`, `value`, and `onChange`, and render one `InputOTPSlot` per digit inside `InputOTPGroup`. See `components/auth/sign-in-form.tsx`.
- **AlertDialog**: control it with `open` and `onOpenChange(isOpen)`.
- **Button**: use `asChild` to render a link that looks like a button.