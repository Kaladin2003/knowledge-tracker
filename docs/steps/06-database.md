# Step 6: A real database (SQLite)

## What we built

Topics, lessons and quiz questions moved out of Python lists into a **SQLite database**, the file `knowledge.db`.
The website looks exactly the same. What changed is where the data lives and how the code reads it.

```text
backend/schema.sql     the tables (structure)
backend/seed_data.py   the starting content (moved from main.py and quizzes.py)
backend/db.py          connect, create tables, fill them, get_db for requests
knowledge.db           the database file (created on first start, not committed to git)
```

On start, the server runs `init_db()`: create the tables if they are missing, and fill them from `seed_data.py` if they are empty.

## Why a database?

Python lists live in memory. They are rebuilt from the code on every restart, and nothing the user does can be saved.
A database is stored on disk, so data **survives restarts**. Step 7 needs this to save which lessons you finished.
A database also **enforces rules** (see "Constraints"), and finds data fast even with thousands of rows.

## Key ideas

### Tables, rows, columns
A table is like a spreadsheet: each **row** is one item (one lesson), each **column** is one field (`title`, `minutes`).
`schema.sql` describes the 3 tables. Every column has a type (`TEXT`, `INTEGER`).

### Primary key
`id TEXT PRIMARY KEY`: every row has a unique id. The database refuses a second row with the same id.

### Foreign key
```sql
topic_id TEXT NOT NULL REFERENCES topics(id)
```
A lesson's `topic_id` must exist in `topics`. Step 3 explained this idea; now the database **enforces** it.
SQLite only checks foreign keys after `PRAGMA foreign_keys = ON`, which `connect()` runs.

### Constraints
- `NOT NULL`: the field must have a value.
- `UNIQUE (topic_id, position)`: two lessons of the same topic cannot share a position.
Bad data is rejected with an `IntegrityError` before it is ever saved. `test_db.py` proves it.

### `order` became `position`
`ORDER` is a reserved word in SQL (`ORDER BY`), so a column called `order` causes errors. Renamed to `position` in the database, the API and the frontend.

### SQL queries
```sql
SELECT * FROM lessons WHERE topic_id = ? ORDER BY position
```
- `SELECT *`: all columns. `FROM lessons`: which table.
- `WHERE`: only rows that match (this replaced our Python loop).
- `ORDER BY`: sort (this replaced `sorted(...)`).

### `?` placeholders stop SQL injection
Never build SQL by gluing text together:
```python
db.execute(f"SELECT * FROM topics WHERE id = '{topic_id}'")        # DANGEROUS
db.execute("SELECT * FROM topics WHERE id = ?", (topic_id,))        # SAFE
```
With the first line, a visitor could send `x' OR '1'='1` as the id and change your query. With `?`, the database always treats the value as plain data. `test_query_parameters_block_sql_injection` checks this.

### Storing a list in one column
A question has a list of options. SQLite has no list type, so `options` is stored as **JSON text** (`json.dumps` to save, `json.loads` to read).
The "pure" alternative is a separate `options` table, one row per option. JSON text is simpler and fine here, because we always read all options of a question together.

### Transactions
```python
with connection:
    ...many INSERTs...
```
A **transaction** groups changes: either all are saved, or (if one fails) none are. The seed never stops halfway with half the lessons inserted.

### Dependency injection: `Depends(get_db)`
```python
def list_topics(db: sqlite3.Connection = Depends(get_db)):
```
The endpoint does not open the database itself. It **asks** FastAPI for one. `get_db` opens a connection, `yield`s it to the endpoint, and closes it after the response, even if an error happened.
Big advantage: tests can swap it (next point).

### Test database: fixtures and `dependency_overrides`
`tests/conftest.py` gives every test:
- `db`: a brand-new database file in a temporary folder (`tmp_path`), seeded and ready.
- `client`: a TestClient where `get_db` is **overridden** to return that test database.

So tests never touch your real `knowledge.db`, and no test can affect another. pytest finds fixtures by **name**: a test function with a `client` parameter automatically receives the `client` fixture.

### `lifespan`: code that runs when the server starts
`lifespan()` runs `init_db()` once at startup, before any request. The code after `yield` (none yet) would run at shutdown.

## Look inside the database
Install the free **DB Browser for SQLite** (or the VS Code extension "SQLite Viewer") and open `knowledge.db`. Browse the 3 tables, and try queries in the "Execute SQL" tab.

## Changing the content
`seed_data.py` is only used when the tables are **empty**. After editing it, **delete `knowledge.db`** and restart the server, so the tables are created and filled again.

## Try it yourself
1. Start the server once. Check that `knowledge.db` appeared, and that `git status` does not list it (it is in `.gitignore`).
2. Open `knowledge.db` in DB Browser and run: `SELECT title, minutes FROM lessons WHERE minutes > 3;`
3. Run: `SELECT topics.title, COUNT(lessons.id) FROM topics JOIN lessons ON lessons.topic_id = topics.id GROUP BY topics.id;` What does each part do?
4. Add a lesson in `seed_data.py` with a `topic_id` that does not exist. Delete `knowledge.db`, restart. What error do you get, and why is that good?
5. Read `test_db.py`. Which test would fail if you removed `PRAGMA foreign_keys = ON`? Try it.
