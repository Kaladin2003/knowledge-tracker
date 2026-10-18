"""Knowledge Garden backend.

One FastAPI app does two jobs:
  1. Serves the JSON API under /api/...
  2. Serves the web page (the files in ../frontend) at /

Run from the project root:
    uvicorn backend.main:app --reload
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.quizzes import QUIZZES
from backend.wikipedia import ArticleNotFound, WikipediaError, fetch_summary

app = FastAPI(title="Knowledge Garden API", version="0.4.0")

PASS_SCORE = 2  # correct answers needed to pass a 3-question quiz

# Hardcoded data for now. A later step moves this into a database.
TOPICS = [
    {"id": "bikes", "title": "Bikes", "emoji": "🚲", "description": "How a bicycle works, part by part."},
    {"id": "space", "title": "Space", "emoji": "🪐", "description": "Our Solar System and the scale of the universe."},
]

# Each lesson points to its topic with "topic_id".
# In a database this is called a foreign key: lessons.topic_id -> topics.id
# "wiki_title" is the Wikipedia article the lesson text comes from.
LESSONS = [
    {"id": "bikes-frame", "topic_id": "bikes", "order": 1, "title": "The frame: the bike's skeleton", "minutes": 3, "wiki_title": "Bicycle frame"},
    {"id": "bikes-drivetrain", "topic_id": "bikes", "order": 2, "title": "The drivetrain: from your legs to the wheel", "minutes": 4, "wiki_title": "Bicycle drivetrain systems"},
    {"id": "bikes-brakes", "topic_id": "bikes", "order": 3, "title": "Brakes: rim vs disc", "minutes": 3, "wiki_title": "Bicycle brake"},
    {"id": "space-solar-system", "topic_id": "space", "order": 1, "title": "The Solar System at a glance", "minutes": 3, "wiki_title": "Solar System"},
    {"id": "space-moon-phases", "topic_id": "space", "order": 2, "title": "Why the Moon has phases", "minutes": 3, "wiki_title": "Lunar phase"},
    {"id": "space-light-year", "topic_id": "space", "order": 3, "title": "What is a light-year?", "minutes": 3, "wiki_title": "Light-year"},
]


def find_topic(topic_id: str) -> dict:
    """Return the topic with this id, or stop the request with a 404."""
    for topic in TOPICS:
        if topic["id"] == topic_id:
            return topic
    raise HTTPException(status_code=404, detail="Topic not found")


@app.get("/api/health")
def health():
    """Quick check that the server is running."""
    return {"status": "ok"}


@app.get("/api/topics")
def list_topics():
    """All topics the user can learn."""
    return TOPICS


@app.get("/api/topics/{topic_id}")
def get_topic(topic_id: str):
    """One topic, or 404 if the id does not exist."""
    return find_topic(topic_id)


@app.get("/api/topics/{topic_id}/lessons")
def list_lessons(topic_id: str):
    """The lessons of one topic, in learning order. 404 if the topic does not exist."""
    find_topic(topic_id)  # raises 404 for an unknown topic
    lessons = [lesson for lesson in LESSONS if lesson["topic_id"] == topic_id]
    return sorted(lessons, key=lambda lesson: lesson["order"])


def find_lesson(lesson_id: str) -> dict:
    """Return the lesson with this id, or stop the request with a 404."""
    for lesson in LESSONS:
        if lesson["id"] == lesson_id:
            return lesson
    raise HTTPException(status_code=404, detail="Lesson not found")


@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: str):
    """One lesson with its text, loaded from Wikipedia.

    404: unknown lesson id, or the Wikipedia article does not exist.
    502: Wikipedia could not be reached ("Bad Gateway": a server we depend on failed).
    """
    lesson = find_lesson(lesson_id)
    try:
        content = fetch_summary(lesson["wiki_title"])
    except ArticleNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WikipediaError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {
        **lesson,
        "content": content,
        "source": {
            "name": "Wikipedia",
            "url": content["url"],
            "license": "CC BY-SA 4.0",
        },
    }


def find_quiz(lesson_id: str) -> list[dict]:
    """Return the quiz of a lesson, or stop the request with a 404."""
    find_lesson(lesson_id)  # 404 if the lesson does not exist
    quiz = QUIZZES.get(lesson_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="This lesson has no quiz yet")
    return quiz


@app.get("/api/lessons/{lesson_id}/quiz")
def get_quiz(lesson_id: str):
    """The questions and options, WITHOUT the correct answers."""
    quiz = find_quiz(lesson_id)
    return [{"question": q["question"], "options": q["options"]} for q in quiz]


class QuizAnswers(BaseModel):
    """What the browser sends: the index of the chosen option for each question."""

    answers: list[int]


@app.post("/api/lessons/{lesson_id}/quiz")
def check_quiz(lesson_id: str, submission: QuizAnswers):
    """Grade the answers. Only now does the browser learn the correct ones."""
    quiz = find_quiz(lesson_id)
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
    return {
        "score": score,
        "total": len(quiz),
        "passed": score >= PASS_SCORE,
        "results": results,
    }


# Serve the web page. This line must come AFTER the API routes:
# the "/" mount catches every path that no route above matched.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
