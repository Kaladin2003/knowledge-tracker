# Roadmap

One step = one commit (or a few small ones). Each step has notes in `docs/steps/`.

## Phase 1: web app on localhost

- [x] **Step 1:** FastAPI backend with a topics API, and a web page that shows the topics.
- [x] **Step 2:** Tests for the API with pytest.
- [ ] **Step 2b (optional):** Run the tests on GitHub Actions (CI).
- [x] **Step 3:** Lessons: `GET /api/topics/{id}/lessons` and a topic page.
- [x] **Step 4:** Lesson page with text from the Wikipedia API.
- [x] **Step 5:** Quiz: our own questions per lesson, answers and score in the browser.
- [x] **Step 6:** Database: move topics and lessons into SQLite.
- [x] **Step 7:** Save progress: a passed quiz is saved in the database; `GET`/`DELETE /api/progress`.
- [x] **Step 8:** Daily streak logic on the backend, with tests.
- [ ] **Step 9:** Knowledge tree drawn with SVG.
- [ ] **Step 10:** Users: sign up and log in.

## Phase 2: smarter lessons

- [ ] Generate quiz questions from the Wikipedia text with an LLM API, validate them, store them.
- [ ] Spaced repetition: review lessons at the right time.

## Phase 3: mobile app

- [ ] React Native app that uses the same API.
