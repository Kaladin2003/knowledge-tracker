"""API tests.

TestClient calls the FastAPI app directly in memory:
no server has to run, and no real network is used.
"""

from fastapi.testclient import TestClient

from backend.main import LESSONS, TOPICS, app

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


# --- Lessons (Step 3) ---


def test_list_lessons_of_a_topic():
    response = client.get("/api/topics/bikes/lessons")

    assert response.status_code == 200
    lessons = response.json()
    assert len(lessons) == 3
    # Only lessons of this topic
    assert all(lesson["topic_id"] == "bikes" for lesson in lessons)


def test_lessons_are_in_learning_order():
    lessons = client.get("/api/topics/space/lessons").json()
    orders = [lesson["order"] for lesson in lessons]

    assert orders == sorted(orders)


def test_lessons_of_unknown_topic_returns_404():
    response = client.get("/api/topics/does-not-exist/lessons")

    assert response.status_code == 404


def test_every_lesson_belongs_to_an_existing_topic():
    # Checks the data itself: a typo in a topic_id would hide a lesson forever
    topic_ids = {topic["id"] for topic in TOPICS}
    for lesson in LESSONS:
        assert lesson["topic_id"] in topic_ids, lesson["id"]


def test_topic_page_is_served():
    response = client.get("/topic.html")

    assert response.status_code == 200
    assert "Lessons" in response.text
