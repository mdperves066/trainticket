"""
Availability State Transition & Change Detection Engine.

Detects seat availability transitions strictly based on verified parsed state:
- 0 -> 0: no alert
- 0 -> >0: SEAT_AVAILABLE alert triggered (opportunity opened)
- >0 -> >0: no duplicate alert (opportunity remains open, state updated)
- >0 -> 0: SEAT_SOLD_OUT event (active opportunity closed)
- 0 -> >0 (after being closed): New SEAT_AVAILABLE alert triggered
- PARSE_ERROR / UNCERTAIN: no alert generated
"""

from typing import Dict, Tuple, Optional, List
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class TransitionResult:
    train_name: str
    class_name: str
    previous_count: int
    current_count: int
    is_alert: bool
    is_closed: bool
    event_type: Optional[str] = None  # SEAT_AVAILABLE, SEAT_SOLD_OUT, or None
    message: str = ""


class AvailabilityChangeDetector:
    """
    State machine that tracks confirmed seat availability and triggers
    actionable, non-duplicate availability events.
    """

    def __init__(self):
        # Key: (watch_id, train_name, class_name) -> int (last confirmed count)
        self._confirmed_state: Dict[Tuple[str, str, str], int] = {}
        # Key: (watch_id, train_name, class_name) -> bool (active open opportunity)
        self._active_opportunities: Dict[Tuple[str, str, str], bool] = {}

    def get_last_count(self, watch_id: str, train_name: str, class_name: str) -> int:
        return self._confirmed_state.get((watch_id, train_name, class_name), 0)

    def is_opportunity_open(self, watch_id: str, train_name: str, class_name: str) -> bool:
        return self._active_opportunities.get((watch_id, train_name, class_name), False)

    def evaluate_transition(
        self,
        watch_id: str,
        train_name: str,
        class_name: str,
        current_count: int,
        parser_confidence: str = "HIGH",
        status: str = "AVAILABLE",
    ) -> TransitionResult:
        """
        Evaluate a single train-class item.
        Guarantees that uncertain or erroneous parsing never emits false alarms.
        """
        # If parser is uncertain or errored, do NOT trigger alerts or mutate confirmed state
        if parser_confidence == "UNCERTAIN" or status in ("PARSE_ERROR", "ERROR", "UNCERTAIN"):
            return TransitionResult(
                train_name=train_name,
                class_name=class_name,
                previous_count=self.get_last_count(watch_id, train_name, class_name),
                current_count=0,
                is_alert=False,
                is_closed=False,
                event_type=None,
                message="Parser uncertain or error encountered; suppressed alert.",
            )

        key = (watch_id, train_name, class_name)
        previous_count = self._confirmed_state.get(key, 0)
        curr = max(0, current_count)

        # Update confirmed state
        self._confirmed_state[key] = curr

        # Transition 1: 0 -> >0 (Brand new seat availability detected)
        if previous_count == 0 and curr > 0:
            self._active_opportunities[key] = True
            return TransitionResult(
                train_name=train_name,
                class_name=class_name,
                previous_count=previous_count,
                current_count=curr,
                is_alert=True,
                is_closed=False,
                event_type="SEAT_AVAILABLE",
                message=f"Seat availability detected: {train_name} [{class_name}] changed from 0 to {curr} seats.",
            )

        # Transition 2: >0 -> 0 (Opportunity closed / tickets sold out)
        elif previous_count > 0 and curr == 0:
            self._active_opportunities[key] = False
            return TransitionResult(
                train_name=train_name,
                class_name=class_name,
                previous_count=previous_count,
                current_count=curr,
                is_alert=False,
                is_closed=True,
                event_type="SEAT_SOLD_OUT",
                message=f"Opportunity closed: {train_name} [{class_name}] seats sold out (0 available).",
            )

        # Transition 3: >0 -> >0 (Opportunity continues with same or changed positive count)
        elif previous_count > 0 and curr > 0:
            # Opportunity already active - do NOT trigger duplicate alert
            return TransitionResult(
                train_name=train_name,
                class_name=class_name,
                previous_count=previous_count,
                current_count=curr,
                is_alert=False,
                is_closed=False,
                event_type=None,
                message=f"Opportunity continuing: {train_name} [{class_name}] still available ({curr} seats).",
            )

        # Transition 4: 0 -> 0 (Remains unavailable)
        else:
            self._active_opportunities[key] = False
            return TransitionResult(
                train_name=train_name,
                class_name=class_name,
                previous_count=0,
                current_count=0,
                is_alert=False,
                is_closed=False,
                event_type=None,
                message=f"No seats: {train_name} [{class_name}] remains sold out.",
            )

    def reset_watch(self, watch_id: str) -> None:
        """Clear memory for a deleted or reset watch."""
        keys_to_del = [k for k in self._confirmed_state.keys() if k[0] == watch_id]
        for k in keys_to_del:
            self._confirmed_state.pop(k, None)
            self._active_opportunities.pop(k, None)
