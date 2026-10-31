from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas.user import LoginIn, RegisterIn, TokenOut, UserOut
from ..utils.permissions import current_user
from ..utils.security import create_token, hash_password, rate_limit, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201, dependencies=[Depends(rate_limit(10, 60))])
def register(body: RegisterIn, db: Session = Depends(get_db)):
    """Public registration always creates a citizen."""
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Email already registered")
    user = User(email=email, name=body.name, phone=body.phone, hashed_password=hash_password(body.password), role="citizen")
    db.add(user); db.commit()
    return TokenOut(access_token=create_token(user.id, user.role), user=user)


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limit(10, 60))])
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.hashed_password) or not user.is_active:
        raise HTTPException(401, "Invalid email or password")
    return TokenOut(access_token=create_token(user.id, user.role), user=user)


@router.post("/logout", status_code=204)
def logout(_: User = Depends(current_user)):
    """Tokens are stateless; the client discards its token."""


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user
