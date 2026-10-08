from sqlalchemy.pool import NullPool, StaticPool

from app.config import Settings
from app.database import get_engine_kwargs, normalize_url


def test_db_serverless_setting_default():
    s = Settings()
    assert s.db_serverless is False


def test_db_serverless_setting_from_env(monkeypatch):
    monkeypatch.setenv("DB_SERVERLESS", "true")
    s = Settings()
    assert s.db_serverless is True

    monkeypatch.setenv("DB_SERVERLESS", "false")
    s2 = Settings()
    assert s2.db_serverless is False


def test_postgres_engine_kwargs_serverless():
    pg_url = "postgresql://user:pass@localhost:5432/dbname"
    kwargs = get_engine_kwargs(pg_url, serverless=True)
    assert kwargs.get("poolclass") is NullPool
    assert kwargs.get("connect_args") == {"prepare_threshold": None}
    assert "pool_pre_ping" not in kwargs


def test_postgres_engine_kwargs_regular():
    pg_url = "postgresql://user:pass@localhost:5432/dbname"
    kwargs = get_engine_kwargs(pg_url, serverless=False)
    assert kwargs.get("pool_pre_ping") is True
    assert "poolclass" not in kwargs
    assert "connect_args" not in kwargs


def test_sqlite_engine_kwargs_unchanged():
    sqlite_url = "sqlite:///./kiosk.db"
    kwargs_regular = get_engine_kwargs(sqlite_url, serverless=False)
    kwargs_serverless = get_engine_kwargs(sqlite_url, serverless=True)
    assert kwargs_regular == kwargs_serverless
    assert kwargs_regular["connect_args"] == {"check_same_thread": False}
    assert "poolclass" not in kwargs_regular

    mem_url = "sqlite:///:memory:"
    mem_regular = get_engine_kwargs(mem_url, serverless=False)
    mem_serverless = get_engine_kwargs(mem_url, serverless=True)
    assert mem_regular == mem_serverless
    assert mem_regular["poolclass"] is StaticPool
