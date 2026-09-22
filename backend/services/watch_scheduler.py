import asyncio
import json
import random
import os
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from adapters.base import RailwayAdapter, SearchResult, SessionStatus
from adapters.mock import MockRailwayAdapter
from adapters.official import OfficialRailwayAdapter
from utils.timezone import now_utc, now_utc_iso, to_dhaka_str
from .change_detector import AvailabilityChangeDetector
from .telegram_bot import TelegramNotifier
from .sse_manager import sse_hub



class WatchScheduler:
    """
    Asyncio-based Watch Jobs Scheduler & Concurrency Controller.
    Manages individual isolated watch tasks, respectful interval polling with jitter,
    progressive backoff on errors, change detection, and alert dispatching.
    """

    def __init__(self):
        self.change_detector = AvailabilityChangeDetector()
        self.telegram = TelegramNotifier()
        self.mock_adapter = MockRailwayAdapter()
        self.official_adapter = OfficialRailwayAdapter()

        # Mode configuration: "MOCK" or "LIVE"
        default_mode = os.getenv("APP_MODE", "MOCK").upper()
        self.mode = "LIVE" if default_mode == "LIVE" else "MOCK"

        self._active_tasks: Dict[str, asyncio.Task] = {}
        self._running = True

    def get_adapter(self) -> RailwayAdapter:
        if self.mode == "LIVE":
            return self.official_adapter
        return self.mock_adapter

    def set_mode(self, mode: str) -> str:
        mode_upper = mode.upper()
        if mode_upper in ("LIVE", "MOCK"):
            self.mode = mode_upper
        return self.mode

    async def get_session_status(self) -> SessionStatus:
        adapter = self.get_adapter()
        return await adapter.check_session()

    async def start_watch(self, watch_id: str) -> bool:
        """Start recurring monitoring loop for a specific watch job."""
        if watch_id in self._active_tasks and not self._active_tasks[watch_id].done():
            return True  # already running

        db: Session = SessionLocal()
        try:
            watch = db.query(models.WatchJob).filter(models.WatchJob.id == watch_id).first()
            if not watch:
                return False

            watch.monitoring_enabled = 1
            watch.current_status = "RUNNING"
            watch.last_error = None
            db.commit()

            # Broadcast status change
            await sse_hub.broadcast("watch_status", {
                "watch_id": watch_id,
                "status": "RUNNING",
                "monitoring_enabled": True,
            })
        finally:
            db.close()

        task = asyncio.create_task(self._watch_loop(watch_id))
        self._active_tasks[watch_id] = task
        return True

    async def stop_watch(self, watch_id: str) -> bool:
        """Immediately stop monitoring for a specific watch job."""
        if watch_id in self._active_tasks:
            task = self._active_tasks.pop(watch_id)
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        db: Session = SessionLocal()
        try:
            watch = db.query(models.WatchJob).filter(models.WatchJob.id == watch_id).first()
            if watch:
                watch.monitoring_enabled = 0
                watch.current_status = "STOPPED"
                watch.next_check_at = None
                db.commit()

            await sse_hub.broadcast("watch_status", {
                "watch_id": watch_id,
                "status": "STOPPED",
                "monitoring_enabled": False,
            })
            return True
        finally:
            db.close()

    async def search_once(self, watch_id: str) -> Optional[SearchResult]:
        """Perform a single search attempt without running continuous monitoring."""
        db: Session = SessionLocal()
        try:
            watch = db.query(models.WatchJob).filter(models.WatchJob.id == watch_id).first()
            if not watch:
                return None

            selected_trains = json.loads(watch.selected_trains) if watch.selected_trains else ["ALL"]
            selected_classes = json.loads(watch.selected_classes) if watch.selected_classes else ["ALL"]

            adapter = self.get_adapter()
            result = await adapter.search(
                from_station=watch.from_station,
                to_station=watch.to_station,
                journey_date=watch.journey_date,
                passenger_count=watch.passenger_count,
                selected_trains=selected_trains,
                selected_classes=selected_classes,
            )

            # Process snapshots and update watch state
            await self._process_search_result(watch.id, result, db)
            return result
        finally:
            db.close()

    async def _watch_loop(self, watch_id: str) -> None:
        """Worker loop for a single watch job with jitter and progressive error backoff."""
        consecutive_errors = 0
        backoff_intervals = [15.0, 30.0, 60.0, 120.0]

        while True:
            db: Session = SessionLocal()
            try:
                watch = db.query(models.WatchJob).filter(models.WatchJob.id == watch_id).first()
                if not watch or watch.monitoring_enabled == 0:
                    break

                selected_trains = json.loads(watch.selected_trains) if watch.selected_trains else ["ALL"]
                selected_classes = json.loads(watch.selected_classes) if watch.selected_classes else ["ALL"]

                adapter = self.get_adapter()
                result = await adapter.search(
                    from_station=watch.from_station,
                    to_station=watch.to_station,
                    journey_date=watch.journey_date,
                    passenger_count=watch.passenger_count,
                    selected_trains=selected_trains,
                    selected_classes=selected_classes,
                )

                if result.status in ("ERROR", "NETWORK_ERROR", "PARSE_ERROR", "RATE_LIMITED", "CAPTCHA_REQUIRED"):
                    consecutive_errors += 1
                    backoff_sec = backoff_intervals[min(consecutive_errors - 1, len(backoff_intervals) - 1)]

                    watch.current_status = "MANUAL_ACTION_REQUIRED" if result.status == "CAPTCHA_REQUIRED" else "BACKOFF"
                    watch.last_error = result.error or f"Search status: {result.status}"
                    watch.last_check_at = datetime.utcnow()
                    watch.next_check_at = datetime.utcnow() + timedelta(seconds=backoff_sec)
                    db.commit()

                    next_iso = watch.next_check_at.isoformat() + "Z"
                    await sse_hub.broadcast("watch_error", {
                        "watch_id": watch_id,
                        "status": watch.current_status,
                        "error": watch.last_error,
                        "backoff_seconds": backoff_sec,
                        "next_check_at": next_iso,
                    })

                    await asyncio.sleep(backoff_sec)
                    continue

                # Search succeeded
                consecutive_errors = 0
                watch.current_status = "RUNNING"
                watch.last_error = None
                watch.last_check_at = datetime.utcnow()

                # Process results and change detection
                await self._process_search_result(watch_id, result, db)

                # Jittered sleep: default 15s with jitter (10s - 20s)
                jitter = random.uniform(-3.5, 4.5)
                base_interval = float(os.getenv("MONITOR_INTERVAL_SECONDS", "15"))
                sleep_duration = max(10.0, min(30.0, base_interval + jitter))

                watch.next_check_at = datetime.utcnow() + timedelta(seconds=sleep_duration)
                db.commit()

                last_iso = (watch.last_check_at.isoformat() + "Z") if watch.last_check_at else now_utc_iso()
                next_iso = (watch.next_check_at.isoformat() + "Z") if watch.next_check_at else now_utc_iso()

                await sse_hub.broadcast("watch_countdown", {
                    "watch_id": watch_id,
                    "last_check_at": last_iso,
                    "next_check_at": next_iso,
                    "sleep_duration": round(sleep_duration, 1),
                })


                await asyncio.sleep(sleep_duration)

            except asyncio.CancelledError:
                break
            except Exception as loop_err:
                consecutive_errors += 1
                try:
                    watch = db.query(models.WatchJob).filter(models.WatchJob.id == watch_id).first()
                    if watch:
                        watch.current_status = "ERROR"
                        watch.last_error = str(loop_err)
                        db.commit()
                except Exception:
                    pass
                await asyncio.sleep(15.0)
            finally:
                db.close()

    async def _process_search_result(self, watch_id: str, result: SearchResult, db: Session) -> None:
        """Run change detection, persist snapshots, and emit alerts."""
        watch = db.query(models.WatchJob).filter(models.WatchJob.id == watch_id).first()
        if not watch:
            return

        current_avail_map: Dict[str, Dict[str, int]] = {}

        for item in result.items:
            # Update current map
            if item.train_name not in current_avail_map:
                current_avail_map[item.train_name] = {}
            current_avail_map[item.train_name][item.class_name] = item.available_count

            # Evaluate state transition
            tr = self.change_detector.evaluate_transition(
                watch_id=watch_id,
                train_name=item.train_name,
                class_name=item.class_name,
                current_count=item.available_count,
                parser_confidence=item.parser_confidence,
                status=item.status,
            )

            # Record snapshot
            snapshot = models.AvailabilitySnapshot(
                watch_id=watch_id,
                train_name=item.train_name,
                class_name=item.class_name,
                availability=item.available_count,
                timestamp=datetime.utcnow(),
                parser_confidence=item.parser_confidence,
                raw_source_label=item.raw_source_label,
                status=item.status,
            )
            db.add(snapshot)

            # High-priority alert: 0 -> >0
            if tr.is_alert:
                alert = models.AlertEvent(
                    watch_id=watch_id,
                    train=item.train_name,
                    class_name=item.class_name,
                    previous_availability=tr.previous_count,
                    current_availability=tr.current_count,
                    event_type="SEAT_AVAILABLE",
                    detected_at=datetime.utcnow(),
                    details=tr.message,
                )
                db.add(alert)
                db.flush()

                # Dispatch Telegram if enabled
                tele_sent = await self.telegram.send_availability_alert(
                    train_name=item.train_name,
                    from_station=watch.from_station,
                    to_station=watch.to_station,
                    journey_date=watch.journey_date,
                    class_name=item.class_name,
                    available_count=item.available_count,
                    detected_time=datetime.now().strftime("%H:%M:%S"),
                )
                if tele_sent:
                    alert.notified_telegram = 1

                # Broadcast live alert to UI
                alert_iso = alert.detected_at.isoformat() + "Z"
                await sse_hub.broadcast("seat_alert", {
                    "alert_id": alert.id,
                    "watch_id": watch_id,
                    "train": item.train_name,
                    "class_name": item.class_name,
                    "previous_availability": tr.previous_count,
                    "current_availability": tr.current_count,
                    "from_station": watch.from_station,
                    "to_station": watch.to_station,
                    "journey_date": watch.journey_date,
                    "event_type": "SEAT_AVAILABLE",
                    "detected_at": alert_iso,
                    "message": tr.message,
                })

            # Opportunity closed: >0 -> 0
            elif tr.is_closed:
                # Close any unclosed alert events for this train/class
                open_alerts = (
                    db.query(models.AlertEvent)
                    .filter(
                        models.AlertEvent.watch_id == watch_id,
                        models.AlertEvent.train == item.train_name,
                        models.AlertEvent.class_name == item.class_name,
                        models.AlertEvent.closed_at.is_(None),
                    )
                    .all()
                )
                for oa in open_alerts:
                    oa.closed_at = datetime.utcnow()

                close_event = models.AlertEvent(
                    watch_id=watch_id,
                    train=item.train_name,
                    class_name=item.class_name,
                    previous_availability=tr.previous_count,
                    current_availability=0,
                    event_type="SEAT_SOLD_OUT",
                    detected_at=datetime.utcnow(),
                    closed_at=datetime.utcnow(),
                    details=tr.message,
                )
                db.add(close_event)

                await sse_hub.broadcast("opportunity_closed", {
                    "watch_id": watch_id,
                    "train": item.train_name,
                    "class_name": item.class_name,
                    "detected_at": now_utc_iso(),
                    "message": tr.message,
                })


        # Update watch job snapshot
        watch.current_availability = json.dumps(current_avail_map)
        db.commit()

        # Broadcast live availability update
        await sse_hub.broadcast("availability_update", {
            "watch_id": watch_id,
            "source": result.source,
            "status": result.status,
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
        })

    async def shutdown(self) -> None:
        """Gracefully terminate all running watch loops and close adapters."""
        for watch_id, task in list(self._active_tasks.items()):
            task.cancel()
        await self.official_adapter.close()
        await self.mock_adapter.close()


# Global scheduler instance
scheduler = WatchScheduler()
