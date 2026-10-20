-- Database structure. Run on every start: "IF NOT EXISTS" makes it safe to repeat.

-- Step 11: big groups of knowledge. Each category grows its own kind of tree in the garden.
CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,            -- "technology"
    title       TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
    id          TEXT PRIMARY KEY,            -- "bikes"
    title       TEXT NOT NULL,
    emoji       TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id)  -- Step 11. Older databases get it from migrate() in db.py
);

CREATE TABLE IF NOT EXISTS lessons (
    id         TEXT PRIMARY KEY,             -- "bikes-frame"
    topic_id   TEXT NOT NULL REFERENCES topics(id),  -- foreign key: must be a real topic
    position   INTEGER NOT NULL,             -- learning order inside the topic ("order" is a reserved word in SQL)
    title      TEXT NOT NULL,
    minutes    INTEGER NOT NULL,
    wiki_title TEXT NOT NULL,                -- Wikipedia article with the lesson text
    UNIQUE (topic_id, position)              -- two lessons of a topic cannot share a position
);

CREATE TABLE IF NOT EXISTS questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id   TEXT NOT NULL REFERENCES lessons(id),
    position    INTEGER NOT NULL,            -- question order inside the quiz
    question    TEXT NOT NULL,
    options     TEXT NOT NULL,               -- JSON list, e.g. ["Steel", "Aluminium", "Carbon fibre"]
    answer      INTEGER NOT NULL,            -- index of the correct option
    explanation TEXT NOT NULL,
    UNIQUE (lesson_id, position)
);

-- Step 7: which lessons the user has finished (one row per finished lesson).
-- No users yet, so this is the progress of the one person using the app.
CREATE TABLE IF NOT EXISTS completions (
    lesson_id    TEXT PRIMARY KEY REFERENCES lessons(id),  -- each lesson at most once
    completed_at TEXT NOT NULL,                            -- first time passed, UTC, ISO 8601: "2026-10-19T10:15:00+00:00"
    best_score   INTEGER NOT NULL                          -- best quiz score so far
);

-- Step 8: a log of every passed quiz (also retakes). The streak is calculated from it.
-- Times are UTC; the user's "day" is worked out from their time zone when reading.
CREATE TABLE IF NOT EXISTS quiz_passes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL REFERENCES lessons(id),
    passed_at TEXT NOT NULL                 -- UTC, ISO 8601
);
