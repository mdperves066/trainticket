from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from services.station_resolver import search_stations, resolve_station, OFFICIAL_STATIONS
from services.train_discovery import discover_trains_for_route
from services.watch_scheduler import scheduler

router = APIRouter(prefix="/api", tags=["Stations & Dynamic Train Discovery"])


@router.get("/stations/canonical")
def get_canonical_stations():
    """Get the full list of canonical Bangladesh Railway stations."""
    return [
        {
            "code": s.code,
            "canonical_name": s.canonical_name,
            "display_name": s.display_name,
            "bangla_name": s.bangla_name,
            "aliases": s.aliases,
        }
        for s in OFFICIAL_STATIONS
    ]


@router.get("/stations/search")
def search_stations_endpoint(q: str = Query("", description="Station name in English or Bengali")):
    """Autocomplete and fuzzy search for official Bangladesh Railway stations."""
    results = search_stations(q, limit=15)
    return [
        {
            "code": s.code,
            "canonical_name": s.canonical_name,
            "display_name": s.display_name,
            "bangla_name": s.bangla_name,
            "aliases": s.aliases,
        }
        for s in results
    ]


@router.get("/trains/discover")
def discover_trains_endpoint(
    from_station: str = Query(..., description="Departure station name"),
    to_station: str = Query(..., description="Destination station name"),
    journey_date: str = Query(..., description="Journey date string (YYYY-MM-DD)"),
):
    """
    Dynamically discover all authentic trains and seat classes for the selected route and date.
    Never returns hardcoded unrelated trains from other routes.
    """
    from_canon = resolve_station(from_station)
    to_canon = resolve_station(to_station)

    from_clean = from_canon.canonical_name if from_canon else from_station.strip().upper()
    to_clean = to_canon.canonical_name if to_canon else to_station.strip().upper()

    if from_clean == to_clean:
        raise HTTPException(status_code=400, detail="From and To stations cannot be identical.")

    result = discover_trains_for_route(
        from_station=from_clean,
        to_station=to_clean,
        journey_date=journey_date.strip(),
        mode=scheduler.mode,
        live_adapter=scheduler.official_adapter if scheduler.mode == "LIVE" else None,
    )

    return {
        "from_station": result.from_station,
        "to_station": result.to_station,
        "journey_date": result.journey_date,
        "trains": [
            {
                "train_name": t.train_name,
                "train_number": t.train_number,
                "departure_time": t.departure_time,
                "arrival_time": t.arrival_time,
                "service_status": t.service_status,
                "classes": t.classes,
                "raw_status_label": t.raw_status_label,
            }
            for t in result.trains
        ],
        "available_classes": result.available_classes,
        "source": result.source,
        "checked_at": result.checked_at,
        "message": result.message,
    }
