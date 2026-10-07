---
description: Change the database schema
---
1. Edit app/models.py only.
2. `alembic revision --autogenerate -m "<what changed>"`; open the new file in migrations/versions and read it.
3. `alembic upgrade head` on a throw-away SQLite file, then `alembic check` (must say no new operations).
4. Update tests/conftest.py fixtures if needed; run `python -m pytest -q`.
5. If a table was added, add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` to that migration (PostgreSQL only).
6. Never edit a migration that was already applied; add a new one.
