from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base

now = lambda: datetime.now(timezone.utc)


class SafetyGuidance(Base):
    __tablename__ = "safety_guidance"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(40), index=True)
    language: Mapped[str] = mapped_column(String(8), index=True)
    short_description: Mapped[str] = mapped_column(String(500))
    instructions: Mapped[list] = mapped_column(JSON)
    source_name: Mapped[str] = mapped_column(String(160))
    source_url: Mapped[str] = mapped_column(String(500))
    verification_status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
