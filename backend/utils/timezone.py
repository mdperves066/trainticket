"""
Centralized Timezone & Timestamp Utility.
Guarantees consistent UTC storage and Asia/Dhaka (UTC+6) representation across the entire system.
"""

from datetime import datetime, timezone, timedelta

try:
    import zoneinfo
    DHAKA_TZ = zoneinfo.ZoneInfo("Asia/Dhaka")
except Exception:
    DHAKA_TZ = timezone(timedelta(hours=6), name="Asia/Dhaka")


def now_utc() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def now_utc_iso() -> str:
    """
    Return ISO-8601 string in UTC ending with 'Z'.
    Browsers and JavaScript Date() interpret strings ending with 'Z' as UTC,
    avoiding the 6-hour timezone mismatch.
    Example: '2026-09-22T17:31:00Z'
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def now_dhaka() -> datetime:
    """Return timezone-aware current datetime in Asia/Dhaka (UTC+6)."""
    return datetime.now(DHAKA_TZ)


def now_dhaka_iso() -> str:
    """
    Return ISO-8601 string in Asia/Dhaka timezone with explicit +06:00 offset.
    Example: '2026-09-22T23:31:00+06:00'
    """
    return datetime.now(DHAKA_TZ).isoformat()


def to_dhaka_str(dt: datetime | str | None) -> str:
    """Format any datetime or ISO string to standard Bangladesh time string (HH:MM:SS AM/PM)."""
    if dt is None:
        return "-"
    if isinstance(dt, str):
        try:
            # Handle strings with or without Z / offsets
            clean = dt if (dt.endswith("Z") or "+" in dt or dt.count("-") > 2) else dt + "+00:00"
            parsed = datetime.fromisoformat(clean.replace("Z", "+00:00"))
            dt = parsed
        except Exception:
            return dt

    if dt.tzinfo is None:
        # If naive, treat as UTC
        dt = dt.replace(tzinfo=timezone.utc)

    dhaka_dt = dt.astimezone(DHAKA_TZ)
    return dhaka_dt.strftime("%I:%M:%S %p")
