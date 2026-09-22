import os
import asyncio
import re
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from .base import RailwayAdapter, SearchResult, ParsedSeatItem, SessionStatus

try:
    from playwright.async_api import async_playwright, BrowserContext, Page, Playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Playwright = None
    BrowserContext = None
    Page = None


class OfficialRailwayAdapter(RailwayAdapter):
    """
    Official Bangladesh Railway portal adapter.
    Uses Playwright with a persistent browser profile to interact directly
    with https://eticket.railway.gov.bd/ without circumventing security or CAPTCHA.
    """

    OFFICIAL_BASE_URL = "https://eticket.railway.gov.bd"
    LOGIN_URL = "https://eticket.railway.gov.bd/login"

    def __init__(self, profile_dir: Optional[str] = None, headless: bool = True):
        if profile_dir is None:
            # Default to backend/.browser-profile
            backend_dir = Path(__file__).resolve().parent.parent
            self.profile_dir = str(backend_dir / ".browser-profile")
        else:
            self.profile_dir = profile_dir

        self.headless = headless
        self._playwright: Optional[Any] = None
        self._context: Optional[Any] = None
        self._page: Optional[Any] = None
        self._lock = asyncio.Lock()
        self._last_parse_timestamp: Optional[str] = None
        self._last_error: Optional[str] = None

    async def initialize(self) -> None:
        if not PLAYWRIGHT_AVAILABLE:
            self._last_error = "Playwright is not installed in the Python environment."
            return

        async with self._lock:
            if self._context is not None:
                return

            os.makedirs(self.profile_dir, exist_ok=True)
            self._playwright = await async_playwright().start()

            # Launch persistent context to preserve user login sessions across restarts
            self._context = await self._playwright.chromium.launch_persistent_context(
                user_data_dir=self.profile_dir,
                headless=self.headless,
                viewport={"width": 1280, "height": 800},
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                ],
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            )
            pages = self._context.pages
            self._page = pages[0] if pages else await self._context.new_page()

    async def check_session(self) -> SessionStatus:
        if not PLAYWRIGHT_AVAILABLE:
            return SessionStatus(
                connected=False,
                status="OFFLINE",
                message="Playwright is not installed. Install requirements first.",
            )

        async with self._lock:
            try:
                if self._context is None:
                    await self.initialize()

                if self._page is None:
                    pages = self._context.pages
                    self._page = pages[0] if pages else await self._context.new_page()

                # Navigate or inspect official page
                try:
                    await self._page.goto(self.OFFICIAL_BASE_URL, timeout=20000, wait_until="domcontentloaded")
                except Exception as nav_err:
                    return SessionStatus(
                        connected=False,
                        status="NETWORK_ERROR",
                        message=f"Could not reach official portal: {str(nav_err)[:80]}",
                    )

                content = await self._page.content()
                content_lower = content.lower()

                # Check for anti-bot / Cloudflare / CAPTCHA
                if "verify you are human" in content_lower or "attention required" in content_lower or "cf-turnstile" in content_lower or "g-recaptcha" in content_lower:
                    return SessionStatus(
                        connected=True,
                        status="CAPTCHA_REQUIRED",
                        message="CAPTCHA or security challenge detected. Manual action required.",
                    )

                # Check for logged-in indicators
                logged_in_selectors = [
                    "a[href*='logout']",
                    "button:has-text('Logout')",
                    "button:has-text('Sign Out')",
                    ".user-profile",
                    ".profile-menu",
                    "a[href*='profile']",
                ]

                is_logged_in = False
                for sel in logged_in_selectors:
                    try:
                        el = await self._page.query_selector(sel)
                        if el and await el.is_visible():
                            is_logged_in = True
                            break
                    except Exception:
                        pass

                if is_logged_in:
                    return SessionStatus(
                        connected=True,
                        status="ACTIVE",
                        user_name="Official Railway User",
                        message="Session active and authenticated on official portal.",
                    )

                # Check for login links
                login_indicators = ["a[href*='login']", "button:has-text('Sign In')", "a:has-text('Sign In')", "a:has-text('Login')"]
                for sel in login_indicators:
                    try:
                        el = await self._page.query_selector(sel)
                        if el:
                            return SessionStatus(
                                connected=True,
                                status="LOGIN_REQUIRED",
                                message="Official portal reachable. User login required.",
                            )
                    except Exception:
                        pass

                return SessionStatus(
                    connected=True,
                    status="ACTIVE",
                    message="Official portal reachable.",
                )

            except Exception as e:
                self._last_error = str(e)
                return SessionStatus(
                    connected=False,
                    status="ERROR",
                    message=f"Session check error: {str(e)[:80]}",
                )

    async def open_login_window(self) -> bool:
        """Launch or open a visible browser window for the user to complete login manually."""
        if not PLAYWRIGHT_AVAILABLE:
            return False

        try:
            # If current context is headless, close it and open headed context
            async with self._lock:
                if self._context:
                    try:
                        await self._context.close()
                    except Exception:
                        pass
                    self._context = None
                    self._page = None

                os.makedirs(self.profile_dir, exist_ok=True)
                if self._playwright is None:
                    self._playwright = await async_playwright().start()

                # Launch visible window
                self._context = await self._playwright.chromium.launch_persistent_context(
                    user_data_dir=self.profile_dir,
                    headless=False,
                    viewport={"width": 1280, "height": 800},
                    args=["--disable-blink-features=AutomationControlled"],
                )
                pages = self._context.pages
                self._page = pages[0] if pages else await self._context.new_page()
                await self._page.goto(self.LOGIN_URL)
                return True
        except Exception as e:
            self._last_error = str(e)
            return False

    async def search(
        self,
        from_station: str,
        to_station: str,
        journey_date: str,
        passenger_count: int = 1,
        selected_trains: Optional[List[str]] = None,
        selected_classes: Optional[List[str]] = None,
    ) -> SearchResult:
        if not PLAYWRIGHT_AVAILABLE:
            return SearchResult(
                from_station=from_station,
                to_station=to_station,
                journey_date=journey_date,
                passenger_count=passenger_count,
                status="ERROR",
                error="Playwright is not available in environment.",
                source="OFFICIAL",
            )

        async with self._lock:
            try:
                if self._context is None:
                    await self.initialize()

                if self._page is None:
                    pages = self._context.pages
                    self._page = pages[0] if pages else await self._context.new_page()

                search_url = (
                    f"{self.OFFICIAL_BASE_URL}/booking/train/search?"
                    f"fromcity={from_station.replace(' ', '+')}&"
                    f"tocity={to_station.replace(' ', '+')}&"
                    f"doj={journey_date}"
                )

                try:
                    await self._page.goto(search_url, timeout=25000, wait_until="domcontentloaded")
                    # Wait briefly for dynamic client rendering (Next.js / Vue / Angular on railway.gov.bd)
                    await self._page.wait_for_timeout(3000)
                except Exception as nav_err:
                    return SearchResult(
                        from_station=from_station,
                        to_station=to_station,
                        journey_date=journey_date,
                        passenger_count=passenger_count,
                        status="NETWORK_ERROR",
                        error=f"Navigation failed: {str(nav_err)[:80]}",
                        source="OFFICIAL",
                    )

                page_content = await self._page.content()
                content_lower = page_content.lower()

                # Check for CAPTCHA or blocking
                if "verify you are human" in content_lower or "attention required" in content_lower or "cf-turnstile" in content_lower:
                    return SearchResult(
                        from_station=from_station,
                        to_station=to_station,
                        journey_date=journey_date,
                        passenger_count=passenger_count,
                        status="CAPTCHA_REQUIRED",
                        error="Security challenge or CAPTCHA detected. Monitoring paused.",
                        source="OFFICIAL",
                    )

                if "rate limit" in content_lower or "too many requests" in content_lower:
                    return SearchResult(
                        from_station=from_station,
                        to_station=to_station,
                        journey_date=journey_date,
                        passenger_count=passenger_count,
                        status="RATE_LIMITED",
                        error="Official portal rate limit encountered.",
                        source="OFFICIAL",
                    )

                # Parse train results
                items = await self._parse_official_results(
                    self._page,
                    selected_trains=selected_trains,
                    selected_classes=selected_classes,
                )

                self._last_parse_timestamp = datetime.utcnow().isoformat()

                if not items:
                    # Check if "No trains available" is on page
                    if "no train found" in content_lower or "no trains available" in content_lower:
                        return SearchResult(
                            from_station=from_station,
                            to_station=to_station,
                            journey_date=journey_date,
                            passenger_count=passenger_count,
                            items=[],
                            status="OK",
                            source="OFFICIAL",
                        )
                    # If page structure unrecognized, mark PARSE_ERROR
                    return SearchResult(
                        from_station=from_station,
                        to_station=to_station,
                        journey_date=journey_date,
                        passenger_count=passenger_count,
                        items=[],
                        status="PARSE_ERROR",
                        error="Official page structure could not be parsed confidently.",
                        source="OFFICIAL",
                    )

                return SearchResult(
                    from_station=from_station,
                    to_station=to_station,
                    journey_date=journey_date,
                    passenger_count=passenger_count,
                    items=items,
                    status="OK",
                    source="OFFICIAL",
                )

            except Exception as e:
                self._last_error = str(e)
                return SearchResult(
                    from_station=from_station,
                    to_station=to_station,
                    journey_date=journey_date,
                    passenger_count=passenger_count,
                    items=[],
                    status="ERROR",
                    error=f"Search execution error: {str(e)[:80]}",
                    source="OFFICIAL",
                )

    async def _parse_official_results(
        self,
        page: Any,
        selected_trains: Optional[List[str]] = None,
        selected_classes: Optional[List[str]] = None,
    ) -> List[ParsedSeatItem]:
        """
        Resilient DOM parsing using multiple selector heuristics:
        1. Single trip containers
        2. Semantic train title extraction
        3. Seat class badge extraction
        4. Honest numeric seat count or 'Sold Out' detection
        """
        parsed_items: List[ParsedSeatItem] = []

        # Candidate train card selectors
        train_card_selectors = [
            ".single-trip-wrapper",
            ".trip-box",
            ".search-result-box",
            "div[class*='train-card']",
            "div[class*='trip-wrapper']",
            ".train-item",
        ]

        cards = []
        for selector in train_card_selectors:
            try:
                found = await page.query_selector_all(selector)
                if found and len(found) > 0:
                    cards = found
                    break
            except Exception:
                continue

        if not cards:
            return []

        train_filter = [t.upper() for t in selected_trains] if selected_trains and "ALL" not in [t.upper() for t in selected_trains] else None
        class_filter = [c.upper() for c in selected_classes] if selected_classes and "ALL" not in [c.upper() for c in selected_classes] else None

        for card in cards:
            try:
                card_text = await card.inner_text()
                if not card_text:
                    continue

                # Extract train name
                train_name = "Intercity Express"
                title_selectors = ["h2", "h3", "h4", ".trip-title", ".train-name", "div[class*='name']"]
                for t_sel in title_selectors:
                    try:
                        title_el = await card.query_selector(t_sel)
                        if title_el:
                            t_text = (await title_el.inner_text()).strip()
                            if t_text and len(t_text) > 2:
                                train_name = t_text
                                break
                    except Exception:
                        continue

                # Filter train
                if train_filter and not any(tf in train_name.upper() for tf in train_filter):
                    continue

                # Extract departure / arrival times if present
                times = re.findall(r"\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b", card_text)
                dept_time = times[0] if len(times) >= 1 else None
                arr_time = times[1] if len(times) >= 2 else None

                # Extract seat class containers within this train card
                seat_box_selectors = [
                    ".seat-class-box",
                    ".class-box",
                    "div[class*='seat-box']",
                    "div[class*='class-wrapper']",
                    ".single-seat-class",
                    "button[class*='seat']",
                ]

                seat_boxes = []
                for sb_sel in seat_box_selectors:
                    try:
                        found_boxes = await card.query_selector_all(sb_sel)
                        if found_boxes and len(found_boxes) > 0:
                            seat_boxes = found_boxes
                            break
                    except Exception:
                        continue

                if seat_boxes:
                    for sb in seat_boxes:
                        sb_text = (await sb.inner_text()).strip()
                        if not sb_text:
                            continue

                        # Detect class name (Snigdha, AC_S, AC_B, Shovon, Shovon Chair, etc.)
                        class_name = self._extract_class_name(sb_text)
                        if class_filter and not any(cf in class_name.upper() for cf in class_filter):
                            continue

                        available_count, status, label = self._extract_availability(sb_text)
                        fare = self._extract_fare(sb_text)

                        parsed_items.append(
                            ParsedSeatItem(
                                train_name=train_name,
                                class_name=class_name,
                                available_count=available_count,
                                fare=fare,
                                departure_time=dept_time,
                                arrival_time=arr_time,
                                status=status,
                                parser_confidence="HIGH" if available_count >= 0 else "UNCERTAIN",
                                raw_source_label=label,
                            )
                        )
                else:
                    # Fallback text parsing if sub-boxes not structured
                    classes_found = re.findall(r"(SNIGDHA|SHOVON|AC_S|AC_B|AC_CHAIR|SHOVON CHAIR|SHULOV)", card_text, re.IGNORECASE)
                    for cls in set(classes_found):
                        cls_norm = cls.title()
                        if class_filter and not any(cf in cls_norm.upper() for cf in class_filter):
                            continue
                        count, status, label = self._extract_availability(card_text)
                        parsed_items.append(
                            ParsedSeatItem(
                                train_name=train_name,
                                class_name=cls_norm,
                                available_count=count,
                                fare=None,
                                departure_time=dept_time,
                                arrival_time=arr_time,
                                status=status,
                                parser_confidence="MEDIUM",
                                raw_source_label=label,
                            )
                        )
            except Exception:
                continue

        return parsed_items

    def _extract_class_name(self, text: str) -> str:
        text_upper = text.upper()
        if "SNIGDHA" in text_upper:
            return "Snigdha"
        elif "AC_B" in text_upper or "AC BERTH" in text_upper:
            return "AC_B"
        elif "AC_S" in text_upper or "AC SEAT" in text_upper:
            return "AC_S"
        elif "SHOVON CHAIR" in text_upper:
            return "Shovon Chair"
        elif "SHOVON" in text_upper:
            return "Shovon"
        elif "SHULOV" in text_upper:
            return "Shulov"
        elif "F_BERTH" in text_upper:
            return "First Berth"
        return "Standard"

    def _extract_availability(self, text: str) -> tuple[int, str, str]:
        text_clean = text.strip()
        text_lower = text_clean.lower()

        if "sold out" in text_lower or "0 seat" in text_lower or "booked" in text_lower or "unavailable" in text_lower:
            return 0, "SOLD_OUT", "Sold Out"

        # Match patterns like "5 Available", "Available: 2", "Seats: 3", "3 Seats"
        count_match = re.search(r"(\d+)\s*(?:available|seat|left|ticket)", text_lower)
        if count_match:
            try:
                cnt = int(count_match.group(1))
                return cnt, "AVAILABLE" if cnt > 0 else "SOLD_OUT", f"{cnt} Seats"
            except ValueError:
                pass

        # Standalone positive integer
        num_matches = re.findall(r"\b(\d{1,3})\b", text_clean)
        for num in num_matches:
            val = int(num)
            if 0 < val <= 500:  # plausible train seat availability
                return val, "AVAILABLE", f"{val} Seats"

        # Check explicit "Available" keyword without exact number
        if "available" in text_lower:
            return 1, "AVAILABLE", "Available (>0)"

        return 0, "SOLD_OUT", "Sold Out"

    def _extract_fare(self, text: str) -> Optional[int]:
        fare_match = re.search(r"(?:৳|tk\.?|bdt)\s*(\d+)", text, re.IGNORECASE)
        if fare_match:
            try:
                return int(fare_match.group(1))
            except ValueError:
                pass
        return None

    async def open_booking_page(
        self,
        from_station: str,
        to_station: str,
        journey_date: str,
        train_name: Optional[str] = None,
        class_name: Optional[str] = None,
    ) -> bool:
        url = (
            f"{self.OFFICIAL_BASE_URL}/booking/train/search?"
            f"fromcity={from_station.replace(' ', '+')}&"
            f"tocity={to_station.replace(' ', '+')}&"
            f"doj={journey_date}"
        )
        import webbrowser
        try:
            webbrowser.open(url)
            return True
        except Exception:
            return False

    async def close(self) -> None:
        async with self._lock:
            if self._context:
                try:
                    await self._context.close()
                except Exception:
                    pass
                self._context = None
                self._page = None

            if self._playwright:
                try:
                    await self._playwright.stop()
                except Exception:
                    pass
                self._playwright = None
