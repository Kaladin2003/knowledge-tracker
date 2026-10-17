# Step 1: A backend, an API and a web page

## What we built

```text
Browser (frontend/)                     Server (backend/main.py)
-------------------                     ------------------------
1. GET /            ------------------>  sends index.html, style.css, app.js
2. app.js runs
3. fetch("/api/topics") -------------->  list_topics() runs
4.                  <------------------  200 OK + JSON list of topics
5. app.js builds the <li> items
```

One program (the FastAPI app) does two jobs:

1. It answers **API requests** under `/api/...` with **JSON** data.
2. It sends the **web page files** from `frontend/` for everything else.

## Key ideas

### Client and server
- The **server** is a program that waits for requests. Here it is `uvicorn`, running our FastAPI `app`.
- The **client** is whatever sends requests. Here it is the browser.
- `localhost` means "this computer". Port `8000` is the door the server listens on.

### API, endpoint, HTTP method
- An **API** is a list of things the server can do for a client.
- An **endpoint** is one of those things: a **method** plus a **path**, e.g. `GET /api/topics`.
- **GET** means "give me data". Later we use **POST** ("here is new data", e.g. "I finished a lesson").

### JSON
The format the API speaks. A Python `dict` / `list` becomes JSON automatically when a FastAPI function returns it:

```json
[{"id": "bikes", "title": "Bikes", "emoji": "🚲", "description": "..."}]
```

### Status codes
Every response has a number that says how it went:
- `200 OK`: success.
- `404 Not Found`: the thing does not exist. We send it with `raise HTTPException(status_code=404, ...)`.
- Later: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `500 Server Error`.

### Path parameters
`@app.get("/api/topics/{topic_id}")` means: whatever is in that part of the URL is passed to the function as `topic_id`.
`/api/topics/bikes` calls `get_topic("bikes")`.

### FastAPI decorators
`@app.get("/api/health")` above a function **registers** it: "when a GET request for this path arrives, run this function".

### Serving the frontend
`app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True))` sends files from `frontend/`.
**Order matters:** it must be the last line, because `/` matches every path. If it came first, it would catch `/api/topics` too.

### `--reload`
`uvicorn backend.main:app --reload` restarts the server when you save a Python file. `backend.main:app` means: in the module `backend/main.py`, use the variable `app`.

### fetch, async and await (JavaScript)
- `fetch("/api/topics")` sends a GET request from the browser.
- It takes time, so it returns a **Promise**. `await` pauses `loadTopics` until the answer arrives, without freezing the page.
- `response.json()` turns the JSON text into JavaScript objects.

### Why no CORS (yet)
The page and the API come from the **same origin** (`http://localhost:8000`), so the browser allows the request.
When the frontend later runs on a different port (e.g. a React dev server on `:5173`), the browser blocks the request unless the backend sends **CORS** headers. We will configure that then.

### `/docs`
FastAPI builds interactive API docs for free at http://localhost:8000/docs. You can call every endpoint from there.

## Known shortcuts (to fix later)
- Data is hardcoded in `main.py`. Step 6 moves it to a database.
- `app.js` uses `innerHTML` with API data. That is fine for our own fixed data, but unsafe for text that users or an LLM write (XSS). We will switch to `textContent` before that.

## Try it yourself
1. Open http://localhost:8000/api/topics/space and http://localhost:8000/api/topics/xyz. Compare the status codes in the browser dev tools (F12, Network tab).
2. Add a third topic to `TOPICS` in `main.py`. Save, refresh the page. (`--reload` restarts the server for you.)
3. Stop the server (Ctrl+C) and refresh the page. Read the error message `app.js` shows.
4. Add an endpoint `GET /api/stats` that returns `{"topics": <number of topics>}`. Test it in `/docs`.
