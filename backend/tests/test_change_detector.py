import pytest
import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.change_detector import AvailabilityChangeDetector


def test_zero_to_zero_no_alert():
    detector = AvailabilityChangeDetector()
    res = detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 0)
    assert not res.is_alert
    assert not res.is_closed
    assert res.event_type is None
    assert res.previous_count == 0
    assert res.current_count == 0


def test_zero_to_one_triggers_alert():
    detector = AvailabilityChangeDetector()
    # Initial 0
    detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 0)
    # Transition 0 -> 1
    res = detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 1)
    assert res.is_alert
    assert res.event_type == "SEAT_AVAILABLE"
    assert res.previous_count == 0
    assert res.current_count == 1
    assert detector.is_opportunity_open("w1", "Parabat Express", "Snigdha")


def test_zero_to_five_triggers_alert():
    detector = AvailabilityChangeDetector()
    res = detector.evaluate_transition("w1", "Subarna Express", "AC_S", 5)
    assert res.is_alert
    assert res.event_type == "SEAT_AVAILABLE"
    assert res.previous_count == 0
    assert res.current_count == 5


def test_one_to_two_no_duplicate_alert():
    detector = AvailabilityChangeDetector()
    # 0 -> 1 (alerts)
    res1 = detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 1)
    assert res1.is_alert
    # 1 -> 2 (no duplicate alert)
    res2 = detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 2)
    assert not res2.is_alert
    assert not res2.is_closed
    assert res2.event_type is None
    assert res2.previous_count == 1
    assert res2.current_count == 2
    assert detector.is_opportunity_open("w1", "Parabat Express", "Snigdha")


def test_two_to_one_no_duplicate_alert():
    detector = AvailabilityChangeDetector()
    detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 2)
    # 2 -> 1
    res = detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 1)
    assert not res.is_alert
    assert not res.is_closed
    assert res.previous_count == 2
    assert res.current_count == 1


def test_one_to_zero_closes_event():
    detector = AvailabilityChangeDetector()
    detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 1)
    # 1 -> 0
    res = detector.evaluate_transition("w1", "Parabat Express", "Snigdha", 0)
    assert not res.is_alert
    assert res.is_closed
    assert res.event_type == "SEAT_SOLD_OUT"
    assert res.previous_count == 1
    assert res.current_count == 0
    assert not detector.is_opportunity_open("w1", "Parabat Express", "Snigdha")


def test_zero_to_three_after_sold_out_creates_new_alert():
    detector = AvailabilityChangeDetector()
    # Cycle: 0 -> 2 -> 0 -> 3
    res1 = detector.evaluate_transition("w1", "Kalni Express", "Shovon", 2)
    assert res1.is_alert

    res2 = detector.evaluate_transition("w1", "Kalni Express", "Shovon", 0)
    assert res2.is_closed

    # Newly available again!
    res3 = detector.evaluate_transition("w1", "Kalni Express", "Shovon", 3)
    assert res3.is_alert
    assert res3.event_type == "SEAT_AVAILABLE"
    assert res3.previous_count == 0
    assert res3.current_count == 3


def test_parser_error_does_not_trigger_alert():
    detector = AvailabilityChangeDetector()
    # In uncertain status, count > 0 must NOT trigger alert
    res = detector.evaluate_transition(
        "w1",
        "Cox's Bazar Express",
        "Snigdha",
        5,
        parser_confidence="UNCERTAIN",
        status="PARSE_ERROR",
    )
    assert not res.is_alert
    assert not res.is_closed
    assert res.event_type is None
    # Verify confirmed state did not get corrupted
    assert detector.get_last_count("w1", "Cox's Bazar Express", "Snigdha") == 0


def test_session_expiry_does_not_trigger_false_availability():
    detector = AvailabilityChangeDetector()
    res = detector.evaluate_transition(
        "w1",
        "Parabat Express",
        "Snigdha",
        2,
        parser_confidence="UNCERTAIN",
        status="LOGIN_REQUIRED",
    )
    assert not res.is_alert
    assert detector.get_last_count("w1", "Parabat Express", "Snigdha") == 0
