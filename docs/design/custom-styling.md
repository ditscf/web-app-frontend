# Custom Styling & Preset Changes

What in this frontend is **not** stock shadcn, and what to do when switching UI presets/styles.

Related: `docs/design/ui-components.md` (stack, brand token map, component rules).

## Goal

Prefer shadcn presets for look and feel. Feature screens should use semantic tokens (`primary`, `accent`, `sidebar`, `card`, …), not hard-coded brand colors.

A single CLI command that rewrites `components/ui/` and `app/globals.css` will **not** fully restyle the app until the items below are restored or removed.

## What is custom today

### 1. Brand token map (`app/globals.css` → `:root` / `.dark`)

DITSCF colors are mapped onto shadcn tokens (not custom Tailwind color names like `royal` / `gold` / `navy`):

| Brand role | Approx. hex | Token |
| --- | --- | --- |
| Gold CTA | `#F4B400` | `--primary` |
| Ink on gold | navy | `--primary-foreground` |
| Royal / links | `#0F3D91` | `--accent` |
| Navy shells | `#07142F` | `--sidebar` |
| Gold on navy | `#F4B400` | `--sidebar-primary` |

**Why:** Presets treat `--primary` as the main fill. DITSCF uses gold for buttons and navy for hero/footer/auth/dashboard chrome. Shells use `bg-sidebar`, not `bg-primary`.

`--radius` is `0` so square corners stay even if a utility uses a radius token. Sera components also set `rounded-none`. Re-set `--radius: 0` after a preset rewrite if the new theme restores a larger radius and you still want sharp corners.

Documented also in `ui-components.md` → Brand token map. Comments at the top of `:root` in `globals.css` must stay.

### 2. Landing / auth CSS helpers (`app/globals.css`)

| Name | Purpose | Used in |
| --- | --- | --- |
| `.navy-grid` | Faint blueprint grid on dark shells | `components/landing/platform.tsx`, `app/auth/layout.tsx` |
| `bg-brand-radial` (`--background-image-brand-radial`) | Soft gold + royal wash over navy | same |
| `.mask-fade` | Fade left/right edges of the gallery strip | `components/landing/events.tsx` |
| `animate-marquee` | Endless horizontal scroll (respects `prefers-reduced-motion`) | `components/landing/events.tsx` |

These are **not** part of shadcn. Theme/preset rewrites that replace `globals.css` delete them unless you paste them back.

### 2b. Interactive pointer cursor (`app/globals.css` `@layer base`)

Sera `Button` renders a native `<button>` without `cursor-pointer` (landing CTAs often use `asChild` + `Link`, which already show a pointer). A small **base** block sets `cursor: pointer` on `button`, `[data-slot="button"]`, and `[data-slot="sidebar-menu-button"]`. Re-add after a preset wipe. `components/ui/button.tsx` and `sidebar.tsx` menu buttons also include `cursor-pointer` in their CVA bases so a UI reinstall stays consistent.

### 3. Feature-level overrides (not in `components/ui/`)

These stay when you reinstall UI parts; they can fight a new preset’s defaults:

| Area | Override | File(s) |
| --- | --- | --- |
| Featured Event badge | Filled gold (`bg-primary px-2…`) — Sera default badge is text-only | `components/landing/events.tsx` |
| Sign-up date of birth | Calendar + Popover trigger styled like underline `Input` | `components/auth/sign-up-form.tsx` |
| Footer socials | Ghost, no fill, `normal-case` (Sera buttons are uppercase). Icons are `react-icons` (`FaInstagram`, `FaYoutube`) | `components/landing/footer.tsx` |
| Section titles | Shared scale in `SectionHeader`: small uppercase eyebrow (`tracking-widest`), title `text-3xl` / `md:text-4xl` | `components/landing/section-header.tsx` |
| Dashboard / forms cards | Often `shadow-none` on `Card` | dashboard, profile, ministries, applications, onboarding |
| Landing chrome | Glass, gradients, framer-motion, navy sections | `components/landing/*`, `auth-card.tsx` |

No raw hex/rgb in feature TSX; brand color comes from tokens.

### 4. Small UI lock (optional note)

`components/ui/card.tsx` includes an explicit `rounded-none` so Cards stay sharp with Sera. A style reinstall may change Card again — re-check radius after switching.

## What a preset / style change does

Typical command (style name varies):

```bash
npx shadcn@latest init -b radix -p <style> -f --reinstall
```

Or theme/preset flows that rewrite `app/globals.css`.

| Touched | Effect |
| --- | --- |
| `components/ui/*` | Replaced with the new style (Button, Card, Input, …) |
| `app/globals.css` | Often overwritten — brand map + landing helpers **lost** |
| `app/layout.tsx` font | May be reset |
| Feature screens (`components/landing/*`, etc.) | **Not** rewritten — still use your classNames and token roles |

## Checklist: changing presets

Do this every time you switch style or apply a theme that rewrites CSS.

1. **Run the shadcn command** for the new style/preset (see CLI docs for the current flags).
2. **Typecheck** — prop/API differences in UI parts can break screens:
   ```bash
   npx tsc --noEmit
   ```
3. **Restore brand tokens** in `app/globals.css` `:root` and `.dark` (table above + comments in that file). Confirm:
   - primary = gold CTA  
   - accent = royal  
   - sidebar = navy shells  
4. **Restore landing helpers** if still used: `.navy-grid`, `bg-brand-radial` / `--background-image-brand-radial`, `.mask-fade`, `animate-marquee` (+ reduced-motion rule). Copy from git history or this doc’s inventory if the file was wiped.
5. **Smoke-check roles** (not just “CSS loaded”):
   - Join Fellowship / primary buttons → gold, not navy  
   - Hero, footer, auth, dashboard nav → navy shells (`bg-sidebar`)  
   - Find Your Team / royal actions → accent  
   - Featured Event badge still readable (may need the `bg-primary` className)  
   - Platform / auth still show grid + radial if desired  
   - Events gallery still marquee-scrolls  
6. **Scan feature overrides** that assume the old look (`normal-case`, `shadow-none`, underline inputs, filled Badge). Adjust only if the new preset makes them wrong.
7. **Do not reintroduce** `bg-royal`, `text-gold`, `bg-navy`, or raw brand hex in components. Remap tokens only.
8. **Update this file** if you add/remove a custom helper or change the brand map.

## One-command expectation (honest)

| Expectation | Reality |
| --- | --- |
| One cmd restyles all shadcn parts | Yes (`components/ui/*`) |
| One cmd keeps DITSCF brand | No — re-apply token map |
| One cmd keeps platform grid / marquee | No — re-add helpers |
| Landing “just works” on any preset | Only if new preset’s token **roles** match gold/royal/navy mapping |

Until brand tokens live only in a preset you control (or a post-install script restores `globals.css` fragments), treat steps 3–5 as required after every style change.

## Finding custom bits again

```bash
# Landing / auth helpers
rg "navy-grid|mask-fade|animate-marquee|bg-brand-radial" app components

# Brand comments / map
rg "DITSCF brand|Brand token" app/globals.css docs/design

# Avoid regressions to old color names
rg "\\b(text|bg|border)-(royal|gold|navy)\\b|shadow-premium|section-shell|\\bglass\\b" app components --glob '!components/ui/**'
```

Checked against the codebase as of the Sera + DITSCF token work. Update the date/inventory when the map or helpers change.
