import pytest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from adapters.mock import MockRailwayAdapter


@pytest.mark.asyncio
async def test_mock_adapter_search_route():
    adapter = MockRailwayAdapter()
    result = await adapter.search(
        from_station="DHAKA",
        to_station="SYLHET",
        journey_date="2026-09-30",
        passenger_count=1,
    )
    assert result.source == "MOCK"
    assert result.status == "OK"
    assert len(result.items) > 0
    # Check that Parabat Express is present for Dhaka-Sylhet
    train_names = [it.train_name for it in result.items]
    assert any("Parabat" in t for t in train_names)


@pytest.mark.asyncio
async def test_mock_adapter_manual_override():
    adapter = MockRailwayAdapter()
    adapter.set_manual_override("Parabat Express", "Snigdha", 7)
    result = await adapter.search(
        from_station="DHAKA",
        to_station="SYLHET",
        journey_date="2026-09-30",
        passenger_count=1,
    )
    snigdha_item = next(
        (it for it in result.items if "Parabat" in it.train_name and it.class_name == "Snigdha"),
        None,
    )
    assert snigdha_item is not None
    assert snigdha_item.available_count == 7
    assert snigdha_item.status == "AVAILABLE"
