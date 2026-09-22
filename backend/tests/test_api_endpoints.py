import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from main import app
from services.watch_scheduler import scheduler

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "ok"
    assert "worker" in data
    assert "browser" in data
    assert "mode" in data


def test_diagnostics_endpoint():
    response = client.get("/api/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "OK"
    assert "browser_session" in data
    assert "mode" in data


def test_watch_crud_and_lifecycle():
    # 1. Create a watch
    create_payload = {
        "from_station": "DHAKA",
        "to_station": "SYLHET",
        "journey_date": "2026-09-30",
        "passenger_count": 1,
        "selected_trains": ["Parabat Express"],
        "selected_classes": ["Snigdha"],
    }
    create_res = client.post("/api/watches", json=create_payload)
    assert create_res.status_code == 201
    watch_data = create_res.json()
    watch_id = watch_data["id"]
    assert watch_data["from_station"] == "DHAKA"
    assert watch_data["to_station"] == "SYLHET"
    assert watch_data["current_status"] == "STOPPED"

    # 2. List watches
    list_res = client.get("/api/watches")
    assert list_res.status_code == 200
    watches = list_res.json()
    assert any(w["id"] == watch_id for w in watches)

    # 3. Search Once (Mock Mode by default in tests)
    scheduler.set_mode("MOCK")
    search_res = client.post(f"/api/watches/{watch_id}/search-once")
    assert search_res.status_code == 200
    res_data = search_res.json()
    assert res_data["watch_id"] == watch_id
    assert res_data["source"] == "MOCK"
    assert "items" in res_data

    # 4. View history
    history_res = client.get(f"/api/watches/{watch_id}/history")
    assert history_res.status_code == 200
    hist = history_res.json()
    assert len(hist["snapshots"]) > 0

    # 5. Stop monitoring
    stop_res = client.post(f"/api/watches/{watch_id}/stop")
    assert stop_res.status_code == 200

    # 6. Delete watch
    del_res = client.delete(f"/api/watches/{watch_id}")
    assert del_res.status_code == 200


def test_alerts_test_and_stop():
    # Test alert emission
    test_res = client.post("/api/alerts/test")
    assert test_res.status_code == 200
    assert test_res.json()["message"] == "Test alert emitted successfully."

    # Stop alarm
    stop_res = client.post("/api/alerts/stop-alarm")
    assert stop_res.status_code == 200
    assert stop_res.json()["state"] == "STOPPED"


def test_session_status_endpoint():
    res = client.get("/api/session/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "connected" in data
