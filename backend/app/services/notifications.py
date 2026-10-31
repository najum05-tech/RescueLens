from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import Notification, User


def notify_roles(db: Session, roles: tuple[str, ...], title: str, body: str | None = None, link: str | None = None):
    users = db.scalars(select(User).where(User.role.in_(roles), User.is_active.is_(True))).all()
    for user in users:
        db.add(Notification(user_id=user.id, title=title, body=body, link=link))


def notify_user(db: Session, user_id: int, title: str, body: str | None = None, link: str | None = None):
    db.add(Notification(user_id=user_id, title=title, body=body, link=link))
