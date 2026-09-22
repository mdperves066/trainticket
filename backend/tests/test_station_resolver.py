import pytest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.station_resolver import (
    resolve_canonical_station,
    search_stations,
    CANONICAL_STATIONS,
)


def test_english_canonical_stations():
    assert resolve_canonical_station("Dhaka") == "DHAKA"
    assert resolve_canonical_station("dhaka") == "DHAKA"
    assert resolve_canonical_station("   sylhet   ") == "SYLHET"
    assert resolve_canonical_station("Chittagong") == "CHITTAGONG"
    assert resolve_canonical_station("Cox's Bazar") == "COX'S BAZAR"


def test_bengali_and_unicode_normalization():
    # Bangla station names normalized to official canonical English IDs
    assert resolve_canonical_station("ঢাকা") == "DHAKA"
    assert resolve_canonical_station("চট্টগ্রাম") == "CHITTAGONG"
    assert resolve_canonical_station("সিলেট") == "SYLHET"
    assert resolve_canonical_station("কক্সবাজার") == "COX'S BAZAR"
    assert resolve_canonical_station("রাজশাহী") == "RAJSHAHI"
    assert resolve_canonical_station("খুলনা") == "KHULNA"


def test_station_aliases():
    # Popular station aliases
    assert resolve_canonical_station("kamalapur") == "DHAKA"
    assert resolve_canonical_station("Dhaka Kamalapur") == "DHAKA"
    assert resolve_canonical_station("chattogram") == "CHITTAGONG"
    assert resolve_canonical_station("coxsbazar") == "COX'S BAZAR"
    assert resolve_canonical_station("cox bazar") == "COX'S BAZAR"
    assert resolve_canonical_station("cantonment") == "DHAKA"
    assert resolve_canonical_station("airport") == "DHAKA"


def test_unknown_station_fallback():
    # Non-empty unknown station string should return clean uppercase normalized value
    assert resolve_canonical_station("Nonexistent Junction") == "NONEXISTENT JUNCTION"
    assert resolve_canonical_station("") == ""


def test_search_and_autocomplete():
    results = search_stations("dh")
    assert len(results) > 0
    assert any(r["canonical"] == "DHAKA" for r in results)

    # Bengali search query
    bangla_results = search_stations("সিলেট")
    assert len(bangla_results) > 0
    assert bangla_results[0]["canonical"] == "SYLHET"
