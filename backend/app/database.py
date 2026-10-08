"""Database engine and session. SQLite for local dev, PostgreSQL for production."""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool, StaticPool

from .config import get_settings


def normalize_url(url: str) -> str:
    """Hosting providers hand out postgres:// or postgresql:// URLs; SQLAlchemy needs the driver name."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def get_engine_kwargs(url: str, serverless: bool = False) -> dict:
    normalized = normalize_url(url)
    kwargs: dict = {}
    if normalized.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if normalized in ("sqlite://", "sqlite:///:memory:"):
            kwargs["poolclass"] = StaticPool  # one shared in-memory DB (tests)
    else:
        if serverless:
            kwargs["poolclass"] = NullPool
            kwargs["connect_args"] = {"prepare_threshold": None}
        else:
            kwargs["pool_pre_ping"] = True
    return kwargs


_settings = get_settings()
DATABASE_URL = normalize_url(_settings.database_url)
_is_sqlite = DATABASE_URL.startswith("sqlite")
_kwargs = get_engine_kwargs(DATABASE_URL, _settings.db_serverless)

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
