# Knowledge Garden

A daily learning app: pick a topic, read a short lesson, pass a quiz, keep your streak, and grow a knowledge tree.

**Plan:** build it as a web app first (running on localhost), then turn it into a mobile app.
I build it in small steps, one commit at a time, and write down what I learn in [`docs/steps`](docs/steps).

## Stack (so far)

- **Backend:** Python + [FastAPI](https://fastapi.tiangolo.com)
- **Frontend:** plain HTML, CSS and JavaScript

## Run it locally

Requires Python 3.10+.

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Then open:

- http://localhost:8000: the web page
- http://localhost:8000/docs: interactive API docs (made by FastAPI)

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{"status": "ok"}` |
| GET | `/api/topics` | all topics |
| GET | `/api/topics/{id}` | one topic, or 404 |

## Project structure

```text
backend/
  main.py            # FastAPI app: API routes + serves the frontend
  requirements.txt
frontend/
  index.html         # the page
  style.css
  app.js             # calls the API and shows the data
docs/steps/          # what each step taught me
```

## Steps

See [ROADMAP.md](ROADMAP.md).
