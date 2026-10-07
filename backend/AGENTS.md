# KIOSK backend rules (read before every task)

FastAPI + SQLAlchemy 2 + PostgreSQL (SQLite for local dev). Python 3.12. Serves the KIOSK touch-screen app
(college website + student ERP, AI&DS department first). Frontend repo: github.com/MohammedYaqoob04/kiosk.

## Run / test
- `python -m venv .venv && . .venv/bin/activate && pip install -r requirements-dev.txt`
- `alembic upgrade head`, then `python -m scripts.bootstrap_real ...` (see README), then `uvicorn app.main:app --reload`
- `python -m pytest -q` must stay green. Run it after EVERY change. Docs: http://localhost:8000/docs

## Structure
app/routers/* (HTTP only) -> app/services/* (rules, no HTTP) -> app/models.py. Config in app/config.py.
scripts/* = import, seed, create_staff. tests/* = one file per router.

## Hard rules
- The signed-in user comes from the token. NEVER trust a student id, register no or counsellorId from the client
  for "my data" endpoints. Out-of-scope records answer 404, not 403.
- Scope: student = own rows; counsellor = own assigned students; HOD = own department. Admin has no portal.
- Leave/OD: PENDING_COUNSELLOR -> PENDING_HOD -> APPROVED; counsellor reject = REJECTED_BY_COUNSELLOR (final, never
  reaches HOD); HOD reject = REJECTED_BY_HOD. Reject reason >= 10 chars. All transitions go through
  app/services/leave_workflow.py:next_status (one pure function). OD needs a PDF/JPG/PNG letter, max 2 MB.
- Uploads: validate by file CONTENT (magic bytes), never by name or browser type. Max 2 MB, max 3 per notice. Stored in the database (stored_files).
- Errors are always {code, message}. Responses are camelCase and `Cache-Control: no-store`.
- Passwords: bcrypt only. First login = date of birth ddmmyyyy (INITIAL_PASSWORD_FORMAT), forced change, 5 wrong tries = 15 min lock.
  Never log or return password hashes, tokens or personal data. audit_log is append-only (insert only).
- NEVER store Aadhaar, religion, community, blood group or parents' details. The importer ignores them on purpose.
- Supabase: every migration that adds a table must also `ENABLE ROW LEVEL SECURITY` on it (see migrations/versions/0002). Never use the anon/publishable key.
- DB changes only through Alembic: `alembic revision --autogenerate -m "..."`, read the file, then `alembic upgrade head`.
- Real student data lives in private_data/ (gitignored). Never commit it. All fixtures/mock data must be FAKE.
- Smallest change that does the task; extend files, do not rewrite unrelated ones. Add or update a test for every
  behaviour change. Do not edit .env, requirements.txt pins or migrations that were already applied.
- Reply with: files changed, test result, how to try it. No long explanations.
