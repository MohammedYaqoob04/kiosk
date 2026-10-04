# KIOSK project rules (read before every task)

Project: touch-screen college kiosk + student ERP for Arunai Engineering College. Stack: React + TypeScript + Tailwind + shadcn/ui + TanStack Router (file routes in src/routes, alias @ = src). Backend (FastAPI + PostgreSQL) not built yet; use mock data only. All mock data is FAKE. Never add real student data.

## Working rules
- Make the smallest change that does the task. Extend existing files; do not duplicate or rewrite unrelated files.
- Do not touch src/assets/*.asset.json. Do not run `git add -A`. Do not commit package-lock.json.
- After changes, run `npx tsc --noEmit` and fix errors before finishing.
- Reply with: files changed, and how to test. No long explanations.

## Design (strict) - professional light kiosk theme
- Light, neutral, minimal. One accent color only. No gradients, no glow, no neon, no text-shadow, no blur, no decorative shapes, no floating/pulsing cards, no per-portal colors.
- Tokens (define ONCE in the global CSS/tokens file, use everywhere, never hard-code hex in components):
  --bg #F7F5F2 (page), --surface #FFFFFF, --surface-2 #F0EDE8, --border #E2DDD6,
  --text #1C1917, --text-muted #57534E,
  --accent #0F766E (primary buttons, focus rings, active states), --accent-hover #115E59, --on-accent #FFFFFF,
  status only: --ok #15803D, --danger #B91C1C. "Pending" uses neutral outline badge (text color + border), not yellow.
- Cards: white surface, 1px --border, rounded-xl, at most a very light shadow (0 1px 2px rgba(0,0,0,0.06)).
- Focus ring: solid 2px --accent. Buttons: solid --accent, white text, rounded-lg. Secondary buttons: white with --border.
- Fonts: Inter for everything; headings semi-bold. Lucide icons strokeWidth 1.5, color --text-muted or --accent.
- Remove stray blue/yellow/amber/gray/slate/purple/plum/gradient classes and old plum tokens everywhere.
- Touch hit areas >= 56px with compact visuals. Use svh, never vh. Motion: opacity only, 200-300ms, inside prefers-reduced-motion: no-preference.
- Login screens: exactly one screen high, no scrolling, submit always visible. ERP pages do not scroll on desktop (>=1024px); long tables scroll in their own panel with sticky header.

## Kiosk rules
- No physical keyboard: every input must work with the on-screen keypad. Idle timers: ERP 2 min (10 s warning with "Stay signed in"), login 60 s, menu 90 s.
- Manual logout goes to /erp using replace navigation.

## ERP domain rules
- Student username: exactly 12 digits, must start with 5104 (regex ^5104\d{8}$), e.g. 510423243001. Password: ddmm (4 digits).
- Leave/OD flow: Student -> Counsellor -> HOD. Counsellor reject = final, never reaches HOD. Rejection by counsellor or HOD REQUIRES a reason (min 10 chars). OD requires an uploaded official letter.
- Test sizes: 1920x1080, 1366x768, 390x844, 844x390.