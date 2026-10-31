from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

now = lambda: datetime.now(timezone.utc)
SPECIALIZATIONS = ["Medical", "Fire", "Flood", "General Rescue"]


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (UniqueConstraint("name", name="uq_teams_name"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    specialization: Mapped[str] = mapped_column(String(24), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    members: Mapped[int] = mapped_column(default=0)
    contact: Mapped[str | None] = mapped_column(String(64))
    availability: Mapped[str] = mapped_column(String(12), default="Available")  # Available|Busy|Offline
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)  # demo teams, not real units
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="team")


class Assignment(Base):
    __tablename__ = "assignments"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), index=True)
    assigned_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(12), default="Assigned")  # Assigned|En Route|On Scene|Completed|Cancelled
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    incident: Mapped["Incident"] = relationship(back_populates="assignments")
    team: Mapped[Team] = relationship(back_populates="assignments")
