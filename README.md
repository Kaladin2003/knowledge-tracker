# Knowledge Garden

[![Tests](https://github.com/Kaladin2003/knowledge-tracker/actions/workflows/tests.yml/badge.svg)](https://github.com/Kaladin2003/knowledge-tracker/actions/workflows/tests.yml)

A daily learning app: pick a topic, read a short lesson, pass a quiz, keep your streak, and grow a **knowledge garden**: every finished lesson plants a tree.

**Plan:** build it as a web app first (running on localhost), then turn it into a mobile app.
I build it in small steps, one commit at a time, and write down what I learn in [`docs/steps`](docs/steps).

## Stack (so far)

- **Backend:** Python + [FastAPI](https://fastapi.tiangolo.com)
- **Frontend:** plain HTML, CSS and JavaScript
- **Database:** SQLite (`knowledge.db`, created on first start)
- **Lesson text:** [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) (page summaries)
- **Tests:** pytest

## Run it locally

Requires Python 3.10+.

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

The first start creates `knowledge.db` and fills it from `backend/seed_data.py`.
To reset the content, stop the server, delete `knowledge.db`, and start again.

Then open:

- http://localhost:8000: the web page
- http://localhost:8000/docs: interactive API docs (made by FastAPI)

## Import the big library

About 1,000 core articles from [Wikipedia's Vital Articles](https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/3), sorted into the app's categories:

```bash
python -m backend.vital_articles --dry-run   # show what would be imported
python -m backend.vital_articles             # import into knowledge.db (safe to run again)
```

Imported lessons can be read right away; their self-tests come with the quiz generator.

## Run the tests

```bash
pip install -r requirements-dev.txt
pytest -v
```

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{"status": "ok"}` |
| GET | `/api/topics` | all topics, with lesson and finished counts |
| GET | `/api/topics/{id}` | one topic, or 404 |
| GET | `/api/topics/{id}/lessons` | the topic's lessons in order (with `completed`), or 404 |
| GET | `/api/lessons/{id}` | one lesson with its text from Wikipedia; 404 if unknown, 502 if Wikipedia is unreachable |
| GET | `/api/lessons/{id}/quiz` | the lesson's quiz questions, without the answers |
| POST | `/api/lessons/{id}/quiz` | body `{"answers": [1, 0, 2]}`; returns score, pass/fail and explanations; a pass is saved |
| GET | `/api/progress` | finished lessons and totals |
| GET | `/api/categories` | all categories, with topic, lesson and learned counts |
| GET | `/api/topics?category=philosophy` | the topics of one category (each topic has its `section` number) |
| GET | `/api/search?q=plato` | lessons and topics whose title contains the text (at least 2 letters) |
| GET | `/api/next` | the next lesson to learn (only lessons with a self-test), or `null` |
| GET | `/api/garden` | one tree per finished lesson (why it was planted), plus the garden size |
| GET | `/api/streak?tz=Europe/Athens` | daily streak (current, best, learned today) in the user's time zone |
| DELETE | `/api/progress` | forget all progress and streak history (204) |

## Project structure

```text
backend/
  main.py            # FastAPI app: API routes + serves the frontend
  db.py              # SQLite: connect, create tables, seed, get_db
  garden.py          # the knowledge garden: one tree per finished lesson
  progress.py        # save and read finished lessons, log passes
  streak.py          # daily streak calculation (time-zone aware)
  schema.sql         # database tables
  seed_data.py       # starting topics, lessons and quiz questions
  wikipedia.py       # Wikipedia API client (with cache)
  vital_articles.py  # imports the big library from Wikipedia's Vital Articles
  requirements.txt
frontend/
  common.js          # shared by every page: icons, topic colours, fetchJson, top bar stats
  index.html         # home page: garden plate, next entry, streak, index of topics
  app.js             # next entry, streak and index
  garden.js          # draws the isometric garden (SVG); click a tree to open its entry
  trees.js           # one tree species per category (pine, blossom, oak...) and topic swatches
  category.html      # category page: the topics of one category
  category.js        # loads one category and its topics
  topic.html         # topic page = one numbered section of the guide
  topic.js           # loads one topic and its entries
  lesson.html        # lesson page: text from Wikipedia, then the self-test
  lesson.js          # loads one lesson
  quiz.js            # self-test: load questions, send answers, show the grade
  search.js          # the search box in the top bar: results as you type
  style.css          # the Field Guide design (tokens at the top)
  fonts/             # self-hosted Barlow Condensed and Source Serif 4 (OFL)
tests/
  test_api.py        # API tests (pytest + FastAPI TestClient)
  conftest.py        # fixtures: a fresh test database for every test
  test_db.py         # database tests
  test_progress.py   # saving progress
  test_streak.py     # streak logic, time zones, fake clock
  test_garden.py     # garden and caching
  test_wikipedia.py  # Wikipedia client tests (no real network calls)
  test_vital_articles.py  # library importer tests (reads fixtures/vital_sample.wikitext)
docs/steps/          # what each step taught me
PRODUCT.md           # who the app is for and what it must do
DESIGN.md            # the design system: colours, type, components, rules
```

## Credits

Lesson text comes from [Wikipedia](https://www.wikipedia.org), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each lesson page links to its source article.

Fonts: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) and [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4), both under the SIL Open Font License (see `frontend/fonts/README.md`).

## Steps

See [ROADMAP.md](ROADMAP.md).
