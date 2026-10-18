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

app = FastAPI(title="Knowledge Garden API", version="0.2.0")

# Hardcoded data for now. A later step moves this into a database.
TOPICS = [
    {"id": "bikes", "title": "Bikes", "emoji": "🚲", "description": "How a bicycle works, part by part."},
    {"id": "space", "title": "Space", "emoji": "🪐", "description": "Our Solar System and the scale of the universe."},
]

# Each lesson points to its topic with "topic_id".
# In a database this is called a foreign key: lessons.topic_id -> topics.id
LESSONS = [
    {"id": "bikes-frame", "topic_id": "bikes", "order": 1, "title": "The frame: the bike's skeleton", "minutes": 3},
    {"id": "bikes-drivetrain", "topic_id": "bikes", "order": 2, "title": "The drivetrain: from your legs to the wheel", "minutes": 4},
    {"id": "bikes-brakes", "topic_id": "bikes", "order": 3, "title": "Brakes: rim vs disc", "minutes": 3},
    {"id": "space-solar-system", "topic_id": "space", "order": 1, "title": "The Solar System at a glance", "minutes": 3},
    {"id": "space-moon-phases", "topic_id": "space", "order": 2, "title": "Why the Moon has phases", "minutes": 3},
    {"id": "space-light-year", "topic_id": "space", "order": 3, "title": "What is a light-year?", "minutes": 3},
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


# Serve the web page. This line must come AFTER the API routes:
# the "/" mount catches every path that no route above matched.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
