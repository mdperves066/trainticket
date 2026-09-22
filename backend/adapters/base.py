from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
from utils.timezone import now_utc_iso


@dataclass
class ParsedSeatItem:
    train_name: str
    class_name: str
    available_count: int
    fare: Optional[int] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    status: str = "AVAILABLE"  # AVAILABLE, SOLD_OUT, UNCERTAIN, PARSE_ERROR
    parser_confidence: str = "HIGH"  # HIGH, MEDIUM, LOW, UNCERTAIN
    raw_source_label: Optional[str] = None


@dataclass
class SearchResult:
    from_station: str
    to_station: str
    journey_date: str
    passenger_count: int
    items: List[ParsedSeatItem] = field(default_factory=list)
    status: str = "OK"  # OK, PARSE_ERROR, LOGIN_REQUIRED, CAPTCHA_REQUIRED, NETWORK_ERROR, RATE_LIMITED
    error: Optional[str] = None
    source: str = "OFFICIAL"  # OFFICIAL or MOCK
    timestamp: str = field(default_factory=now_utc_iso)


@dataclass
class SessionStatus:
    connected: bool = False
    status: str = "OFFLINE"  # ACTIVE, LOGIN_REQUIRED, CAPTCHA_REQUIRED, EXPIRED, OFFLINE
    user_name: Optional[str] = None
    message: str = "Worker offline"
    last_checked: str = field(default_factory=now_utc_iso)



class RailwayAdapter(ABC):
    """
    Abstract Base Class for Railway Adapters.
    All interactions with the official Bangladesh Railway portal (or mock environment)
    are abstracted behind this interface.
    """

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize browser, session, or mock state."""
        pass

    @abstractmethod
    async def check_session(self) -> SessionStatus:
        """Inspect current session on official portal."""
        pass

    @abstractmethod
    async def search(
        self,
        from_station: str,
        to_station: str,
        journey_date: str,
        passenger_count: int = 1,
        selected_trains: Optional[List[str]] = None,
        selected_classes: Optional[List[str]] = None,
    ) -> SearchResult:
        """Query availability for the given journey parameters."""
        pass

    @abstractmethod
    async def open_login_window(self) -> bool:
        """Open or focus a visible browser window for the user to authenticate manually."""
        pass

    @abstractmethod
    async def open_booking_page(
        self,
        from_station: str,
        to_station: str,
        journey_date: str,
        train_name: Optional[str] = None,
        class_name: Optional[str] = None,
    ) -> bool:
        """Open official portal directly to the search or booking page."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Gracefully release browser or network resources."""
        pass
