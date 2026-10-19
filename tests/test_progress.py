"""Progress tests (Step 7): passing a quiz saves the lesson as finished."""

from datetime import datetime, timezone

import backend.main
from backend.progress import get_completion, record_completion
from backend.seed_data import QUIZZES


def answers(lesson_id, correct):
    """Answers with the first `correct` questions right and the rest wrong."""
    right = [q["answer"] for q in QUIZZES[lesson_id]]
    return [a if i < correct else (a + 1) % 3 for i, a in enumerate(right)]


def pass_quiz(client, lesson_id, correct=3):
    return client.post(f"/api/lessons/{lesson_id}/quiz", json={"answers": answers(lesson_id, correct)}).json()


def test_progress_starts_empty(client):
    progress = client.get("/api/progress").json()

    assert progress["completed_count"] == 0
    assert progress["total_lessons"] == 6
    assert progress["completed"] == []


def test_passing_a_quiz_saves_the_lesson(client):
    grade = pass_quiz(client, "bikes-frame")

    assert grade["saved"] is True
    progress = client.get("/api/progress").json()
    assert progress["completed_count"] == 1
    assert progress["completed"][0]["lesson_id"] == "bikes-frame"
    assert progress["completed"][0]["best_score"] == 3


def test_failing_a_quiz_saves_nothing(client):
    grade = pass_quiz(client, "bikes-frame", correct=1)

    assert grade["saved"] is False
    assert client.get("/api/progress").json()["completed_count"] == 0


def test_retaking_keeps_the_best_score(client):
    pass_quiz(client, "bikes-frame", correct=3)
    pass_quiz(client, "bikes-frame", correct=2)

    progress = client.get("/api/progress").json()
    assert progress["completed_count"] == 1  # still one row, not two
    assert progress["completed"][0]["best_score"] == 3


def test_retaking_keeps_the_first_completion_date(db):
    first = datetime(2026, 10, 1, tzinfo=timezone.utc)
    later = datetime(2026, 10, 5, tzinfo=timezone.utc)

    record_completion(db, "bikes-frame", 2, now=first)
    record_completion(db, "bikes-frame", 3, now=later)

    completion = get_completion(db, "bikes-frame")
    assert completion["completed_at"] == first.isoformat()
    assert completion["best_score"] == 3


def test_lessons_list_shows_completed(client):
    pass_quiz(client, "bikes-frame")

    lessons = client.get("/api/topics/bikes/lessons").json()
    completed = {lesson["id"]: lesson["completed"] for lesson in lessons}
    assert completed == {"bikes-frame": True, "bikes-drivetrain": False, "bikes-brakes": False}


def test_topics_count_completed_lessons(client):
    pass_quiz(client, "bikes-frame")
    pass_quiz(client, "bikes-brakes")

    topics = {topic["id"]: topic for topic in client.get("/api/topics").json()}
    assert topics["bikes"]["completed_count"] == 2
    assert topics["bikes"]["lesson_count"] == 3
    assert topics["space"]["completed_count"] == 0


def test_lesson_shows_its_completion(client, monkeypatch):
    monkeypatch.setattr(backend.main, "fetch_summary", lambda title: {"title": title, "extract": "", "image": None, "url": ""})

    assert client.get("/api/lessons/bikes-frame").json()["completion"] is None
    pass_quiz(client, "bikes-frame", correct=2)
    assert client.get("/api/lessons/bikes-frame").json()["completion"]["best_score"] == 2


def test_delete_progress_resets_everything(client):
    pass_quiz(client, "bikes-frame")

    response = client.delete("/api/progress")

    assert response.status_code == 204
    assert client.get("/api/progress").json()["completed_count"] == 0
