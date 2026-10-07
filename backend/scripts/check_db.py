"""Check the database connection (use it after setting DATABASE_URL, e.g. for Supabase)."""
from sqlalchemy import func, inspect, select, text

from app.database import DATABASE_URL, SessionLocal, engine
from app.models import User


def main() -> int:
    host = DATABASE_URL.split("@")[-1].split("/")[0] if "@" in DATABASE_URL else DATABASE_URL
    print(f"Connecting to {engine.dialect.name} ({host}) ...")
    with SessionLocal() as db:
        if engine.dialect.name == "postgresql":
            print(" server:", db.scalar(text("select version()")).split(",")[0])
        tables = inspect(engine).get_table_names()
        print(f" tables: {len(tables)}", "(run: alembic upgrade head)" if "users" not in tables else "")
        if "users" in tables:
            print(" users:", db.scalar(select(func.count()).select_from(User)))
        if engine.dialect.name == "postgresql" and "users" in tables:
            open_tables = [r[0] for r in db.execute(text(
                "select tablename from pg_tables where schemaname='public' and not rowsecurity "
                "and tablename <> 'alembic_version'"))]
            print(" tables WITHOUT row-level security:", open_tables or "none (good)")
    print("Connection OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
