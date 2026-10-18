# Step 4: Lesson text from the Wikipedia API

## What we built

Click a lesson and its page shows text, an image and a link, all taken from Wikipedia.

```text
Browser                 Our backend                         Wikipedia
-------                 -----------                         ---------
lesson.html?id=bikes-frame
  fetch /api/lessons/bikes-frame
                 ---->  find_lesson("bikes-frame")
                        wiki_title = "Bicycle frame"
                        fetch_summary("Bicycle frame")
                                         ---->  GET /api/rest_v1/page/summary/Bicycle_frame
                                         <----  JSON: title, extract, thumbnail, links...
                        parse_summary(): keep 4 fields
                 <----  lesson + content + source
  show text, image, credit line
```

Our server is now a **client too**: it calls another server's API. This is how most real apps work.

## Key ideas

### Calling an external API from Python: `httpx`
```python
response = httpx.get(url, headers=HEADERS, timeout=10, follow_redirects=True)
```
- `timeout=10`: never wait forever. If Wikipedia does not answer in 10 seconds, give up.
- `follow_redirects=True`: Wikipedia may answer "this page moved to another title". Follow it.
- `response.status_code` and `response.json()` work like `fetch` in JavaScript.

### Why the backend calls Wikipedia, not the browser
1. **One place to change things.** If we switch from Wikipedia to a database or an AI, only the backend changes. The page keeps calling `/api/lessons/...`.
2. **We control the shape.** Wikipedia's JSON has dozens of fields. `parse_summary()` keeps the 4 we need, so the frontend stays simple.
3. **Caching** (see below) works for every user, not one browser.

### Be a polite API client: the User-Agent
Wikimedia asks every program to send a `User-Agent` header with its name and a contact. Clients without one can be blocked. Ours is `KnowledgeGarden/0.1 (https://github.com/Kaladin2003/knowledge-tracker)`.

### Caching with `@lru_cache`
`lru_cache` remembers what a function returned for each input. The second request for "Bicycle frame" is answered from memory: faster, and less load on Wikipedia.
The cache lives in memory, so it empties when the server restarts. A later step can store the text in the database instead.

### Separating "talk to the network" from "understand the data"
- `fetch_summary()` does the HTTP request.
- `parse_summary()` only turns a dict into a smaller dict: no network.

`parse_summary()` is easy to test with a sample dict. Small, single-purpose functions are easier to test and to change.

### Custom exceptions and status codes
`wikipedia.py` raises its own errors, and `main.py` turns them into HTTP status codes:

| What happened | Exception | Our API answers |
|---|---|---|
| Unknown lesson id | (none, `find_lesson`) | 404 Lesson not found |
| No Wikipedia article with that title | `ArticleNotFound` | 404 |
| Wikipedia is down, slow, or no internet | `WikipediaError` | **502 Bad Gateway** |

**502** means: "I am fine, but a server I depend on failed." The page shows the message from `detail`.
`ArticleNotFound` is a subclass of `WikipediaError`, so it must be caught **first**, otherwise the general handler would catch it.

### Testing without the internet: mocking
Tests must not call the real Wikipedia: they would be slow, fail without internet, and change when the article changes.
pytest's `monkeypatch` swaps a function for a fake one during one test:

```python
monkeypatch.setattr(wikipedia.httpx, "get", fake_get(404))   # pretend Wikipedia says 404
monkeypatch.setattr(backend.main, "fetch_summary", lambda title: FAKE_CONTENT)
```

After the test, pytest puts the real function back. We test every path: success, 404, server error, no internet, caching, and the User-Agent header.

### License: credit the source
Wikipedia text is licensed **CC BY-SA 4.0**. You may reuse it if you credit Wikipedia, link to the article, and keep the same license. That is why every lesson page ends with a "Source: … on Wikipedia" line.

### `backend/__init__.py`
An empty file that marks `backend/` as a Python **package**. It makes `from backend.wikipedia import ...` work the same everywhere.

## Limits of this step
- The summary is only the article's introduction, not a full lesson. "Read the full article" links to the rest.
- Wikipedia has no quizzes. Step 5 adds questions we write ourselves. Later, an LLM can write questions from the Wikipedia text.

## Try it yourself
1. Open a lesson, then open http://localhost:8000/api/lessons/bikes-frame to see the raw JSON your page uses.
2. Turn off Wi-Fi, restart the server, and open a lesson. Read the 502 message. Turn Wi-Fi back on.
3. Open a lesson twice and watch the server log in the terminal. The second time is instant (cache).
4. Change a `wiki_title` to an article that does not exist. What does the page show? Which test would catch this? (Hint: none yet. Can you write one that only checks the title format?)
5. Add a new lesson to Space using any Wikipedia article title you like.
