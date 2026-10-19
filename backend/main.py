"""Knowledge Garden backend.

One FastAPI app does two jobs:
  1. Serves the JSON API under /api/...
  2. Serves the web page (the files in ../frontend) at /

Run from the project root:
    uvicorn backend.main:app --reload
"""

import json
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.db import DB_PATH, connect, get_db, init_db
from backend.progress import get_completion, get_progress, record_completion, reset_progress
from backend.wikipedia import ArticleNotFound, WikipediaError, fetch_summary

PASS_SCORE = 2  # correct answers needed to pass a 3-question quiz


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once when the server starts: make sure the database is ready."""
    connection = connect(DB_PATH)
    init_db(connection)
    connection.close()
    yield  # the server runs here


app = FastAPI(title="Knowledge Garden API", version="0.6.0", lifespan=lifespan)


def find_topic(db: sqlite3.Connection, topic_id: str) -> dict:
    """Return the topic with this id, or stop the request with a 404."""
    row = db.execute("SELECT * FROM topics WHERE id = ?", (topic_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return dict(row)


def find_lesson(db: sqlite3.Connection, lesson_id: str) -> dict:
    """Return the lesson with this id, or stop the request with a 404."""
    row = db.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return dict(row)


def find_quiz(db: sqlite3.Connection, lesson_id: str) -> list[dict]:
    """Return the quiz questions of a lesson in order, or stop the request with a 404."""
    find_lesson(db, lesson_id)  # 404 if the lesson does not exist
    rows = db.execute(
        "SELECT * FROM questions WHERE lesson_id = ? ORDER BY position", (lesson_id,)
    ).fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="This lesson has no quiz yet")
    # options are stored as JSON text: turn them back into a Python list
    return [{**dict(row), "options": json.loads(row["options"])} for row in rows]


@app.get("/api/health")
def health():
    """Quick check that the server is running."""
    return {"status": "ok"}


@app.get("/api/topics")
def list_topics(db: sqlite3.Connection = Depends(get_db)):
    """All topics, each with how many lessons it has and how many are finished."""
    rows = db.execute(
        """
        SELECT t.id, t.title, t.emoji, t.description,
               COUNT(l.id)        AS lesson_count,
               COUNT(c.lesson_id) AS completed_count
        FROM topics t
        LEFT JOIN lessons l     ON l.topic_id = t.id
        LEFT JOIN completions c ON c.lesson_id = l.id
        GROUP BY t.id
        ORDER BY t.title
        """
    ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/topics/{topic_id}")
def get_topic(topic_id: str, db: sqlite3.Connection = Depends(get_db)):
    """One topic, or 404 if the id does not exist."""
    return find_topic(db, topic_id)


@app.get("/api/topics/{topic_id}/lessons")
def list_lessons(topic_id: str, db: sqlite3.Connection = Depends(get_db)):
    """The lessons of one topic, in learning order. 404 if the topic does not exist."""
    find_topic(db, topic_id)  # raises 404 for an unknown topic
    rows = db.execute(
        """
        SELECT l.*, c.best_score
        FROM lessons l
        LEFT JOIN completions c ON c.lesson_id = l.id
        WHERE l.topic_id = ?
        ORDER BY l.position
        """,
        (topic_id,),
    ).fetchall()
    # best_score is NULL (None) when the lesson was never passed
    return [{**dict(row), "completed": row["best_score"] is not None} for row in rows]


@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: str, db: sqlite3.Connection = Depends(get_db)):
    """One lesson with its text, loaded from Wikipedia.

    404: unknown lesson id, or the Wikipedia article does not exist.
    502: Wikipedia could not be reached ("Bad Gateway": a server we depend on failed).
    """
    lesson = find_lesson(db, lesson_id)
    try:
        content = fetch_summary(lesson["wiki_title"])
    except ArticleNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WikipediaError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {
        **lesson,
        "completion": get_completion(db, lesson_id),  # None if not finished yet
        "content": content,
        "source": {
            "name": "Wikipedia",
            "url": content["url"],
            "license": "CC BY-SA 4.0",
        },
    }


@app.get("/api/lessons/{lesson_id}/quiz")
def get_quiz(lesson_id: str, db: sqlite3.Connection = Depends(get_db)):
    """The questions and options, WITHOUT the correct answers."""
    quiz = find_quiz(db, lesson_id)
    return [{"question": q["question"], "options": q["options"]} for q in quiz]


class QuizAnswers(BaseModel):
    """What the browser sends: the index of the chosen option for each question."""

    answers: list[int]


@app.post("/api/lessons/{lesson_id}/quiz")
def check_quiz(lesson_id: str, submission: QuizAnswers, db: sqlite3.Connection = Depends(get_db)):
    """Grade the answers. Only now does the browser learn the correct ones."""
    quiz = find_quiz(db, lesson_id)
    if len(submission.answers) != len(quiz):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(quiz)} answers, got {len(submission.answers)}",
        )

    results = []
    for question, chosen in zip(quiz, submission.answers):
        results.append(
            {
                "chosen": chosen,
                "correct_answer": question["answer"],
                "correct": chosen == question["answer"],
                "explanation": question["explanation"],
            }
        )

    score = sum(result["correct"] for result in results)
    passed = score >= PASS_SCORE
    if passed:
        # The server decides and saves. The browser cannot mark a lesson as done by itself.
        record_completion(db, lesson_id, score)

    return {
        "score": score,
        "total": len(quiz),
        "passed": passed,
        "saved": passed,
        "results": results,
    }


@app.get("/api/progress")
def read_progress(db: sqlite3.Connection = Depends(get_db)):
    """Finished lessons, newest first, with totals."""
    return get_progress(db)


@app.delete("/api/progress", status_code=204)
def delete_progress(db: sqlite3.Connection = Depends(get_db)):
    """Forget all progress. 204 No Content: it worked, nothing to send back."""
    reset_progress(db)


# Serve the web page. This line must come AFTER the API routes:
# the "/" mount catches every path that no route above matched.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
