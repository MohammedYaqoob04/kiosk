# KIOSK backend (FastAPI + PostgreSQL)

Rules for AI agents: `AGENTS.md`. Frontend connection table: `docs/FRONTEND_WIRING.md`. Every endpoint: `docs/openapi.json`
(live at http://localhost:8000/docs while running).

## 1. First run on your laptop (SQLite, real data)
```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head                       # creates the tables
cp /path/to/your/61-students.xlsx private_data/students.xlsx
python -m scripts.bootstrap_real --students private_data/students.xlsx --staff private_data/staff.json --dry-run   # check
python -m scripts.bootstrap_real --students private_data/students.xlsx --staff private_data/staff.json             # do it
uvicorn app.main:app --reload              # http://localhost:8000/docs
```
Logins afterwards: **students** = register number + date of birth `ddmmyyyy` (typing `14-05-2006` also works);
**staff** = the usernames in `private_data/staff.json`. Everyone must choose a new password at first login.
If there is exactly one counsellor, every student is assigned to them automatically.
`private_data/` is gitignored: never commit it. `scripts/seed_demo.py` is FAKE data for tests only, never for real use.

## 2. Move the database to Supabase (PostgreSQL)
1. supabase.com -> **New project** (save the database password; pick the nearest region).
2. Click **Connect** -> **Session pooler** -> copy the URI (host `aws-...pooler.supabase.com`, port 5432, user
   `postgres.<project-ref>`). Use the pooler: the "direct" string is IPv6-only and fails on many home networks.
3. Put it in `.env`: `DATABASE_URL=postgresql://postgres.<ref>:<PASSWORD>@aws-...pooler.supabase.com:5432/postgres`
   (encode special characters in the password: `@` -> `%40`, `#` -> `%23`).
4. `python -m scripts.check_db` -> should say "Connection OK".
5. `alembic upgrade head` (creates all tables and turns on row-level security), then repeat the `bootstrap_real` commands.
6. Supabase dashboard -> Project Settings -> Data API -> turn it **OFF** (this app never uses it). Never use the anon or
   publishable key anywhere. Run `python -m scripts.check_db` again: "tables WITHOUT row-level security: none (good)".
Uploaded files (OD letters, notice attachments) are stored in the database (table `stored_files`, max 2 MB each).

## 3. Excel uploads
- CLI: `python -m scripts.import_students private_data/students.xlsx --dry-run`, then again without `--dry-run`.
- In the app: the HOD uses `POST /api/v1/hod/students/import` (an "Upload students" page, from a laptop or phone).
All-or-nothing: any bad row is listed by number and nothing is written. Register numbers must be unique, 12 digits
starting with 5104. Aadhaar, religion, community, blood group and parents' details are ignored on purpose.
Re-uploading updates details but never resets a password or a counsellor assignment.

## 4. Tests
`python -m pytest -q` (84 tests). Against PostgreSQL: `DATABASE_URL=postgresql://... python -m pytest -q` (not run yet).

## 5. Deploy (later)
Render/Railway: build `pip install -r requirements.txt && alembic upgrade head`; start
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set ENV=production, DATABASE_URL (Supabase pooler), a random
SECRET_KEY (32+ chars), CORS_ORIGINS (your frontend URL). Production refuses SQLite and the dev secret. Serve over HTTPS.

## Known gaps
- No importers yet for timetable, attendance, marks, fees, results (need the college's file formats).
- GPA is `null` until the college gives credits and the grade scale. Assignment PDF layout is a placeholder.
- Add per-IP rate limiting at the proxy before launch (accounts already lock after 5 wrong passwords for 15 minutes).
- Photos, QR login/PDF, Tamil/English, payments: not built.
