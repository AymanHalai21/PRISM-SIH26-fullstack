import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import AuditEvent, AuditResult

GENESIS_HASH = "0" * 64


def _canonical_json(payload: dict) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def append_audit(db: Session, *, actor_id: str | None, action: str, resource_type: str, resource_id: str | None, resource_label: str | None, result: AuditResult, details: dict | None = None) -> AuditEvent:
    """Append to the single global chain; the first event points to 64 zeroes."""
    previous = db.scalar(select(AuditEvent).order_by(AuditEvent.occurred_at.desc(), AuditEvent.id.desc()).limit(1))
    previous_hash = previous.event_hash if previous else GENESIS_HASH
    occurred_at = datetime.now(timezone.utc)
    payload = {"actor_id": actor_id, "occurred_at": occurred_at.isoformat().replace("+00:00", "Z"), "action": action, "resource_type": resource_type, "resource_id": resource_id, "resource_label": resource_label, "result": result.value, "details": details or {}, "previous_event_hash": previous_hash}
    event = AuditEvent(actor_id=actor_id, occurred_at=occurred_at, action=action, resource_type=resource_type, resource_id=resource_id, resource_label=resource_label, result=result, details=details or {}, previous_event_hash=previous_hash, event_hash=hashlib.sha256(_canonical_json(payload).encode()).hexdigest())
    db.add(event)
    return event
