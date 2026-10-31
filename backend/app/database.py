from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

_sqlite = settings.database_url.startswith("sqlite")
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False} if _sqlite else {})

if _sqlite:
    @event.listens_for(engine, "connect")
    def _fk_on(conn, _):  # enforce foreign keys in SQLite
        conn.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def ensure_compatibility_schema():
    """Add columns introduced after the initial SQLite demo schema.

    Existing data is preserved. Fresh databases are still initialized by
    Base.metadata.create_all in the application lifespan.
    """
    if not _sqlite:
        return
    additions = {
        "reports": {"embedding": "JSON", "embedding_model": "VARCHAR(100)"},
        "teams": {"description": "TEXT", "created_at": "DATETIME", "updated_at": "DATETIME"},
        "assignments": {"updated_at": "DATETIME"},
    }
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, columns in additions.items():
            if not inspector.has_table(table):
                continue
            existing = {column["name"] for column in inspector.get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
