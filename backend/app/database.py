"""Database engine and session. SQLite for local dev, PostgreSQL for production."""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings


def normalize_url(url: str) -> str:
    """Hosting providers hand out postgres:// or postgresql:// URLs; SQLAlchemy needs the driver name."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = normalize_url(get_settings().database_url)
_is_sqlite = DATABASE_URL.startswith("sqlite")
_kwargs: dict = {}
if _is_sqlite:
    _kwargs["connect_args"] = {"check_same_thread": False}
    if DATABASE_URL in ("sqlite://", "sqlite:///:memory:"):
        _kwargs["poolclass"] = StaticPool  # one shared in-memory DB (tests)
else:
    _kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **_kwargs)

if _is_sqlite:

    @event.listens_for(engine, "connect")
    def _fk_on(dbapi_conn, _record):  # SQLite ignores foreign keys unless asked
        dbapi_conn.execute("PRAGMA foreign_keys=ON")


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
