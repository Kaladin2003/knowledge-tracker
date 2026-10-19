"""Saving and reading the user's progress (finished lessons)."""

import sqlite3
from datetime import datetime, timezone


def record_completion(db: sqlite3.Connection, lesson_id: str, score: int, now: datetime | None = None) -> None:
    """Save that a lesson was passed.

    First pass: insert a new row.
    Later passes: keep the first date, but remember the best score.
    This "insert or update" is called an UPSERT.
    """
    now = now or datetime.now(timezone.utc)
    with db:  # transaction: commit the change
        db.execute(
            """
            INSERT INTO completions (lesson_id, completed_at, best_score)
            VALUES (?, ?, ?)
            ON CONFLICT (lesson_id) DO UPDATE
                SET best_score = MAX(best_score, excluded.best_score)
            """,
            (lesson_id, now.isoformat(), score),
        )


def get_completion(db: sqlite3.Connection, lesson_id: str) -> dict | None:
    """The saved completion of one lesson, or None if it was never passed."""
    row = db.execute("SELECT * FROM completions WHERE lesson_id = ?", (lesson_id,)).fetchone()
    return dict(row) if row else None


def get_progress(db: sqlite3.Connection) -> dict:
    """All finished lessons, newest first, plus totals."""
    rows = db.execute(
        """
        SELECT c.lesson_id, c.completed_at, c.best_score, l.title, l.topic_id
        FROM completions c
        JOIN lessons l ON l.id = c.lesson_id
        ORDER BY c.completed_at DESC
        """
    ).fetchall()
    total = db.execute("SELECT COUNT(*) FROM lessons").fetchone()[0]
    return {
        "completed_count": len(rows),
        "total_lessons": total,
        "completed": [dict(row) for row in rows],
    }


def reset_progress(db: sqlite3.Connection) -> None:
    """Forget all finished lessons."""
    with db:
        db.execute("DELETE FROM completions")
