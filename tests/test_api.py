"""API tests.

The "client" and "db" arguments are fixtures from conftest.py:
pytest creates them for each test, with a fresh test database.
"""

import backend.main
from backend.seed_data import QUIZZES
from backend.wikipedia import ArticleNotFound, WikipediaError


def correct_answers(lesson_id):
    return [q["answer"] for q in QUIZZES[lesson_id]]


# --- Basics (Steps 1-2) ---


def test_health_returns_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_topics_returns_all_topics(client):
    response = client.get("/api/topics")

    assert response.status_code == 200
    topics = response.json()
    assert len(topics) >= 2
    # Every topic has the fields the web page needs
    for topic in topics:
        assert set(topic) == {"id", "title", "emoji", "description"}


def test_get_one_topic(client):
    response = client.get("/api/topics/bikes")

    assert response.status_code == 200
    assert response.json()["title"] == "Bikes"


def test_unknown_topic_returns_404(client):
    response = client.get("/api/topics/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Topic not found"}


def test_home_page_is_served(client):
    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Knowledge Garden" in response.text


# --- Lessons (Step 3) ---


def test_list_lessons_of_a_topic(client):
    response = client.get("/api/topics/bikes/lessons")

    assert response.status_code == 200
    lessons = response.json()
    assert len(lessons) == 3
    assert all(lesson["topic_id"] == "bikes" for lesson in lessons)


def test_lessons_are_in_learning_order(client):
    lessons = client.get("/api/topics/space/lessons").json()
    positions = [lesson["position"] for lesson in lessons]

    assert positions == sorted(positions)


def test_lessons_of_unknown_topic_returns_404(client):
    assert client.get("/api/topics/does-not-exist/lessons").status_code == 404


def test_topic_page_is_served(client):
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


def test_get_lesson_with_wikipedia_content(client, monkeypatch):
    monkeypatch.setattr(backend.main, "fetch_summary", lambda title: FAKE_CONTENT)

    response = client.get("/api/lessons/bikes-frame")

    assert response.status_code == 200
    lesson = response.json()
    assert lesson["title"] == "The frame: the bike's skeleton"
    assert lesson["content"]["extract"].startswith("A bicycle frame")
    assert lesson["source"]["url"] == FAKE_CONTENT["url"]


def test_unknown_lesson_returns_404(client):
    response = client.get("/api/lessons/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Lesson not found"}


def test_missing_wikipedia_article_returns_404(client, monkeypatch):
    def not_found(title):
        raise ArticleNotFound("No Wikipedia article called 'x'")

    monkeypatch.setattr(backend.main, "fetch_summary", not_found)

    assert client.get("/api/lessons/bikes-frame").status_code == 404


def test_wikipedia_down_returns_502(client, monkeypatch):
    def down(title):
        raise WikipediaError("Could not reach Wikipedia")

    monkeypatch.setattr(backend.main, "fetch_summary", down)

    assert client.get("/api/lessons/bikes-frame").status_code == 502


def test_lesson_page_is_served(client):
    assert client.get("/lesson.html").status_code == 200


# --- Quiz (Step 5) ---


def test_quiz_questions_hide_the_answers(client):
    response = client.get("/api/lessons/bikes-frame/quiz")

    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 3
    for question in questions:
        assert set(question) == {"question", "options"}  # no "answer", no "explanation"


def test_quiz_questions_come_in_order(client):
    questions = client.get("/api/lessons/bikes-frame/quiz").json()

    assert [q["question"] for q in questions] == [q["question"] for q in QUIZZES["bikes-frame"]]


def test_quiz_all_correct_passes(client):
    response = client.post("/api/lessons/bikes-frame/quiz", json={"answers": correct_answers("bikes-frame")})

    assert response.status_code == 200
    grade = response.json()
    assert grade["score"] == 3
    assert grade["passed"] is True


def test_quiz_two_correct_still_passes(client):
    answers = correct_answers("bikes-frame")
    answers[0] = (answers[0] + 1) % 3  # make the first answer wrong

    grade = client.post("/api/lessons/bikes-frame/quiz", json={"answers": answers}).json()

    assert grade["score"] == 2
    assert grade["passed"] is True
    assert grade["results"][0]["correct"] is False


def test_quiz_one_correct_fails(client):
    answers = [(a + 1) % 3 for a in correct_answers("bikes-frame")]
    answers[0] = correct_answers("bikes-frame")[0]

    grade = client.post("/api/lessons/bikes-frame/quiz", json={"answers": answers}).json()

    assert grade["score"] == 1
    assert grade["passed"] is False


def test_quiz_wrong_number_of_answers_returns_400(client):
    assert client.post("/api/lessons/bikes-frame/quiz", json={"answers": [0]}).status_code == 400


def test_quiz_invalid_body_returns_422(client):
    # Pydantic rejects data that does not match QuizAnswers
    assert client.post("/api/lessons/bikes-frame/quiz", json={"answers": "abc"}).status_code == 422


def test_quiz_of_unknown_lesson_returns_404(client):
    assert client.get("/api/lessons/does-not-exist/quiz").status_code == 404
