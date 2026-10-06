# Arunai Engineering College - Touch-Screen Kiosk & Student ERP

Touch-screen college kiosk and student/staff ERP system for Arunai Engineering College. Built with React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Router, and TanStack React Query.

Designed for on-campus touch kiosks (1920x1080, 1366x768) with on-screen touch keyboard layouts (numeric & full), strict idle timeouts, and automatic in-memory cache clearing for privacy.

---

## Running Frontend + Backend Together

### 1. Environment Configuration

Create or verify `.env` in the repository root:

```sh
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

- `VITE_USE_MOCK=false`: Disables mock mode so the application runs exclusively against the backend API.
- `VITE_API_URL`: Points to the FastAPI backend server (default: `http://localhost:8000`).

### 2. Start the Backend (FastAPI)

Ensure your PostgreSQL database is running and configured, then start the FastAPI application:

```sh
# Navigate to backend directory and activate virtual environment
cd /path/to/backend
source .venv/bin/activate

# Start backend on port 8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend serves API endpoints at `http://localhost:8000/api/v1`.

### 3. Start the Frontend (Vite)

In a separate terminal, install dependencies and start the Vite development server:

```sh
cd /home/yaqoob/kiosk
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Authentication & Access

| Portal | Identifier | Credentials | Details |
|---|---|---|---|
| **Student** | 12-digit register number (`^5104\d{8}$`) | Date of birth (`ddmmyyyy` or `dd-mm-yyyy`) | First login requires immediate password change before accessing dashboard services. |
| **Staff / Counsellor** | Staff ID (e.g. `STAFF-AI-104`) | Staff password | Access to student rosters, leave/OD approvals, and announcements. |
| **HOD** | HOD Staff ID | HOD password | Department overview, multi-level approvals, counsellor assignment, student Excel import, and audit log. |

---

## Privacy & Kiosk Security

- **In-Memory Cache Clearing:** Both manual logout and idle timeouts (2 minutes with 10-second warning) immediately clear TanStack Query cache (`queryClient.clear()`), in-memory session tokens, and wipe all `localStorage` and `sessionStorage` keys.
- **On-Screen Keyboard:** Virtual keyboard supporting numeric and full layouts with on-screen toggles, hyphens, and password mask controls for touch-screen operation without physical keyboards.

---

## Verification & Testing

```sh
# Type-check TypeScript codebase
npx tsc --noEmit

# Run unit and integration tests
npm test
```
