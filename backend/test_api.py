from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_system_flow():
    # 1. Root
    res = client.get("/")
    assert res.status_code == 200

    # 2. SignIn with demo user
    res = client.post(
        "/auth/signin",
        json={"email": "demo@railway.gov.bd", "password": "password123"},
    )
    assert res.status_code == 200
    token = "Bearer " + res.json()["access_token"]

    # 3. Stations
    res = client.get("/place/all")
    assert res.status_code == 200
    assert len(res.json()) > 0

    # 4. Trains
    res = client.get("/train/all")
    assert res.status_code == 200
    assert len(res.json()) > 0

    # 5. Path Dhaka (1) -> Chittagong (3)
    res = client.get("/path/1/3")
    assert res.status_code == 200
    assert len(res.json()) > 0

    # 6. Available seats
    res = client.get("/booking/train/1/available/seats?dflag=0&date=2026-09-25")
    assert res.status_code == 200
    avail = res.json()
    assert len(avail) > 0
    seat_id = avail[0]["id"]

    # 7. Book a seat
    res = client.put(f"/booking/seat/{seat_id}?dflag=0&date=2026-09-25&count=1")
    assert res.status_code == 200

    # 8. Create ticket
    ticket_payload = {
        "train_id": 1,
        "train_name": "Subarna Express (701/702)",
        "seat_id": seat_id,
        "seat_type": "Shovon Chair",
        "seat_numbers": [1],
        "from_station": "Dhaka",
        "to_station": "Chittagong",
        "journey_date": "2026-09-25",
        "departure_time": "16:30",
        "arrival_time": "21:30",
        "total_price": 405,
        "count": 1,
        "dflag": 0,
    }
    res = client.post(
        "/booking/ticket",
        json=ticket_payload,
        headers={"Authorization": token},
    )
    assert res.status_code == 201
    ticket_id = res.json()["id"]

    # 9. Get user tickets
    res = client.get("/booking/user/my-tickets", headers={"Authorization": token})
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 10. Cancel ticket
    res = client.put(
        f"/booking/ticket/{ticket_id}/cancel",
        headers={"Authorization": token},
    )
    assert res.status_code == 200

    print("All backend API tests passed successfully!")


if __name__ == "__main__":
    test_system_flow()