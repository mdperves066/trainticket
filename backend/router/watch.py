import uuid
import json
import csv
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.watch_scheduler import scheduler

router = APIRouter(prefix="/api/watches", tags=["Watch Jobs"])


@router.post("", response_model=schemas.WatchJobOut, status_code=201)
async def create_watch_job(job_in: schemas.WatchJobCreate, db: Session = Depends(get_db)):
    """Create a new personal Bangladesh Railway ticket watch job."""
    from_st = job_in.from_station.strip().upper()
    to_st = job_in.to_station.strip().upper()

    if not from_st or not to_st:
        raise HTTPException(status_code=400, detail="From and To stations are required.")
    if from_st == to_st:
        raise HTTPException(status_code=400, detail="Origin and destination stations must be different.")

    new_id = str(uuid.uuid4())
    watch = models.WatchJob(
        id=new_id,
        from_station=from_st,
        to_station=to_st,
        journey_date=job_in.journey_date.strip(),
        passenger_count=max(1, min(4, job_in.passenger_count)),
        selected_trains=json.dumps(job_in.selected_trains or ["ALL"]),
        selected_classes=json.dumps(job_in.selected_classes or ["ALL"]),
        monitoring_enabled=0,
        current_status="STOPPED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(watch)
    db.commit()
    db.refresh(watch)

    return _format_watch_out(watch)


@router.get("", response_model=List[schemas.WatchJobOut])
def list_watch_jobs(db: Session = Depends(get_db)):
    """List all saved watch jobs."""
    watches = db.query(models.WatchJob).order_by(models.WatchJob.created_at.desc()).all()
    return [_format_watch_out(w) for w in watches]


@router.get("/{id}", response_model=schemas.WatchJobOut)
def get_watch_job(id: str, db: Session = Depends(get_db)):
    """Get details for a specific watch job."""
    watch = db.query(models.WatchJob).filter(models.WatchJob.id == id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch job not found.")
    return _format_watch_out(watch)


@router.put("/{id}", response_model=schemas.WatchJobOut)
def update_watch_job(id: str, job_update: schemas.WatchJobUpdate, db: Session = Depends(get_db)):
    """Edit watch job criteria."""
    watch = db.query(models.WatchJob).filter(models.WatchJob.id == id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch job not found.")

    if job_update.from_station is not None:
        watch.from_station = job_update.from_station.strip().upper()
    if job_update.to_station is not None:
        watch.to_station = job_update.to_station.strip().upper()
    if job_update.journey_date is not None:
        watch.journey_date = job_update.journey_date.strip()
    if job_update.passenger_count is not None:
        watch.passenger_count = max(1, min(4, job_update.passenger_count))
    if job_update.selected_trains is not None:
        watch.selected_trains = json.dumps(job_update.selected_trains)
    if job_update.selected_classes is not None:
        watch.selected_classes = json.dumps(job_update.selected_classes)

    watch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(watch)
    return _format_watch_out(watch)


@router.delete("/{id}")
async def delete_watch_job(id: str, db: Session = Depends(get_db)):
    """Stop and delete a watch job."""
    await scheduler.stop_watch(id)
    scheduler.change_detector.reset_watch(id)

    watch = db.query(models.WatchJob).filter(models.WatchJob.id == id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch job not found.")

    db.delete(watch)
    db.commit()
    return {"message": "Watch job deleted successfully.", "id": id}


@router.post("/{id}/start")
async def start_monitoring(id: str, db: Session = Depends(get_db)):
    """Start continuous live monitoring for this watch job."""
    watch = db.query(models.WatchJob).filter(models.WatchJob.id == id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch job not found.")

    success = await scheduler.start_watch(id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start monitoring.")

    db.refresh(watch)
    return {"message": "Monitoring started.", "watch": _format_watch_out(watch)}


@router.post("/{id}/stop")
async def stop_monitoring(id: str, db: Session = Depends(get_db)):
    """Immediately stop continuous monitoring for this watch job."""
    watch = db.query(models.WatchJob).filter(models.WatchJob.id == id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch job not found.")

    await scheduler.stop_watch(id)
    db.refresh(watch)
    return {"message": "Monitoring stopped.", "watch": _format_watch_out(watch)}


@router.post("/{id}/pause")
async def pause_monitoring(id: str, db: Session = Depends(get_db)):
    """Pause monitoring (alias for stop)."""
    return await stop_monitoring(id, db)


@router.post("/{id}/search-once")
async def search_once(id: str, db: Session = Depends(get_db)):
    """Execute a single live search attempt without recurring polling."""
    result = await scheduler.search_once(id)
    if not result:
        raise HTTPException(status_code=404, detail="Watch job not found.")

    return {
        "watch_id": id,
        "from_station": result.from_station,
        "to_station": result.to_station,
        "journey_date": result.journey_date,
        "passenger_count": result.passenger_count,
        "source": result.source,
        "status": result.status,
        "error": result.error,
        "items": [
            {
                "train_name": it.train_name,
                "class_name": it.class_name,
                "available_count": it.available_count,
                "fare": it.fare,
                "departure_time": it.departure_time,
                "arrival_time": it.arrival_time,
                "status": it.status,
                "raw_source_label": it.raw_source_label,
            }
            for it in result.items
        ],
        "timestamp": result.timestamp,
    }


@router.get("/{id}/history")
def get_watch_history(id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve recent availability snapshots and alert events for a watch job."""
    snapshots = (
        db.query(models.AvailabilitySnapshot)
        .filter(models.AvailabilitySnapshot.watch_id == id)
        .order_by(models.AvailabilitySnapshot.timestamp.desc())
        .limit(limit)
        .all()
    )
    alerts = (
        db.query(models.AlertEvent)
        .filter(models.AlertEvent.watch_id == id)
        .order_by(models.AlertEvent.detected_at.desc())
        .all()
    )

    return {
        "watch_id": id,
        "snapshots": [
            {
                "id": s.id,
                "train_name": s.train_name,
                "class_name": s.class_name,
                "availability": s.availability,
                "timestamp": s.timestamp.isoformat(),
                "parser_confidence": s.parser_confidence,
                "raw_source_label": s.raw_source_label,
                "status": s.status,
            }
            for s in snapshots
        ],
        "alerts": [
            {
                "id": a.id,
                "train": a.train,
                "class_name": a.class_name,
                "previous_availability": a.previous_availability,
                "current_availability": a.current_availability,
                "event_type": a.event_type,
                "detected_at": a.detected_at.isoformat(),
                "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
                "closed_at": a.closed_at.isoformat() if a.closed_at else None,
                "details": a.details,
            }
            for a in alerts
        ],
    }


@router.get("/{id}/export")
def export_history(id: str, format: str = Query("json", pattern="^(json|csv)$"), db: Session = Depends(get_db)):
    """Export watch monitoring history as JSON or CSV."""
    snapshots = (
        db.query(models.AvailabilitySnapshot)
        .filter(models.AvailabilitySnapshot.watch_id == id)
        .order_by(models.AvailabilitySnapshot.timestamp.desc())
        .all()
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp (UTC)", "Train Name", "Class", "Availability", "Status", "Confidence", "Raw Label"])
        for s in snapshots:
            writer.writerow([s.id, s.timestamp.isoformat(), s.train_name, s.class_name, s.availability, s.status, s.parser_confidence, s.raw_source_label or ""])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=watch_{id}_history.csv"},
        )

    # JSON export
    data = [
        {
            "id": s.id,
            "timestamp": s.timestamp.isoformat(),
            "train_name": s.train_name,
            "class_name": s.class_name,
            "availability": s.availability,
            "status": s.status,
            "parser_confidence": s.parser_confidence,
            "raw_source_label": s.raw_source_label,
        }
        for s in snapshots
    ]
    return data


@router.post("/{id}/clear-history")
def clear_history(id: str, db: Session = Depends(get_db)):
    """Clear past snapshots and alert logs for a watch."""
    db.query(models.AvailabilitySnapshot).filter(models.AvailabilitySnapshot.watch_id == id).delete()
    db.query(models.AlertEvent).filter(models.AlertEvent.watch_id == id).delete()
    db.commit()
    return {"message": "History cleared successfully.", "watch_id": id}


def _format_watch_out(watch: models.WatchJob) -> dict:
    selected_trains = json.loads(watch.selected_trains) if watch.selected_trains else ["ALL"]
    selected_classes = json.loads(watch.selected_classes) if watch.selected_classes else ["ALL"]
    current_avail = json.loads(watch.current_availability) if watch.current_availability else None

    return {
        "id": watch.id,
        "from_station": watch.from_station,
        "to_station": watch.to_station,
        "journey_date": watch.journey_date,
        "passenger_count": watch.passenger_count,
        "selected_trains": selected_trains,
        "selected_classes": selected_classes,
        "monitoring_enabled": bool(watch.monitoring_enabled),
        "current_status": watch.current_status,
        "last_check_at": watch.last_check_at,
        "next_check_at": watch.next_check_at,
        "current_availability": current_avail,
        "last_error": watch.last_error,
        "created_at": watch.created_at,
        "updated_at": watch.updated_at,
    }
