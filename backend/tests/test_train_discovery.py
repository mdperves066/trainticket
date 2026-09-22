import pytest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.train_discovery import (
    discover_trains_for_route,
    RouteDiscoveryResult,
)


def test_dhaka_to_sylhet_discovery():
    res = discover_trains_for_route("DHAKA", "SYLHET", "2026-09-25", mode="MOCK")
    assert isinstance(res, RouteDiscoveryResult)
    train_names = [t.train_name for t in res.trains]
    # Authentic trains for Dhaka - Sylhet
    assert "Parabat Express" in train_names
    assert "Kalni Express" in train_names
    assert "Upaban Express" in train_names
    # Chittagong / Cox's Bazar trains must NOT appear
    assert "Subarna Express" not in train_names
    assert "Cox's Bazar Express" not in train_names


def test_dhaka_to_chittagong_discovery():
    res = discover_trains_for_route("DHAKA", "CHITTAGONG", "2026-09-25", mode="MOCK")
    train_names = [t.train_name for t in res.trains]
    assert "Subarna Express" in train_names
    assert "Sonar Bangla Express" in train_names
    # Sylhet trains must NOT appear
    assert "Parabat Express" not in train_names


def test_dhaka_to_coxs_bazar_discovery():
    res = discover_trains_for_route("DHAKA", "COX'S BAZAR", "2026-09-25", mode="MOCK")
    train_names = [t.train_name for t in res.trains]
    assert "Cox's Bazar Express" in train_names
    assert "Tourist Express" in train_names
    assert "Parabat Express" not in train_names


def test_route_direction_symmetry():
    # Sylhet -> Dhaka should discover the same trains
    res_reverse = discover_trains_for_route("SYLHET", "DHAKA", "2026-09-25", mode="MOCK")
    train_names = [t.train_name for t in res_reverse.trains]
    assert "Parabat Express" in train_names
    assert "Kalni Express" in train_names


def test_date_specific_off_day_logic():
    # Subarna Express is off on Monday.
    # 2026-09-28 is a Monday.
    res_monday = discover_trains_for_route("DHAKA", "CHITTAGONG", "2026-09-28", mode="MOCK")
    subarna = next((t for t in res_monday.trains if t.train_name == "Subarna Express"), None)
    assert subarna is not None
    assert subarna.schedule_status == "NOT_SCHEDULED"
    assert "off day" in subarna.status_detail.lower()


def test_classes_discovery():
    res = discover_trains_for_route("DHAKA", "SYLHET", "2026-09-25", mode="MOCK")
    assert "Snigdha" in res.available_classes
    assert "Shovon Chair" in res.available_classes
