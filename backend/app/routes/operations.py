from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Assignment, DuplicateSuggestion, Incident, Notification, Report, SafetyGuidance, Team, User
from ..services.notifications import notify_roles, notify_user
from ..utils.permissions import current_user, require_admin, require_operator, optional_user

router = APIRouter(prefix="/api", tags=["operations"])
TEAM_SPECIALIZATIONS = ("Medical", "Fire", "Flood", "General Rescue")
TEAM_STATUSES = ("Available", "Busy", "Unavailable")
ASSIGNMENT_STATUSES = ("Assigned", "Accepted", "En Route", "On Scene", "Completed", "Cancelled")
GUIDANCE_CATEGORIES = ("Flood Safety", "Fire Safety", "Earthquake Safety", "Road Accident Safety", "First Aid", "Emergency Preparedness")


def public_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:8].upper()}"


def incident_out(i: Incident):
    active = next((assignment for assignment in (i.assignments or []) if assignment.status not in ("Completed", "Cancelled")), None)
    return {"id": i.public_id, "database_id": i.id, "type": i.category, "category": i.category, "description": i.summary or "",
            "location": i.location_text or "", "lat": i.lat, "lng": i.lng, "status": i.status, "priority": i.priority,
            "verified": i.verified, "time": i.created_at.isoformat(), "teamId": active.team_id if active else None, "reports": len(i.reports or [])}


def team_out(t: Team, assignments=None):
    return {"id": t.id, "name": t.name, "spec": t.specialization, "specialization": t.specialization,
            "description": t.description, "members": t.members, "contact": t.contact, "availability": t.availability,
            "lat": t.lat, "lng": t.lng, "location": None, "isActive": t.is_active, "isSimulated": t.is_simulated,
            "createdAt": t.created_at.isoformat(), "updatedAt": t.updated_at.isoformat(),
            "assignments": assignments or []}


def haversine(a_lat, a_lng, b_lat, b_lng):
    if None in (a_lat, a_lng, b_lat, b_lng):
        return None
    dlat, dlng = radians(b_lat - a_lat), radians(b_lng - a_lng)
    value = sin(dlat / 2) ** 2 + cos(radians(a_lat)) * cos(radians(b_lat)) * sin(dlng / 2) ** 2
    return 6371 * 2 * asin(sqrt(value))


async def embed_text(text: str):
    if not settings.gemini_api_key:
        return None, None
    model = "models/text-embedding-004"
    url = f"https://generativelanguage.googleapis.com/v1beta/{model}:embedContent"
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.post(url, params={"key": settings.gemini_api_key}, json={"model": model, "content": {"parts": [{"text": text}]}})
            response.raise_for_status()
            return response.json().get("embedding", {}).get("values"), model
    except (httpx.HTTPError, ValueError, TypeError):
        return None, None


def cosine(a, b):
    if not a or not b or len(a) != len(b):
        return None
    dot = sum(x * y for x, y in zip(a, b))
    den = sqrt(sum(x * x for x in a) * sum(y * y for y in b))
    return dot / den if den else None


async def create_duplicate_suggestions(db: Session, report: Report, incident: Incident):
    vector, model = await embed_text(report.description)
    report.embedding, report.embedding_model = vector, model
    if not vector:
        report.analysis_status = "failed"
        return
    report.analysis_status = "done"
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    candidates = db.scalars(select(Report).where(Report.id != report.id, Report.embedding.is_not(None), Report.created_at >= cutoff)).all()
    seen = set()
    for candidate in candidates:
        if candidate.category and report.category and candidate.category != report.category:
            continue
        distance = haversine(report.lat, report.lng, candidate.lat, candidate.lng)
        if distance is not None and distance > 25:
            continue
        score = cosine(vector, candidate.embedding)
        if score is None or score < 0.78 or not candidate.incident_id:
            continue
        key = (report.id, candidate.incident_id)
        if key in seen or db.scalar(select(DuplicateSuggestion).where(DuplicateSuggestion.report_id == report.id, DuplicateSuggestion.incident_id == candidate.incident_id)):
            continue
        seen.add(key)
        db.add(DuplicateSuggestion(report_id=report.id, incident_id=candidate.incident_id, score=score,
                                   reason=f"Multilingual embedding similarity {score:.0%}; candidate filtered by time, category, and location."))
    notify_roles(db, ("operator", "admin"), "Possible duplicate detected", f"Report {report.public_id} has a semantic duplicate suggestion.", "/intelligence")


