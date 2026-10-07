---
description: Connect the kiosk frontend to this API
---
Work in the FRONTEND repo (src/api/http.ts). Follow docs/FRONTEND_WIRING.md exactly, one section at a time:
login + token, student pages, leave/OD, staff, HOD, notices. After each section run `npx tsc --noEmit`,
set VITE_USE_MOCK=false and VITE_API_URL, and test against the running backend. Do not change mock files.
