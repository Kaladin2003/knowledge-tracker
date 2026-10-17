"""API tests.

TestClient calls the FastAPI app directly in memory:
no server has to run, and no real network is used.
"""

from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_topics_returns_all_topics():
    response = client.get("/api/topics")

    assert response.status_code == 200
    topics = response.json()
    assert len(topics) >= 2
    # Every topic has the fields the web page needs
    for topic in topics:
        assert set(topic) == {"id", "title", "emoji", "description"}


def test_topic_ids_are_unique():
    ids = [topic["id"] for topic in client.get("/api/topics").json()]

    assert len(ids) == len(set(ids))


def test_get_one_topic():
    response = client.get("/api/topics/bikes")

    assert response.status_code == 200
    assert response.json()["title"] == "Bikes"


def test_unknown_topic_returns_404():
    response = client.get("/api/topics/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Topic not found"}


def test_home_page_is_served():
    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Knowledge Garden" in response.text
