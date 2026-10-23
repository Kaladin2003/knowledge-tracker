# Roadmap

One step = one commit (or a few small ones). Each step has notes in `docs/steps/`.

## Phase 1: web app on localhost

- [x] **Step 1:** FastAPI backend with a topics API, and a web page that shows the topics.
- [x] **Step 2:** Tests for the API with pytest.
- [x] **Step 2b:** Run the tests on GitHub Actions (CI) on every push.
- [x] **Step 3:** Lessons: `GET /api/topics/{id}/lessons` and a topic page.
- [x] **Step 4:** Lesson page with text from the Wikipedia API.
- [x] **Step 5:** Quiz: our own questions per lesson, answers and score in the browser.
- [x] **Step 6:** Database: move topics and lessons into SQLite.
- [x] **Step 7:** Save progress: a passed quiz is saved in the database; `GET`/`DELETE /api/progress`.
- [x] **Step 8:** Daily streak logic on the backend, with tests.
- [x] **Step 9:** Knowledge garden: one SVG tree per finished lesson, click a tree to see why it was planted.
- [x] **Step 10:** Field Guide redesign: numbered sections and entries, garden plate, self-test, DESIGN.md.
- [x] **Step 11:** Categories and tree species: each category grows its own kind of tree.
- [x] **Step 12:** Big library: import topics and lessons from Wikipedia's Vital Articles, browse by category.
- [x] **Step 12b:** Search bar: find any lesson or topic as you type, on every page.
- [x] **Step 12c:** A new tree grows in the garden (with sparks) right after you pass a self-test.
- [ ] **Step 13:** Quiz generator: make questions from the lesson text (spaCy, then a local LLM).
- [ ] **Step 14:** Add topics that are not in the library (from a Wikipedia search); a small classifier guesses their category.
- [ ] **Step 15:** Users: sign up and log in.

## Phase 2: smarter lessons

- [ ] Generate quiz questions from the Wikipedia text with an LLM API, validate them, store them.
- [ ] Spaced repetition: review lessons at the right time.

## Phase 3: mobile app

- [ ] React Native app that uses the same API.
