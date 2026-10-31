import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import HTTPException, Request
from ..config import settings

ALGO = "HS256"


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode()[:72], hashed.encode())
    except ValueError:
        return False


def create_token(user_id: int, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": str(user_id), "role": role, "exp": exp}, settings.secret_key, algorithm=ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGO])


_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(limit: int, window: int):
    """In-memory per-IP limiter (fine for a single-process demo)."""
    def dep(request: Request):
        key = f"{request.url.path}:{request.client.host if request.client else 'x'}"
        q, t = _hits[key], time.time()
        while q and q[0] < t - window:
            q.popleft()
        if len(q) >= limit:
            raise HTTPException(429, "Too many requests. Try again later.")
        q.append(t)
    return dep
