# KIOSK project rules (read before every task)

Project: touch-screen college kiosk + student ERP for Arunai Engineering College. Stack: React + TypeScript + Tailwind + shadcn/ui + TanStack Router (file routes in src/routes, alias @ = src). Backend (FastAPI + PostgreSQL) not built yet; use mock data only. All mock data is FAKE. Never add real student data.

## Working rules

- Make the smallest change that does the task. Extend existing files; do not duplicate or rewrite unrelated files.
- Do not touch src/assets/*.asset.json. Do not run `git add -A`. Do not commit package-lock.json.
- After changes, run `npx tsc --noEmit` and fix errors before finishing.
- Reply with: files changed, and how to test. No long explanations.

## Design (strict) - immersive Home, professional light ERP

- Public Home (/) is a scrolling website page; all rules about no-scroll apply to login and ERP pages only.
- Home is a dark, immersive screen; all other pages are light, neutral, and minimal. Use one brick-maroon accent. No neon, blur, text-shadow, decorative shapes, floating/pulsing cards, or per-portal colors.
- Tokens (define ONCE in the global CSS/tokens file, use everywhere, never hard-code hex in components):
  --bg-base #F6EFE8, --surface #FFFFFF, --surface-2 #EFE6DC, --border #E3D6CA,
  --text #1F1416, --text-muted #5E4F52,
  --accent #8B1E2D, --accent-hover #721824, --on-accent #FFFFFF,
  --bg-tint-1 #EBD3CF, --bg-tint-2 #F2DFCF, --bg-tint-3 #F4E6E2,
  --home-1 #1B0B10, --home-2 #2A0E16, --home-3 #3A121C,
  --home-text #F6EEE6, --home-muted #CDBFB8, --home-copper #7A3B2A,
  status only: --ok #15803D, --danger #B91C1C. "Pending" uses neutral outline badge (text color + border), not yellow.
- Cards: white surface, 1px --border, rounded-xl, at most a very light shadow (0 1px 2px rgba(0,0,0,0.06)).
- Focus ring: solid 2px --accent. Buttons: solid --accent, white text, rounded-lg. Secondary buttons: white with --border.
- Fonts: Inter for UI and ERP pages; Sora semi-bold for the Home college heading. Lucide icons strokeWidth 1.5, color --text-muted or --accent.
- Remove stray blue/yellow/amber/gray/slate/purple/plum/green/teal/mint classes and old plum tokens everywhere.
- Touch hit areas >= 56px with compact visuals. Use svh, never vh. Motion: opacity only, except Home's slow ambient background transforms; 200-300ms, inside prefers-reduced-motion: no-preference.
- Login screens: exactly one screen high, no scrolling, submit always visible. ERP pages do not scroll on desktop (>=1024px); long tables scroll in their own panel with sticky header.

## Kiosk rules

- No physical keyboard: every input must work with the on-screen keypad. Idle timers: ERP 2 min (10 s warning with "Stay signed in"), login 60 s, menu 90 s.
- Manual logout goes to /erp using replace navigation.

## ERP domain rules

- Student username: exactly 12 digits, must start with 5104 (regex ^5104\d{8}$), e.g. 510423243001. Password: ddmm (4 digits).
- Leave/OD flow: Student -> Counsellor -> HOD. Counsellor reject = final, never reaches HOD. Rejection by counsellor or HOD REQUIRES a reason (min 10 chars). OD requires an uploaded official letter.
- Test sizes: 1920x1080, 1366x768 (touch kiosk only; mobile later)