@router.get("/incidents")
def list_incidents(status: str | None = None, category: str | None = None, priority: str | None = None, db: Session = Depends(get_db)):
    query = select(Incident).order_by(Incident.created_at.desc())
    if status: query = query.where(Incident.status == status)
    if category: query = query.where(Incident.category == category)
    if priority: query = query.where(Incident.priority == priority)
    return [incident_out(i) for i in db.scalars(query).all()]


@router.get("/incidents/{public_id}")
def get_incident(public_id: str, db: Session = Depends(get_db)):
    incident = db.scalar(select(Incident).where(Incident.public_id == public_id))
    if not incident: raise HTTPException(404, "Incident not found")
    return incident_out(incident)


@router.post("/reports", status_code=201)
async def submit_report(body: dict, db: Session = Depends(get_db), user: User | None = Depends(optional_user)):
    description = str(body.get("description", "")).strip()
    if not description: raise HTTPException(422, "Description is required")
    category = body.get("category") or body.get("type") or "Other"
    incident = Incident(public_id=public_id("INC"), category=category, summary=description,
                        location_text=body.get("location") or body.get("location_text"), lat=body.get("lat"), lng=body.get("lng"))
    report = Report(public_id=public_id("RPT"), user_id=user.id if user else None, category=category, description=description,
                    language=body.get("language"), location_text=incident.location_text, lat=incident.lat, lng=incident.lng, anonymous=bool(body.get("anonymous")))
    incident.reports.append(report)
    db.add(incident); db.flush()
    await create_duplicate_suggestions(db, report, incident)
    notify_roles(db, ("operator", "admin"), "New report received", f"{report.public_id}: {category}", f"/incidents/{incident.public_id}")
    if user: notify_user(db, user.id, "Report submitted successfully", f"Your report {report.public_id} is under review.", f"/citizen/reports")
    db.commit()
    return {"incident": incident_out(incident), "reportId": report.public_id, "embeddingStatus": report.analysis_status}


@router.get("/reports/mine")
def my_reports(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Incident).join(Incident.reports).where(Report.user_id == user.id).distinct().order_by(Incident.created_at.desc())).all()
    return [incident_out(i) for i in rows]


@router.patch("/incidents/{public_id}")
def update_incident(public_id: str, body: dict, user: User = Depends(require_operator), db: Session = Depends(get_db)):
    incident = db.scalar(select(Incident).where(Incident.public_id == public_id))
    if not incident: raise HTTPException(404, "Incident not found")
    if "status" in body and body["status"] != incident.status:
        old = incident.status; incident.status = body["status"]
        notify_roles(db, ("operator", "admin"), "Incident status updated", f"{public_id}: {old} → {incident.status}", f"/incidents/{public_id}")
    if "priority" in body: incident.priority = body["priority"]
    if "verified" in body: incident.verified = bool(body["verified"])
    incident.updated_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(incident)
    return incident_out(incident)


@router.get("/duplicates")
def list_duplicates(status: str = "pending", _: User = Depends(require_operator), db: Session = Depends(get_db)):
    rows = db.scalars(select(DuplicateSuggestion).where(DuplicateSuggestion.status == status).order_by(DuplicateSuggestion.created_at.desc())).all()
    return [{"id": row.id, "reportId": row.report_id, "incidentId": row.incident_id, "score": row.score, "reason": row.reason, "status": row.status, "createdAt": row.created_at.isoformat()} for row in rows]


@router.patch("/duplicates/{suggestion_id}")
def decide_duplicate(suggestion_id: int, body: dict, user: User = Depends(require_operator), db: Session = Depends(get_db)):
    row = db.get(DuplicateSuggestion, suggestion_id)
    if not row: raise HTTPException(404, "Duplicate suggestion not found")
    decision = body.get("status")
    if decision not in ("confirmed", "rejected"): raise HTTPException(422, "status must be confirmed or rejected")
    row.status, row.decided_by = decision, user.id
    if decision == "confirmed":
        report = db.get(Report, row.report_id); report.incident_id = row.incident_id
    db.commit()
    return {"id": row.id, "status": row.status}


@router.get("/teams")
def list_teams(search: str | None = None, specialization: str | None = None, availability: str | None = None, db: Session = Depends(get_db)):
    query = select(Team).where(Team.is_active.is_(True)).order_by(Team.name)
    if search: query = query.where(Team.name.ilike(f"%{search}%"))
    if specialization: query = query.where(Team.specialization == specialization)
    if availability: query = query.where(Team.availability == availability)
    return [team_out(t) for t in db.scalars(query).all()]


