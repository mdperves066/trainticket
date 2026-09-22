import asyncio
import json
import httpx
from datetime import datetime
from utils.timezone import now_utc_iso
from fastapi import APIRouter, Depends, Request, Response

from fastapi.responses import StreamingResponse
from services.watch_scheduler import scheduler
from services.sse_manager import sse_hub
from adapters.official import PLAYWRIGHT_AVAILABLE

router = APIRouter(tags=["Diagnostics & System"])


@router.get("/health")
async def health_check():
    """Health check endpoint reflecting core services status."""
    session_status = await scheduler.get_session_status()
    return {
        "backend": "ok",
        "worker": "ok" if scheduler._running else "stopped",
        "browser": "ok" if (PLAYWRIGHT_AVAILABLE or scheduler.mode == "MOCK") else "missing_playwright",
        "mode": scheduler.mode,
        "session_status": session_status.status,
    }


@router.get("/api/diagnostics")
async def get_diagnostics():
    """Detailed diagnostics for system dashboard."""
    # Test official portal reachability
    portal_reachable = False
    portal_latency_ms = None
    try:
        t0 = datetime.now()
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("https://eticket.railway.gov.bd/")
            portal_latency_ms = round((datetime.now() - t0).total_seconds() * 1000, 1)
            portal_reachable = resp.status_code < 500
    except Exception:
        portal_reachable = False

    session = await scheduler.get_session_status()

    return {
        "backend": "OK",
        "worker": "OK" if scheduler._running else "STOPPED",
        "playwright": "OK" if PLAYWRIGHT_AVAILABLE else "NOT_INSTALLED",
        "browser_session": session.status,
        "session_message": session.message,
        "official_portal": "REACHABLE" if portal_reachable else "UNREACHABLE",
        "official_portal_latency_ms": portal_latency_ms,
        "mode": scheduler.mode,
        "active_watch_tasks": len(scheduler._active_tasks),
        "telegram_configured": scheduler.telegram.is_configured,
        "last_parse_timestamp": getattr(scheduler.official_adapter, "_last_parse_timestamp", None),
        "timestamp": now_utc_iso(),
    }


@router.post("/api/dev/mode")
async def switch_mode(mode: str):
    """Switch between LIVE (Official Playwright) and MOCK modes."""
    new_mode = scheduler.set_mode(mode)
    await sse_hub.broadcast("mode_change", {"mode": new_mode})
    return {"mode": new_mode, "message": f"Operating mode switched to {new_mode}."}


@router.get("/api/events/stream")
async def event_stream(request: Request):
    """Server-Sent Events (SSE) live streaming endpoint for real-time dashboard updates."""
    queue = await sse_hub.subscribe()

    async def event_generator():
        try:
            # Send initial connection greeting
            init_msg = {
                "event": "connected",
                "data": {
                    "mode": scheduler.mode,
                    "timestamp": now_utc_iso(),
                },
            }
            yield f"event: connected\ndata: {json.dumps(init_msg)}\n\n"


            while True:
                if await request.is_disconnected():
                    break
                try:
                    # Wait for next event or send heartbeat comment every 15 seconds
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield msg
                except asyncio.TimeoutError:
                    # Heartbeat comment to keep connection alive
                    yield ": heartbeat\n\n"
        finally:
            await sse_hub.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
