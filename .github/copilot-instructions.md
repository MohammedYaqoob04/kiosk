


cat > .github/copilot-instructions.md
# KIOSK project rules

Stack: React + TypeScript + Tailwind + shadcn/ui, TanStack Router (file routes in src/routes).
Product: college website + student ERP for Arunai Engineering College. Touch screens/kiosk
and mobile only. No hardware keyboard.

Design:
- Dark, calm, professional. No neon, no glow, no text-shadow.
- Colors come from the CSS variable tokens. Never hard-code hex values in components.
- Fonts: Sora (headings), Inter (body).

Touch rules:
- Tap targets >= 56px, text >= 18px.
- No hover-only actions. Dropdowns open on tap.
- Number entry uses the on-screen keypad component, not the system keyboard.

Code rules:
- One component per file in src/components. Types in src/types. Mock data in src/mock.
- Use <Link> from TanStack Router for internal navigation.
- Never invent real student data, names, marks or college facts. Use obvious placeholders.
- Do not edit auth, env files, package.json or delete routes without asking first.
- Run the TypeScript check after every change and fix errors.
