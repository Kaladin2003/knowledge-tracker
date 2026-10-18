"""API tests.

TestClient calls the FastAPI app directly in memory:
no server has to run, and no real network is used.
"""

from fastapi.testclient import TestClient

import backend.main
from backend.main import LESSONS, TOPICS, app
from backend.wikipedia import ArticleNotFound, WikipediaError

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


# --- Lesson page with Wikipedia content (Step 4) ---
# monkeypatch replaces backend.main.fetch_summary, so these tests never call Wikipedia.

FAKE_CONTENT = {
    "title": "Bicycle frame",
    "extract": "A bicycle frame is the main component of a bicycle.",
    "image": None,
    "url": "https://en.wikipedia.org/wiki/Bicycle_frame",
}


def test_get_lesson_with_wikipedia_content(monkeypatch):
    monkeypatch.setattr(backend.main, "fetch_summary", lambda title: FAKE_CONTENT)

    response = client.get("/api/lessons/bikes-frame")

    assert response.status_code == 200
    lesson = response.json()
    assert lesson["title"] == "The frame: the bike's skeleton"
    assert lesson["content"]["extract"].startswith("A bicycle frame")
    assert lesson["source"]["url"] == FAKE_CONTENT["url"]


def test_unknown_lesson_returns_404():
    response = client.get("/api/lessons/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Lesson not found"}


def test_missing_wikipedia_article_returns_404(monkeypatch):
    def not_found(title):
        raise ArticleNotFound("No Wikipedia article called 'x'")

    monkeypatch.setattr(backend.main, "fetch_summary", not_found)

    assert client.get("/api/lessons/bikes-frame").status_code == 404


def test_wikipedia_down_returns_502(monkeypatch):
    def down(title):
        raise WikipediaError("Could not reach Wikipedia")

    monkeypatch.setattr(backend.main, "fetch_summary", down)

    response = client.get("/api/lessons/bikes-frame")
    assert response.status_code == 502


def test_every_lesson_has_a_wikipedia_title():
    for lesson in LESSONS:
        assert lesson["wiki_title"], lesson["id"]


def test_lesson_page_is_served():
    response = client.get("/lesson.html")

    assert response.status_code == 200
