import asyncio
from typing import List, Optional, Dict
from datetime import datetime
from .base import RailwayAdapter, SearchResult, ParsedSeatItem, SessionStatus


class MockRailwayAdapter(RailwayAdapter):
    """
    Mock adapter for testing, development, and offline verification.
    Clearly tags all responses with source="MOCK" so mock data cannot be confused with live data.
    Simulates realistic state transitions (e.g., 0 -> 0 -> 2 -> 2 -> 0 -> 3).
    """

    def __init__(self):
        self._initialized = True
        self._session_active = True
        self._query_counter: Dict[str, int] = {}
        self._manual_overrides: Dict[str, int] = {}  # key: "Train|Class" -> count

    async def initialize(self) -> None:
        self._initialized = True

    async def check_session(self) -> SessionStatus:
        return SessionStatus(
            connected=True,
            status="ACTIVE" if self._session_active else "LOGIN_REQUIRED",
            user_name="Demo Official User",
            message="Mock persistent session active",
            last_checked=datetime.utcnow().isoformat(),
        )

    def set_session_status(self, active: bool) -> None:
        self._session_active = active

    def set_manual_override(self, train_name: str, class_name: str, count: int) -> None:
        """Manually force availability for testing state transitions."""
        key = f"{train_name.upper()}|{class_name.upper()}"
        self._manual_overrides[key] = max(0, count)

    def clear_manual_overrides(self) -> None:
        self._manual_overrides.clear()

    async def search(
        self,
        from_station: str,
        to_station: str,
        journey_date: str,
        passenger_count: int = 1,
        selected_trains: Optional[List[str]] = None,
        selected_classes: Optional[List[str]] = None,
    ) -> SearchResult:
        query_key = f"{from_station.upper()}->{to_station.upper()}"
        step = self._query_counter.get(query_key, 0)
        self._query_counter[query_key] = step + 1

        # Determine train list based on route
        from_upper = from_station.upper()
        to_upper = to_station.upper()

        if "SYLHET" in from_upper or "SYLHET" in to_upper:
            train_names = ["Parabat Express", "Kalni Express", "Upaban Express"]
        elif "CHITTAGONG" in from_upper or "CHITTAGONG" in to_upper or "CHATTO" in from_upper or "CHATTO" in to_upper:
            train_names = ["Subarna Express", "Sonar Bangla Express", "Mohanagar Provati"]
        elif "COX" in from_upper or "COX" in to_upper:
            train_names = ["Cox's Bazar Express", "Tourist Express"]
        elif "RAJSHAHI" in from_upper or "RAJSHAHI" in to_upper:
            train_names = ["Silk City Express", "Padma Express", "Dhumketu Express"]
        else:
            train_names = ["Jamuna Express", "Ekota Express", "Sundarban Express"]

        # Filter by selected_trains if not "ALL"
        if selected_trains and "ALL" not in [t.upper() for t in selected_trains]:
            selected_trains_upper = [t.upper() for t in selected_trains]
            train_names = [t for t in train_names if any(st in t.upper() for st in selected_trains_upper)]
            if not train_names:
                train_names = selected_trains  # fallback to requested names

        standard_classes = ["Snigdha", "Shovon Chair", "AC_B", "AC_S"]
        if selected_classes and "ALL" not in [c.upper() for c in selected_classes]:
            standard_classes = selected_classes

        # Simulated state transition cycles:
        # Step 0: 0 seats
        # Step 1: 0 seats
        # Step 2: 2 seats (SEAT_AVAILABLE alert)
        # Step 3: 2 seats (no duplicate alert)
        # Step 4: 0 seats (OPPORTUNITY CLOSED)
        # Step 5: 3 seats (NEW SEAT_AVAILABLE alert)
        cycle_pattern = [0, 0, 2, 2, 0, 3, 1, 0]
        pattern_index = step % len(cycle_pattern)
        default_count = cycle_pattern[pattern_index]

        items: List[ParsedSeatItem] = []
        for train in train_names:
            for cls in standard_classes:
                override_key = f"{train.upper()}|{cls.upper()}"
                if override_key in self._manual_overrides:
                    count = self._manual_overrides[override_key]
                else:
                    # Give different classes slightly distinct variations
                    if "SNIGDHA" in cls.upper():
                        count = default_count
                    elif "SHOVON" in cls.upper():
                        count = default_count * 2
                    else:
                        count = max(0, default_count - 1)

                status = "AVAILABLE" if count > 0 else "SOLD_OUT"
                label = f"{count} Seats" if count > 0 else "Sold Out"

                items.append(
                    ParsedSeatItem(
                        train_name=train,
                        class_name=cls,
                        available_count=count,
                        fare=550 if "SNIGDHA" in cls.upper() else (380 if "SHOVON" in cls.upper() else 1100),
                        departure_time="06:30 AM" if "Parabat" in train else "04:30 PM",
                        arrival_time="12:45 PM" if "Parabat" in train else "10:15 PM",
                        status=status,
                        parser_confidence="HIGH",
                        raw_source_label=label,
                    )
                )

        return SearchResult(
            from_station=from_station,
            to_station=to_station,
            journey_date=journey_date,
            passenger_count=passenger_count,
            items=items,
            status="OK",
            source="MOCK",
            timestamp=datetime.utcnow().isoformat(),
        )

    async def open_login_window(self) -> bool:
        # In mock mode, simply toggle session active
        self._session_active = True
        return True

    async def open_booking_page(
        self,
        from_station: str,
        to_station: str,
        journey_date: str,
        train_name: Optional[str] = None,
        class_name: Optional[str] = None,
    ) -> bool:
        import webbrowser
        url = f"https://eticket.railway.gov.bd/booking/train/search?fromcity={from_station}&tocity={to_station}&doj={journey_date}"
        try:
            webbrowser.open(url)
        except Exception:
            pass
        return True

    async def close(self) -> None:
        self._initialized = False
