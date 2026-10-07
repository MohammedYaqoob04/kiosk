"""Quick start for local development: create all tables (SQLite or PostgreSQL).
For production use Alembic instead:  alembic upgrade head"""
from app.database import Base, engine
import app.models  # noqa: F401  (registers the tables)

if __name__ == "__main__":
    Base.metadata.create_all(engine)
    print("Tables created.")
