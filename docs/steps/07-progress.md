# Step 7: Saving progress

## What we built

Passing a quiz now **saves** the lesson as finished. It stays saved after a reload or a server restart.

- Home page: "You finished 1 of 6 lessons", and a `1/3` count on each topic.
- Topic page: finished lessons get a green bar and "✅ Done (best 3/3)".
- Lesson page: "✅ Done (best score 3/3)" next to the title.
- A "Reset progress" button forgets everything (after asking first).

```text
POST /api/lessons/bikes-frame/quiz  {"answers": [1, 0, 2]}
  check_quiz(): score = 3, passed = True
    record_completion(db, "bikes-frame", 3)   -> one row in the completions table
  <- {"score": 3, "passed": true, "saved": true, ...}

GET  /api/progress          -> {"completed_count": 1, "total_lessons": 6, "completed": [...]}
DELETE /api/progress        -> 204 No Content (everything forgotten)
```

## Key ideas

### A new table: `completions`
One row per finished lesson: `lesson_id`, `completed_at`, `best_score`.
`lesson_id` is the **primary key**, so a lesson can be finished only once. Retaking a quiz updates the row instead of adding a new one.
There are no user accounts yet, so this is the progress of the one person using the app. Step 10 adds a `user_id` column.

### Changing the schema of an existing database
Your `knowledge.db` from Step 6 has no `completions` table. Because `schema.sql` uses `CREATE TABLE IF NOT EXISTS` and runs on every start, the new table is simply **added** next time the server starts. The old data stays.
This only works for adding new tables. Changing an existing column needs a **migration** (a script that changes the database step by step). Bigger projects use a tool like Alembic for that.

### The server decides what is saved
Only `check_quiz()` writes to `completions`, and only after it graded the answers itself. There is no "mark as done" endpoint the browser could call to cheat. Same rule as Step 5: **the browser shows, the server decides.**

### UPSERT: insert, or update if it exists
```sql
INSERT INTO completions (lesson_id, completed_at, best_score) VALUES (?, ?, ?)
ON CONFLICT (lesson_id) DO UPDATE
    SET best_score = MAX(best_score, excluded.best_score)
```
- First pass: a new row.
- Later passes: the `INSERT` would break the primary key ("conflict"), so the `DO UPDATE` part runs instead.
- `excluded.best_score` is the value we just tried to insert. `MAX(...)` keeps the better score.
- `completed_at` is not in the `SET`, so the date of the **first** pass is kept.

### LEFT JOIN: combine tables, keep rows without a match
The topics list needs each topic's lesson count and finished count:
```sql
SELECT t.id, COUNT(l.id) AS lesson_count, COUNT(c.lesson_id) AS completed_count
FROM topics t
LEFT JOIN lessons l     ON l.topic_id = t.id
LEFT JOIN completions c ON c.lesson_id = l.id
GROUP BY t.id
```
- `JOIN` connects rows of two tables where the `ON` condition is true.
- `LEFT JOIN` keeps rows from the left table even when the right table has **no** match. The missing columns become `NULL`. Unfinished lessons have no completion, but we still want them in the list.
- `COUNT(column)` counts only non-NULL values, so `COUNT(c.lesson_id)` counts finished lessons only.
- `GROUP BY t.id` makes one result row per topic.

The lessons list uses the same idea: `best_score` is `NULL` (Python `None`) for unfinished lessons, so `completed = best_score is not None`.

### Storing time: UTC and ISO 8601
`completed_at` looks like `2026-10-19T10:15:00+00:00`. Always store time in **UTC** with a standard format; convert to the user's local time only when showing it. Step 8 (streaks) needs this, because "today" depends on the user's time zone.

### HTTP DELETE and 204 No Content
`DELETE /api/progress` removes data. When it works there is nothing useful to send back, so the server answers **204 No Content**. In the browser, `confirm()` asks "Are you sure?" first: deleting cannot be undone.

### Code in its own module
The SQL for progress lives in `backend/progress.py`. `main.py` only decides **when** to call it. `record_completion()` takes an optional `now` argument, so a test can pass a fixed date instead of the real clock (`test_retaking_keeps_the_first_completion_date`).

## Tests added (47 in total)
- Progress starts empty; passing saves; failing saves nothing.
- Retaking keeps one row, the best score, and the first date.
- Lessons list and topic counts show progress.
- The lesson shows its completion.
- DELETE resets everything and returns 204.
- The database refuses a completion for a lesson that does not exist.

## Try it yourself
1. Pass a quiz, then restart the server (Ctrl+C, start again). Is the lesson still done?
2. In DB Browser, look at the `completions` table. Pass the same quiz again with a lower score: what changes, what stays?
3. Run this query: which part counts finished lessons?
   `SELECT t.title, COUNT(c.lesson_id) FROM topics t LEFT JOIN lessons l ON l.topic_id = t.id LEFT JOIN completions c ON c.lesson_id = l.id GROUP BY t.id;`
4. Change `LEFT JOIN` to `JOIN` in that query. Why does Space disappear?
5. Show the date a lesson was finished on the lesson page. (Hint: `lesson.completion.completed_at` and `new Date(...).toLocaleDateString()`.)
