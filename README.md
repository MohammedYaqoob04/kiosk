# Arunai Engineering College - Touch-Screen Kiosk & ERP (Monorepo)

Monorepo for Arunai Engineering College's on-campus touch kiosk system and student/staff ERP portal.

```
kiosk/
├── frontend/       # React 18, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui
├── backend/        # FastAPI, PostgreSQL (Supabase/Neon), SQLAlchemy, Alembic
└── README.md       # Monorepo documentation
```

---

## Architecture Overview

- **Frontend (`frontend/`)**: Touch-screen interface (1920x1080 and 1366x768) designed with on-screen touch keyboard layouts (numeric & full), campus navigation map, real-time timetable, notices, leave/OD approvals, and strict 2-minute kiosk idle timeouts.
- **Backend (`backend/`)**: REST API built with FastAPI and PostgreSQL. Implements role-based access (Student, Counsellor, HOD, Admin), password security policies, audit logging, serverless database connection handling (`NullPool`), and notice attachment validation.

---

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# Run migrations
alembic upgrade head

# Start development server (runs on http://localhost:8000)
uvicorn app.main:app --reload
```

Interactive API documentation is available at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install

# Start Vite development server (runs on http://localhost:8080)
npm run dev
```

---

## Environment Configuration

### Frontend (`frontend/.env`)
```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_MAP_ID=your_map_id
```

### Backend (`backend/.env`)
```env
ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_SERVERLESS=false
SECRET_KEY=your-32-character-secret-key
CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:3000
INITIAL_PASSWORD_FORMAT=ddmm
ATTENDANCE_MIN_PERCENT=75
```

---

## Deployment to Vercel

In Vercel, deploy two projects connected to this repository:

### 1. Backend Project (`kiosk-backend`)
- **Root Directory:** `backend`
- **Framework Preset:** `Other`
- **Environment Variables:**
  - `ENV`: `production`
  - `DATABASE_URL`: Your Supabase/Neon PostgreSQL pooler connection string
  - `DB_SERVERLESS`: `true`
  - `SECRET_KEY`: A random 32+ character string
  - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app`
  - `INITIAL_PASSWORD_FORMAT`: `ddmm`

### 2. Frontend Project (`kiosk-frontend`)
- **Root Directory:** `frontend`
- **Framework Preset:** `Vite` (or `Other`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist` (or `.output/public`)
- **Environment Variables:**
  - `VITE_USE_MOCK`: `false`
  - `VITE_API_URL`: `https://your-backend-domain.vercel.app`
  - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps JavaScript API key
  - `VITE_GOOGLE_MAP_ID`: Your Google Map ID

---

## Testing

```bash
# Run backend test suite (96 tests)
cd backend && . .venv/bin/activate && python -m pytest -q

# Run frontend tests and type checks
cd frontend && npx tsc --noEmit && npm test
```
