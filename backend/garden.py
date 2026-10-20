"""The knowledge garden: one tree for every finished lesson."""

import math
import sqlite3

MIN_SIZE = 6  # the garden is at least 6 x 6 tiles


def garden_size(tree_count: int) -> int:
    """Side length of the square garden. Grows when the trees no longer fit."""
    return max(MIN_SIZE, math.ceil(math.sqrt(tree_count)))


def get_garden(db: sqlite3.Connection) -> dict:
    """All trees in planting order (oldest first), with what each tree stands for."""
    rows = db.execute(
        """
        SELECT c.lesson_id,
               l.title     AS lesson_title,
               l.position  AS lesson_position,
               t.id        AS topic_id,
               t.title     AS topic_title,
               t.emoji     AS topic_emoji,
               c.completed_at AS planted_at,
               c.best_score
        FROM completions c
        JOIN lessons l ON l.id = c.lesson_id
        JOIN topics  t ON t.id = l.topic_id
        ORDER BY c.completed_at, c.lesson_id
        """
    ).fetchall()
    trees = [dict(row) for row in rows]
    return {"size": garden_size(len(trees)), "trees": trees}
