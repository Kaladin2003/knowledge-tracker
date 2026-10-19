-- Database structure. Run on every start: "IF NOT EXISTS" makes it safe to repeat.

CREATE TABLE IF NOT EXISTS topics (
    id          TEXT PRIMARY KEY,            -- "bikes"
    title       TEXT NOT NULL,
    emoji       TEXT NOT NULL,
    description TEXT NOT NULL
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
