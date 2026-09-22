import asyncio
import json
from typing import Set, Dict, Any
from datetime import datetime


class SSEManager:
    """
    Manages Server-Sent Events (SSE) subscriptions for real-time dashboard updates.
    Broadcasts live availability snapshots, alarm state changes, and worker statuses.
    """

    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.add(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue) -> None:
        async with self._lock:
            self._subscribers.discard(q)

    async def broadcast(self, event_name: str, data: Dict[str, Any]) -> None:
        payload = {
            "event": event_name,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        raw_msg = f"event: {event_name}\ndata: {json.dumps(payload)}\n\n"

        async with self._lock:
            dead_queues = set()
            for q in self._subscribers:
                try:
                    q.put_nowait(raw_msg)
                except asyncio.QueueFull:
                    dead_queues.add(q)
                except Exception:
                    dead_queues.add(q)

            for dead in dead_queues:
                self._subscribers.discard(dead)


# Global singleton instance
sse_hub = SSEManager()
