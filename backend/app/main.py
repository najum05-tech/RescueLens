from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from .config import settings
from .database import Base, SessionLocal, engine, ensure_compatibility_schema
from . import models  # noqa: F401  (register tables)
from .models import User
from .routes import auth, users, operations
from .utils.security import hash_password


def seed_staff():
    """Create the initial admin/operator accounts from env vars if missing."""
    with SessionLocal() as db:
        for email, pw, role, name in [
            (settings.seed_admin_email, settings.seed_admin_password, "admin", "Administrator"),
            (settings.seed_operator_email, settings.seed_operator_password, "operator", "Operator"),
        ]:
            if not db.scalar(select(User).where(User.email == email.lower())):
                db.add(User(email=email.lower(), name=name, hashed_password=hash_password(pw), role=role))
        db.commit()


@asynccontextmanager
async def lifespan(_):
    Base.metadata.create_all(engine)  # schema initialization (SQLite)
    ensure_compatibility_schema()
    seed_staff()
    yield


app = FastAPI(title="RescueLens AI API", version="1.0.0", lifespan=lifespan)
cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
for origin in tuple(cors_origins):
    if origin.startswith("http://localhost:"):
        cors_origins.append(origin.replace("http://localhost:", "http://127.0.0.1:"))
    elif origin.startswith("http://127.0.0.1:"):
        cors_origins.append(origin.replace("http://127.0.0.1:", "http://localhost:"))
app.add_middleware(CORSMiddleware, allow_origins=list(dict.fromkeys(cors_origins)),
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(operations.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
