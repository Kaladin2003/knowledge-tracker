# Step 3: Lessons and a topic page

## What we built

Click a topic on the home page and a new page shows its lessons.

```text
index.html                     topic.html?id=bikes
 ┌───────────┐  click          ┌──────────────────────────┐
 │ 🚲 Bikes  │ ──────────────> │ 🚲 Bikes                 │
 │ 🪐 Space  │                 │ 1. The frame             │
 └───────────┘                 │ 2. The drivetrain        │
                               │ 3. Brakes                │
                               └──────────────────────────┘
topic.js calls:  GET /api/topics/bikes          -> the topic
                 GET /api/topics/bikes/lessons  -> its lessons
```

## Key ideas

### Related data: `topic_id`
Each lesson has a `topic_id` field that points to its topic:

```python
{"id": "bikes-frame", "topic_id": "bikes", "order": 1, ...}
```

To get the lessons of a topic, we keep the lessons whose `topic_id` matches. In a database this link is called a **foreign key**, and the filter becomes a query (`WHERE topic_id = 'bikes'`). Step 6 does exactly that.

### Nested URL: `/api/topics/{topic_id}/lessons`
The URL reads like a path: "the lessons **of** topic X". This is the usual REST style: a resource inside another resource.

### Don't repeat yourself: `find_topic()`
Two endpoints need "find the topic, or 404". Instead of copying the loop, both call `find_topic()`.
`list_lessons` calls it only for its side effect: if the topic does not exist, the `HTTPException` stops the request with 404. Without it, an unknown topic would return `[]` (200 OK), and the page could not tell "no lessons yet" apart from "wrong topic".

### Sorting: `sorted(..., key=lambda lesson: lesson["order"])`
`key` tells Python what to compare. `lambda lesson: lesson["order"]` is a tiny unnamed function: "for each lesson, use its `order`". The API returns lessons in learning order, so the page does not need to sort.

### Passing data between pages: the query string
The home page links to `topic.html?id=bikes`. Everything after `?` is the **query string**.
`topic.js` reads it:

```js
const topicId = new URLSearchParams(window.location.search).get("id"); // "bikes"
```

`encodeURIComponent(topic.id)` makes the id safe to put in a URL (spaces, `&`, `/` and so on are escaped).

### Two requests at once: `Promise.all`
`topic.js` needs the topic and its lessons. `Promise.all([fetch(a), fetch(b)])` starts both requests together and waits until both answer. That is faster than waiting for one, then starting the other.

### Building HTML safely: `textContent` instead of `innerHTML`
Step 1 used `innerHTML` with a template string. Now every element is built with `createElement` and filled with `textContent`.
`textContent` always shows text as text. With `innerHTML`, a title like `<img src=x onerror=alert(1)>` would run as code (an **XSS** attack). Our data is safe today, but lessons will later come from a database and an LLM, so we switch now.

### Handling errors on the page
- No `?id=` in the URL: "No topic selected".
- The API returns 404: "Topic not found".
- The server is down: "Something went wrong … Is the backend running?"

A page should always tell the user what happened, never stay on "Loading…".

## Tests added (11 in total now)
- The lessons of a topic are returned, and only that topic's lessons.
- Lessons come back in learning order.
- Lessons of an unknown topic return 404.
- Every lesson's `topic_id` points to a real topic (a typo would hide a lesson forever).
- `topic.html` is served.

## Try it yourself
1. Open http://localhost:8000/topic.html?id=space, then `?id=xyz`, then no `?id` at all. Read each message.
2. Add a fourth lesson to Bikes in `LESSONS` with `"order": 4`. Refresh the page.
3. Give your new lesson `"order": 0`. Where does it appear now? Why?
4. Open the browser dev tools (F12), Network tab, and reload a topic page. Find the two API requests running at the same time.
