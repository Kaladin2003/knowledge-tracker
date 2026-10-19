"""Database tests: the schema, the seed content, and the rules the database enforces."""

import sqlite3

import pytest

from backend.db import connect, init_db
from backend.seed_data import LESSONS, QUIZZES, TOPICS


def count(db, table):
    return db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def test_seed_loads_all_content(db):
    assert count(db, "topics") == len(TOPICS)
    assert count(db, "lessons") == len(LESSONS)
    assert count(db, "questions") == sum(len(q) for q in QUIZZES.values())


def test_init_db_twice_does_not_duplicate(tmp_path):
    # The server calls init_db on every start: it must be safe to repeat
    connection = connect(tmp_path / "twice.db")
    init_db(connection)
    init_db(connection)

    assert count(connection, "topics") == len(TOPICS)
    connection.close()


def test_data_survives_a_new_connection(tmp_path):
    # This is the whole point of a database: data is still there after a restart
    path = tmp_path / "persist.db"
    first = connect(path)
    init_db(first)
    first.close()

    second = connect(path)
    assert count(second, "lessons") == len(LESSONS)
    second.close()


def test_foreign_key_blocks_lesson_with_unknown_topic(db):
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO lessons (id, topic_id, position, title, minutes, wiki_title) "
            "VALUES ('x', 'no-such-topic', 1, 'X', 1, 'X')"
        )


def test_two_lessons_cannot_share_a_position(db):
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO lessons (id, topic_id, position, title, minutes, wiki_title) "
            "VALUES ('bikes-extra', 'bikes', 1, 'Extra', 1, 'Bicycle')"
        )


def test_every_lesson_has_a_valid_quiz():
    # Checks the seed file itself, before it reaches the database
    for lesson in LESSONS:
        quiz = QUIZZES[lesson["id"]]
        assert len(quiz) == 3, lesson["id"]
        for question in quiz:
            assert 0 <= question["answer"] < len(question["options"]), question["question"]
            assert len(set(question["options"])) == len(question["options"]), question["question"]


def test_query_parameters_block_sql_injection(client):
    # A malicious id is treated as plain text, not as SQL: no topic matches, nothing breaks
    response = client.get("/api/topics/x' OR '1'='1")

    assert response.status_code == 404


def test_completion_of_unknown_lesson_is_blocked(db):
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO completions (lesson_id, completed_at, best_score) VALUES ('nope', '2026-01-01', 3)")
