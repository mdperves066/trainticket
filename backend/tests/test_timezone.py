import pytest
import sys
from datetime import datetime, timezone
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from utils.timezone import (
    now_utc,
    now_utc_iso,
    now_dhaka,
    now_dhaka_iso,
    to_dhaka_str,
)


def test_now_utc_iso_has_z():
    iso = now_utc_iso()
    assert iso.endswith("Z")
    assert "T" in iso


def test_dhaka_offset():
    dhaka_dt = now_dhaka()
    # Asia/Dhaka is UTC+6 (offset = 21600 seconds)
    offset = dhaka_dt.utcoffset()
    assert offset is not None
    assert offset.total_seconds() == 21600


def test_to_dhaka_str_conversion():
    # A known UTC timestamp: 2026-09-22 17:30:00 UTC should be 11:30:00 PM BST
    utc_str = "2026-09-22T17:30:00Z"
    dhaka_str = to_dhaka_str(utc_str)
    assert "11:30:00" in dhaka_str
    assert "PM" in dhaka_str

    # Naive string without Z: treated as UTC
    naive_str = "2026-09-22T17:30:00"
    dhaka_str_naive = to_dhaka_str(naive_str)
    assert "11:30:00" in dhaka_str_naive
    assert "PM" in dhaka_str_naive
