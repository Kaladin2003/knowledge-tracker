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

app = FastAPI(title="Knowledge Garden API", version="0.1.0")

# Hardcoded data for now. A later step moves this into a database.
TOPICS = [
    {"id": "bikes", "title": "Bikes", "emoji": "🚲", "description": "How a bicycle works, part by part."},
    {"id": "space", "title": "Space", "emoji": "🪐", "description": "Our Solar System and the scale of the universe."},
]


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
    for topic in TOPICS:
        if topic["id"] == topic_id:
            return topic
    raise HTTPException(status_code=404, detail="Topic not found")


# Serve the web page. This line must come AFTER the API routes:
# the "/" mount catches every path that no route above matched.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
