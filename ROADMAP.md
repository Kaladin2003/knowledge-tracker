# Roadmap

One step = one commit (or a few small ones). Each step has notes in `docs/steps/`.

## Phase 1: web app on localhost

- [x] **Step 1:** FastAPI backend with a topics API, and a web page that shows the topics.
- [x] **Step 2:** Tests for the API with pytest, run on every push by GitHub Actions.
- [ ] **Step 3:** Lessons: `GET /api/topics/{id}/lessons` and a topic page.
- [ ] **Step 4:** Lesson page: read the lesson.
- [ ] **Step 5:** Quiz: questions, answers and score in the browser.
- [ ] **Step 6:** Database: move topics and lessons into SQLite.
- [ ] **Step 7:** Save progress: `POST /api/progress` when a lesson is finished.
- [ ] **Step 8:** Daily streak logic on the backend, with tests.
- [ ] **Step 9:** Knowledge tree drawn with SVG.
- [ ] **Step 10:** Users: sign up and log in.

## Phase 2: smarter lessons

- [ ] Generate lessons with an LLM API, validate them, store them.
- [ ] Spaced repetition: review lessons at the right time.

## Phase 3: mobile app

- [ ] React Native app that uses the same API.
