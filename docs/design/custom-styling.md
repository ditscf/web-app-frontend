# Custom Styling Still in Use

The DITSCF styling that remains outside stock shadcn (see `docs/design/ui-components.md`). It is kept until the visual design is chosen; then each item is kept, moved into the shadcn theme, or removed.

`components/ui/` uses none of it. Everything below is in `app/globals.css` and in the routes and feature components. Standard Tailwind colours such as `slate-*`, `red-*`, and `emerald-*` are not listed; they are not custom.

Checked on 2026-10-06.

## Custom classes

Defined in `app/globals.css`.

| Class | What it does | Used in |
| --- | --- | --- |
| `glass` | Frosted glass: translucent white background, light border, 24px background blur | `components/auth/auth-card.tsx`, `components/landing/hero.tsx` |
| `navy-grid` | Faint white grid lines drawn over a dark background | `app/auth/layout.tsx`, `components/landing/platform.tsx` |
| `section-shell` | Centred page column, at most 1180px wide with 16px side margins | `app/auth/layout.tsx` and 13 landing components: `about`, `contact`, `events`, `footer`, `gallery`, `header`, `hero`, `impact`, `leadership`, `ministries`, `platform`, `testimonials`, `values` |
| `mask-fade` | Fades the left and right edges to transparent | `components/landing/events.tsx` |

## Custom theme tokens

Defined in `@theme` in `app/globals.css`. Each one creates Tailwind classes, for example `--color-navy` creates `text-navy`, `bg-navy`, and `border-navy`.

| Token | Value | Used in |
| --- | --- | --- |
| `royal` colour | `#0f3d91` (blue) | See "By file" below |
| `gold` colour | `#f4b400` | See "By file" below |
| `navy` colour | `#07142f` (dark blue) | See "By file" below |
| `shadow-premium` | Large soft navy shadow | `components/auth/auth-card.tsx`, `components/landing/about.tsx`, `events.tsx`, `hero.tsx`, `platform.tsx` |
| `bg-royal-radial` | Gold and blue radial gradients | `app/auth/layout.tsx`, `components/landing/hero.tsx`, `platform.tsx` |
| `animate-marquee` | Endless horizontal scroll (24s), switched off for users who prefer reduced motion | `components/landing/events.tsx` |

## Page-wide rules

Also in `app/globals.css`. These apply to every page, and several override shadcn's theme.

| Rule | Effect |
| --- | --- |
| `:root` `color` and `background` | Sets the text and background colour directly, outside shadcn's `--foreground` and `--background` |
| `:root` `scroll-behavior: smooth` | Smooth scrolling for in-page links. Next.js warns about this in dev and suggests `data-scroll-behavior="smooth"` on `<html>` |
| `body` `background` | Gold radial glow and a white-to-pale-blue gradient. Overrides shadcn's `bg-background` |
| `body` `color` | `#0b1020`. Overrides shadcn's `text-foreground` |
| `body` `font-family` | Inter by name, then system fonts. Overrides the `next/font` Inter set as `font-sans` in `app/layout.tsx` |
| `body` `margin`, `min-width: 320px`, `overflow-x: hidden` | Layout defaults |
| `::selection` | Gold highlight with navy text when selecting text |
| `* { box-sizing: border-box }` | Already Tailwind's default, so it has no effect |
| Border compatibility in `@layer base` | Added by the Tailwind v4 upgrade to keep v3's grey default border colour. It is followed by shadcn's own `border-border` rule |

## Overrides on shadcn parts

Screens pass extra classes into shadcn parts, which changes their stock look. The main ones:

- **Placeholder style.** `placeholder:font-semibold placeholder:text-slate-400` on inputs in `sign-in-form.tsx`, `sign-up-form.tsx`, `email-change-card.tsx`, and `components/ministries/fellowship-id-field.tsx`.
- **Other `className` values** on `Button`, `Input`, `Card`, `Badge`, and similar parts in most screens (sizes, rounding, colours). Files with the most: `components/ministries/ministry-members.tsx`, `components/auth/sign-up-form.tsx`, `components/profile/my-profile.tsx`.

## By file

Custom classes and tokens each file uses.

| File | Uses |
| --- | --- |
| `app/auth/layout.tsx` | `navy-grid`, `section-shell`, `bg-royal-radial`, royal, gold, navy |
| `components/applications/applications-review.tsx` | navy |
| `components/auth/auth-card.tsx` | `glass`, `shadow-premium`, royal, navy |
| `components/auth/current-actor-provider.tsx` | navy |
| `components/auth/sign-in-form.tsx` | royal, gold, navy |
| `components/auth/sign-up-form.tsx` | royal, gold, navy |
| `components/dashboard/home-overview.tsx` | navy |
| `components/dashboard/needs-attention.tsx` | royal, gold, navy |
| `components/dashboard/no-access.tsx` | navy |
| `components/dashboard/sidebar.tsx` | royal, gold, navy |
| `components/landing/about.tsx` | `section-shell`, `shadow-premium`, royal, navy |
| `components/landing/contact.tsx` | `section-shell`, royal |
| `components/landing/events.tsx` | `section-shell`, `mask-fade`, `animate-marquee`, `shadow-premium`, gold, navy |
| `components/landing/footer.tsx` | `section-shell`, gold, navy |
| `components/landing/gallery.tsx` | `section-shell`, royal, gold, navy |
| `components/landing/header.tsx` | `section-shell`, gold, navy |
| `components/landing/hero.tsx` | `glass`, `section-shell`, `bg-royal-radial`, `shadow-premium`, royal, gold, navy |
| `components/landing/impact.tsx` | `section-shell`, royal |
| `components/landing/leadership.tsx` | `section-shell`, royal |
| `components/landing/ministries.tsx` | `section-shell`, royal |
| `components/landing/platform.tsx` | `navy-grid`, `section-shell`, `bg-royal-radial`, `shadow-premium`, royal, gold, navy |
| `components/landing/section-header.tsx` | gold, navy |
| `components/landing/testimonials.tsx` | `section-shell`, gold, navy |
| `components/landing/values.tsx` | `section-shell`, royal, gold |
| `components/ministries/appoint-leader-dialog.tsx` | navy |
| `components/ministries/ministries-overview.tsx` | royal, gold, navy |
| `components/ministries/ministry-members.tsx` | royal, navy |
| `components/onboarding/onboarding-form.tsx` | royal, gold, navy |
| `components/profile/email-change-card.tsx` | royal, gold, navy |
| `components/profile/my-profile.tsx` | royal, navy |

## Finding it again

```bash
rg "glass|navy-grid|section-shell|mask-fade|animate-marquee|bg-royal-radial|shadow-premium|-royal|-gold|-navy" app components --glob '!components/ui/**'
```
