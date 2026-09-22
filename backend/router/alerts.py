from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.sse_manager import sse_hub

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Siren"])


@router.get("", response_model=List[schemas.AlertEventOut])
def list_alerts(active_only: bool = False, limit: int = 50, db: Session = Depends(get_db)):
    """List alert events (active opportunities or historical log)."""
    query = db.query(models.AlertEvent)
    if active_only:
        query = query.filter(models.AlertEvent.closed_at.is_(None))
    alerts = query.order_by(models.AlertEvent.detected_at.desc()).limit(limit).all()
    return alerts


@router.post("/{id}/acknowledge")
async def acknowledge_alert(id: int, db: Session = Depends(get_db)):
    """User acknowledges an active seat availability alert."""
    alert = db.query(models.AlertEvent).filter(models.AlertEvent.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert event not found.")

    alert.acknowledged_at = datetime.utcnow()
    db.commit()

    await sse_hub.broadcast("alert_acknowledged", {
        "alert_id": id,
        "acknowledged_at": alert.acknowledged_at.isoformat(),
    })

    return {"message": "Alert acknowledged.", "alert_id": id}


@router.post("/stop-alarm")
async def stop_alarm():
    """Global action to stop audio siren across all UI dashboards."""
    await sse_hub.broadcast("stop_alarm", {
        "stopped_at": datetime.utcnow().isoformat(),
        "state": "STOPPED",
    })
    return {"message": "Alarm siren stopped.", "state": "STOPPED"}


@router.post("/test")
async def test_alert():
    """Trigger a synthetic alert to test audio siren, browser notifications, and UI response."""
    test_data = {
        "alert_id": 999999,
        "watch_id": "test-watch",
        "train": "Parabat Express (TEST)",
        "class_name": "Snigdha",
        "previous_availability": 0,
        "current_availability": 2,
        "from_station": "DHAKA",
        "to_station": "SYLHET",
        "journey_date": "30-Sep-2026",
        "event_type": "SEAT_AVAILABLE",
        "detected_at": datetime.utcnow().isoformat(),
        "message": "TEST ALERT: 2 Snigdha seats detected on Parabat Express.",
        "is_test": True,
    }
    await sse_hub.broadcast("seat_alert", test_data)
    return {"message": "Test alert emitted successfully.", "payload": test_data}
