"""Lock the tables on Supabase: enable row-level security, close the public Data API.

The backend connects as the database owner (bypasses RLS). Nothing in this project uses Supabase's public
REST "Data API", so the anon and authenticated roles must get NO access. PostgreSQL only; a no-op on SQLite.
Rule for the future: every migration that adds a table must also ENABLE ROW LEVEL SECURITY on it.
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_enable_rls"
down_revision = "ead8ea23334b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    for table in sa.inspect(bind).get_table_names(schema="public"):
        if table != "alembic_version":
            op.execute(sa.text(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY'))
    op.execute(sa.text("""
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
          END IF;
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
          END IF;
        END $$;
    """))


def downgrade() -> None:
    pass  # never re-open the tables