@router.post("/teams", status_code=201)
def create_team(body: dict, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    if body.get("specialization") not in TEAM_SPECIALIZATIONS: raise HTTPException(422, "Invalid specialization")
    if body.get("availability", "Available") not in TEAM_STATUSES: raise HTTPException(422, "Invalid availability")
    team = Team(name=body.get("name", "").strip(), specialization=body["specialization"], description=body.get("description"), members=int(body.get("members", 0)), contact=body.get("contact"), availability=body.get("availability", "Available"), lat=body.get("lat"), lng=body.get("lng"), is_simulated=True)
    if not team.name: raise HTTPException(422, "Team name is required")
    db.add(team); db.commit(); db.refresh(team)
    notify_roles(db, ("admin",), "New team created", team.name, "/teams"); db.commit()
    return team_out(team)


@router.patch("/teams/{team_id}")
def update_team(team_id: int, body: dict, user: User = Depends(require_operator), db: Session = Depends(get_db)):
    team = db.get(Team, team_id)
    if not team or not team.is_active: raise HTTPException(404, "Team not found")
    if user.role != "admin" and set(body) - {"availability"}: raise HTTPException(403, "Administrator role required")
    if "availability" in body and body["availability"] not in TEAM_STATUSES: raise HTTPException(422, "Invalid availability")
    for key in ("name", "specialization", "description", "members", "contact", "availability", "lat", "lng"):
        if key in body: setattr(team, key, body[key])
    db.commit(); db.refresh(team)
    return team_out(team)


@router.delete("/teams/{team_id}", status_code=204)
def deactivate_team(team_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    team = db.get(Team, team_id)
    if not team: raise HTTPException(404, "Team not found")
    if db.scalar(select(Assignment).where(Assignment.team_id == team_id, Assignment.status.not_in(("Completed", "Cancelled")))): raise HTTPException(409, "Team has an active assignment")
    team.is_active = False; team.availability = "Unavailable"; db.commit()


@router.get("/assignments")
def list_assignments(incident_id: int | None = None, team_id: int | None = None, _: User = Depends(require_operator), db: Session = Depends(get_db)):
    query = select(Assignment).order_by(Assignment.created_at.desc())
    if incident_id: query = query.where(Assignment.incident_id == incident_id)
    if team_id: query = query.where(Assignment.team_id == team_id)
    return [{"id": a.id, "incidentId": a.incident_id, "teamId": a.team_id, "assignedBy": a.assigned_by, "status": a.status, "note": a.note, "createdAt": a.created_at.isoformat(), "updatedAt": a.updated_at.isoformat(), "completedAt": a.completed_at.isoformat() if a.completed_at else None} for a in db.scalars(query).all()]


@router.post("/assignments", status_code=201)
def create_assignment(body: dict, user: User = Depends(require_operator), db: Session = Depends(get_db)):
    incident = db.get(Incident, body.get("incidentId")); team = db.get(Team, body.get("teamId"))
    if not incident or not team or not team.is_active: raise HTTPException(404, "Incident or team not found")
    if team.availability != "Available": raise HTTPException(409, "Only available teams can be assigned")
    active = db.scalar(select(Assignment).where(Assignment.incident_id == incident.id, Assignment.status.not_in(("Completed", "Cancelled"))))
    if active: raise HTTPException(409, "Incident already has an active assignment")
    assignment = Assignment(incident_id=incident.id, team_id=team.id, assigned_by=user.id, note=body.get("note"))
    team.availability, incident.status = "Busy", "Assigned"
    db.add(assignment); db.commit(); db.refresh(assignment)
    notify_roles(db, ("operator", "admin"), "Assignment created", f"Team {team.name} assigned to {incident.public_id}", f"/incidents/{incident.public_id}"); db.commit()
    return {"id": assignment.id, "incidentId": assignment.incident_id, "teamId": assignment.team_id, "status": assignment.status}


@router.patch("/assignments/{assignment_id}")
def update_assignment(assignment_id: int, body: dict, user: User = Depends(require_operator), db: Session = Depends(get_db)):
    assignment = db.get(Assignment, assignment_id)
    if not assignment: raise HTTPException(404, "Assignment not found")
    status = body.get("status")
    if status not in ASSIGNMENT_STATUSES: raise HTTPException(422, "Invalid assignment status")
    assignment.status = status
    team, incident = db.get(Team, assignment.team_id), db.get(Incident, assignment.incident_id)
    if status in ("Completed", "Cancelled"):
        assignment.completed_at = datetime.now(timezone.utc); team.availability = "Available"
        if incident.status not in ("Resolved", "Rejected"): incident.status = "In Progress" if status == "Cancelled" else "Resolved"
    elif status in ("Assigned", "Accepted", "En Route", "On Scene"):
        team.availability = "Busy"; incident.status = "Assigned" if status in ("Assigned", "Accepted") else "In Progress"
    db.commit(); db.refresh(assignment)
    notify_roles(db, ("operator", "admin"), "Team assignment status updated", f"Assignment {assignment.id}: {status}", f"/incidents/{incident.public_id}"); db.commit()
    return {"id": assignment.id, "incidentId": assignment.incident_id, "teamId": assignment.team_id, "status": assignment.status}


@router.get("/notifications")
def list_notifications(unread_only: bool = False, limit: int = Query(30, ge=1, le=100), user: User = Depends(current_user), db: Session = Depends(get_db)):
    query = select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(limit)
    if unread_only: query = query.where(Notification.read.is_(False))
    rows = db.scalars(query).all()
    return [{"id": n.id, "title": n.title, "body": n.body, "link": n.link, "read": n.read, "createdAt": n.created_at.isoformat()} for n in rows]


@router.patch("/notifications/{notification_id}/read", status_code=204)
def mark_notification_read(notification_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    n = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if not n: raise HTTPException(404, "Notification not found")
    n.read = True; db.commit()


@router.post("/notifications/read-all", status_code=204)
def mark_all_notifications_read(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.read.is_(False)).update({"read": True}); db.commit()


@router.get("/analytics")
def analytics(start: datetime | None = None, end: datetime | None = None, _: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    conditions = []
    if start: conditions.append(Incident.created_at >= start)
    if end: conditions.append(Incident.created_at <= end)
    base = select(Incident).where(*conditions)
    incidents = db.scalars(base).all()
    by_priority = {p: sum(i.priority == p for i in incidents) for p in ("Critical", "High", "Medium", "Low")}
    by_category = {}
    by_status = {}
    by_day = {}
    for i in incidents:
        by_category[i.category] = by_category.get(i.category, 0) + 1
        by_status[i.status] = by_status.get(i.status, 0) + 1
        day = i.created_at.date().isoformat()
        by_day[day] = by_day.get(day, 0) + 1
    assignments = db.scalars(select(Assignment)).all()
    return {"totalReports": sum(len(i.reports or []) for i in incidents), "totalIncidents": len(incidents), "byPriority": by_priority, "byCategory": by_category, "byStatus": by_status, "byDay": by_day, "assignments": {"total": len(assignments), "completed": sum(a.status == "Completed" for a in assignments), "active": sum(a.status not in ("Completed", "Cancelled") for a in assignments), "cancelled": sum(a.status == "Cancelled" for a in assignments)}, "resolved": sum(i.status == "Resolved" for i in incidents), "unresolved": sum(i.status != "Resolved" for i in incidents)}


@router.get("/guidance")
def list_guidance(category: str | None = None, language: str = "en", search: str | None = None, db: Session = Depends(get_db)):
    query = select(SafetyGuidance).where(SafetyGuidance.is_active.is_(True), SafetyGuidance.is_published.is_(True), SafetyGuidance.language == language).order_by(SafetyGuidance.category, SafetyGuidance.title)
    if category: query = query.where(SafetyGuidance.category == category)
    if search: query = query.where(SafetyGuidance.title.ilike(f"%{search}%") | SafetyGuidance.short_description.ilike(f"%{search}%"))
    return [{"id": g.id, "title": g.title, "category": g.category, "language": g.language, "description": g.short_description, "instructions": g.instructions, "sourceName": g.source_name, "sourceUrl": g.source_url, "verificationStatus": g.verification_status} for g in db.scalars(query).all()]


@router.post("/guidance", status_code=201)
def create_guidance(body: dict, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    if body.get("category") not in GUIDANCE_CATEGORIES or body.get("language") not in ("en", "ur"): raise HTTPException(422, "Invalid guidance category or language")
    g = SafetyGuidance(title=body["title"], category=body["category"], language=body["language"], short_description=body["shortDescription"], instructions=body["instructions"], source_name=body["sourceName"], source_url=body["sourceUrl"], verification_status="approved" if body.get("publish") else "draft", is_published=bool(body.get("publish")))
    db.add(g); db.commit(); db.refresh(g); return {"id": g.id, "title": g.title}


@router.patch("/guidance/{guidance_id}")
def update_guidance(guidance_id: int, body: dict, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    g = db.get(SafetyGuidance, guidance_id)
    if not g: raise HTTPException(404, "Guidance not found")
    for key in ("title", "category", "language", "short_description", "instructions", "source_name", "source_url", "verification_status", "is_published", "is_active"):
        if key in body: setattr(g, key, body[key])
    db.commit(); return {"id": g.id, "isPublished": g.is_published}
