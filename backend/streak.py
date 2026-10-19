"""Daily streak: how many days in a row the user passed at least one quiz.

The logic is split in two:
- calculate_streak(): pure function on dates. No database, no clock: easy to test.
- get_streak(): reads the database and the clock, then calls calculate_streak().
"""

import sqlite3
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def utc_now() -> datetime:
    """The current time in UTC. Tests replace this function to fake "today"."""
    return datetime.now(timezone.utc)


def get_timezone(name: str) -> ZoneInfo:
    """Turn a time zone name like "Europe/Athens" into a ZoneInfo, or raise ValueError."""
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError) as error:
        raise ValueError(f"Unknown time zone: {name}") from error


def local_day(moment: datetime, tz: ZoneInfo) -> date:
    """The calendar day of a UTC moment, as seen in a time zone.

    23:30 UTC on Oct 19 is already 02:30 on Oct 20 in Athens (UTC+3).
    """
    return moment.astimezone(tz).date()


def longest_run(days: set[date]) -> int:
    """Length of the longest run of consecutive days."""
    best = 0
    for day in days:
        if day - timedelta(days=1) in days:
            continue  # not the start of a run
        length = 1
        while day + timedelta(days=length) in days:
            length += 1
        best = max(best, length)
    return best


def calculate_streak(days: set[date], today: date) -> dict:
    """Current streak, best streak, and whether the user already learned today.

    The streak is still alive if the last active day is today OR yesterday:
    the user still has the rest of today to keep it going.
    """
    yesterday = today - timedelta(days=1)
    if today in days:
        start = today
    elif yesterday in days:
        start = yesterday
    else:
        start = None

    current = 0
    if start is not None:
        day = start
        while day in days:
            current += 1
            day -= timedelta(days=1)

    return {
        "current": current,
        "best": longest_run(days),
        "learned_today": today in days,
        "today": today.isoformat(),
    }


def get_streak(db: sqlite3.Connection, tz: ZoneInfo) -> dict:
    """Read all passes from the database and calculate the streak in the user's time zone."""
    rows = db.execute("SELECT passed_at FROM quiz_passes").fetchall()
    days = {local_day(datetime.fromisoformat(row["passed_at"]), tz) for row in rows}
    today = local_day(utc_now(), tz)
    return calculate_streak(days, today)
