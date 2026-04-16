from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_train():
    response = client.get("train/get/all")

    assert response.status_code == 200

    print(response.json())