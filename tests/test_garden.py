"""Garden tests (Step 9)."""

from datetime import datetime, timezone

import pytest

from backend import streak
from backend.garden import garden_size
from backend.seed_data import QUIZZES


def pass_quiz(client, lesson_id, correct=3):
    right = [q["answer"] for q in QUIZZES[lesson_id]]
    answers = [a if i < correct else (a + 1) % 3 for i, a in enumerate(right)]
    client.post(f"/api/lessons/{lesson_id}/quiz", json={"answers": answers})


@pytest.mark.parametrize(
    ("trees", "size"),
    [(0, 6), (1, 6), (36, 6), (37, 7), (49, 7), (50, 8)],
)
def test_garden_size_grows_when_full(trees, size):
    assert garden_size(trees) == size


def test_empty_garden(client):
    assert client.get("/api/garden").json() == {"size": 6, "trees": []}


def test_each_finished_lesson_plants_one_tree(client):
    pass_quiz(client, "bikes-frame")
    pass_quiz(client, "space-light-year")

    trees = client.get("/api/garden").json()["trees"]
    assert len(trees) == 2


def test_tree_says_why_it_was_planted(client):
    pass_quiz(client, "bikes-frame", correct=2)

    tree = client.get("/api/garden").json()["trees"][0]
    assert tree["lesson_title"] == "The frame: the bike's skeleton"
    assert tree["topic_title"] == "Bikes"
    assert tree["topic_emoji"] == "🚲"
    assert tree["best_score"] == 2
    assert tree["planted_at"]


def test_trees_are_in_planting_order(client, monkeypatch):
    monkeypatch.setattr(streak, "utc_now", lambda: datetime(2026, 10, 18, 9, 0, tzinfo=timezone.utc))
    pass_quiz(client, "space-light-year")
    monkeypatch.setattr(streak, "utc_now", lambda: datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc))
    pass_quiz(client, "bikes-frame")

    ids = [tree["lesson_id"] for tree in client.get("/api/garden").json()["trees"]]
    assert ids == ["space-light-year", "bikes-frame"]


def test_retaking_does_not_plant_a_second_tree(client):
    pass_quiz(client, "bikes-frame", correct=2)
    pass_quiz(client, "bikes-frame", correct=3)

    trees = client.get("/api/garden").json()["trees"]
    assert len(trees) == 1
    assert trees[0]["best_score"] == 3  # the tree grows instead


def test_failed_quiz_plants_nothing(client):
    pass_quiz(client, "bikes-frame", correct=1)

    assert client.get("/api/garden").json()["trees"] == []


def test_pages_tell_the_browser_to_check_for_updates(client):
    assert client.get("/").headers["Cache-Control"] == "no-cache"
    assert client.get("/app.js").headers["Cache-Control"] == "no-cache"
