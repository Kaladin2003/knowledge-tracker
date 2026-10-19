"""Database helpers (SQLite).

SQLite keeps the whole database in one file (knowledge.db) and is built into Python:
no server to install. The same SQL works later on PostgreSQL with small changes.
"""

import json
import os
import sqlite3
from pathlib import Path

from backend import seed_data

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_FILE = Path(__file__).resolve().parent / "schema.sql"

# The database file. Can be changed with the KG_DB_PATH environment variable.
DB_PATH = Path(os.environ.get("KG_DB_PATH", PROJECT_ROOT / "knowledge.db"))


def connect(path: Path = DB_PATH) -> sqlite3.Connection:
    """Open a connection to the database file (SQLite creates it if missing)."""
    # FastAPI may run a request's code in more than one thread, so allow that.
    # It is safe because every request gets its own connection.
    connection = sqlite3.connect(path, check_same_thread=False)
    connection.row_factory = sqlite3.Row  # rows behave like dicts: row["title"]
    connection.execute("PRAGMA foreign_keys = ON")  # SQLite only checks foreign keys when asked
    return connection


def init_db(connection: sqlite3.Connection) -> None:
    """Create the tables, and fill them with the seed content if they are empty."""
    connection.executescript(SCHEMA_FILE.read_text(encoding="utf-8"))

    topic_count = connection.execute("SELECT COUNT(*) FROM topics").fetchone()[0]
    if topic_count == 0:
        seed(connection)


def seed(connection: sqlite3.Connection) -> None:
    """Insert the starting content from seed_data.py."""
    # "with connection" = one transaction: either everything is saved, or nothing.
    with connection:
        connection.executemany(
            "INSERT INTO topics (id, title, emoji, description) VALUES (:id, :title, :emoji, :description)",
            seed_data.TOPICS,
        )
        connection.executemany(
            "INSERT INTO lessons (id, topic_id, position, title, minutes, wiki_title) "
            "VALUES (:id, :topic_id, :position, :title, :minutes, :wiki_title)",
            seed_data.LESSONS,
        )
        for lesson_id, questions in seed_data.QUIZZES.items():
            for position, q in enumerate(questions, start=1):
                connection.execute(
                    "INSERT INTO questions (lesson_id, position, question, options, answer, explanation) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (lesson_id, position, q["question"], json.dumps(q["options"]), q["answer"], q["explanation"]),
                )


def get_db():
    """FastAPI dependency: open a connection for one request, close it afterwards."""
    connection = connect(DB_PATH)
    try:
        yield connection
    finally:
        connection.close()
