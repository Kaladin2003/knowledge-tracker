"""Streak tests (Step 8).

Most tests call calculate_streak() with plain dates: no database, no clock.
The API tests fake the clock by replacing streak.utc_now.
"""

from datetime import date, datetime, timedelta, timezone

import pytest

from backend import streak
from backend.seed_data import QUIZZES
from backend.streak import calculate_streak, get_timezone, local_day, longest_run

TODAY = date(2026, 10, 19)


def days_ago(*numbers):
    """days_ago(0, 1, 2) -> {today, yesterday, the day before}"""
    return {TODAY - timedelta(days=n) for n in numbers}


# --- calculate_streak: pure logic ---


def test_no_activity_means_no_streak():
    assert calculate_streak(set(), TODAY) == {
        "current": 0,
        "best": 0,
        "learned_today": False,
        "today": "2026-10-19",
    }


def test_learning_today_starts_a_streak():
    result = calculate_streak(days_ago(0), TODAY)

    assert result["current"] == 1
    assert result["learned_today"] is True


def test_three_days_in_a_row():
    assert calculate_streak(days_ago(0, 1, 2), TODAY)["current"] == 3


def test_streak_still_alive_if_last_day_was_yesterday():
    # Not learned today yet, but the day is not over: the streak counts
    result = calculate_streak(days_ago(1, 2), TODAY)

    assert result["current"] == 2
    assert result["learned_today"] is False


def test_missing_a_full_day_breaks_the_streak():
    assert calculate_streak(days_ago(2, 3, 4), TODAY)["current"] == 0


def test_only_the_latest_run_counts():
    # today, yesterday | gap on day 2 | days 3-6
    result = calculate_streak(days_ago(0, 1, 3, 4, 5, 6), TODAY)

    assert result["current"] == 2
    assert result["best"] == 4


def test_streak_across_a_month_boundary():
    days = {date(2026, 10, 31), date(2026, 11, 1)}

    assert calculate_streak(days, date(2026, 11, 1))["current"] == 2


@pytest.mark.parametrize(
    ("days", "expected"),
    [
        (set(), 0),
        ({TODAY}, 1),
        (days_ago(0, 2, 4), 1),
        (days_ago(0, 1, 2, 5, 6), 3),
    ],
)
def test_longest_run(days, expected):
    assert longest_run(days) == expected


# --- time zones ---


def test_local_day_depends_on_the_time_zone():
    late_evening_utc = datetime(2026, 10, 19, 22, 30, tzinfo=timezone.utc)

    assert local_day(late_evening_utc, get_timezone("UTC")) == date(2026, 10, 19)
    assert local_day(late_evening_utc, get_timezone("Europe/Athens")) == date(2026, 10, 20)  # 01:30 next day


def test_unknown_time_zone_raises():
    with pytest.raises(ValueError):
        get_timezone("Mars/Olympus_Mons")


# --- API: GET /api/streak, with a fake clock ---


def pass_quiz(client, lesson_id):
    answers = [q["answer"] for q in QUIZZES[lesson_id]]
    return client.post(f"/api/lessons/{lesson_id}/quiz", json={"answers": answers})


def set_clock(monkeypatch, moment):
    monkeypatch.setattr(streak, "utc_now", lambda: moment)


def test_streak_api_starts_at_zero(client):
    assert client.get("/api/streak?tz=Europe/Athens").json()["current"] == 0


def test_passing_quizzes_on_three_days(client, monkeypatch):
    for day in (17, 18, 19):
        set_clock(monkeypatch, datetime(2026, 10, day, 9, 0, tzinfo=timezone.utc))
        pass_quiz(client, "bikes-frame")

    result = client.get("/api/streak?tz=Europe/Athens").json()
    assert result["current"] == 3
    assert result["learned_today"] is True


def test_two_quizzes_on_the_same_day_count_once(client, monkeypatch):
    set_clock(monkeypatch, datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc))
    pass_quiz(client, "bikes-frame")
    pass_quiz(client, "space-light-year")

    assert client.get("/api/streak?tz=UTC").json()["current"] == 1


def test_failed_quiz_does_not_count(client, monkeypatch):
    set_clock(monkeypatch, datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc))
    wrong = [(q["answer"] + 1) % 3 for q in QUIZZES["bikes-frame"]]
    client.post("/api/lessons/bikes-frame/quiz", json={"answers": wrong})

    assert client.get("/api/streak?tz=UTC").json()["current"] == 0


def test_streak_breaks_after_a_missed_day(client, monkeypatch):
    set_clock(monkeypatch, datetime(2026, 10, 17, 9, 0, tzinfo=timezone.utc))
    pass_quiz(client, "bikes-frame")

    set_clock(monkeypatch, datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc))  # skipped the 18th
    result = client.get("/api/streak?tz=UTC").json()
    assert result["current"] == 0
    assert result["best"] == 1


def test_time_zone_changes_which_day_counts(client, monkeypatch):
    # 22:30 UTC on Oct 19 = 01:30 on Oct 20 in Athens
    set_clock(monkeypatch, datetime(2026, 10, 19, 22, 30, tzinfo=timezone.utc))
    pass_quiz(client, "bikes-frame")

    assert client.get("/api/streak?tz=UTC").json()["today"] == "2026-10-19"
    assert client.get("/api/streak?tz=Europe/Athens").json()["today"] == "2026-10-20"


def test_bad_time_zone_returns_400(client):
    assert client.get("/api/streak?tz=Not/AZone").status_code == 400


def test_reset_also_clears_the_streak(client, monkeypatch):
    set_clock(monkeypatch, datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc))
    pass_quiz(client, "bikes-frame")

    client.delete("/api/progress")

    assert client.get("/api/streak?tz=UTC").json() == {
        "current": 0,
        "best": 0,
        "learned_today": False,
        "today": "2026-10-19",
    }
