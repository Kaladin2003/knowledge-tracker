"""Vital Articles importer tests (Step 12). No internet: they read a saved sample of the list."""

from pathlib import Path

import pytest

from backend.vital_articles import (
    VitalTopic,
    article_in,
    category_for,
    clean_heading,
    import_topics,
    main,
    parse_vital_wikitext,
    slug,
)

SAMPLE = (Path(__file__).parent / "fixtures" / "vital_sample.wikitext").read_text(encoding="utf-8")


# --- Parsing ---


@pytest.mark.parametrize(
    ("heading", "clean"),
    [
        ("People (6 articles)", "People"),
        ("[[Society]] and social sciences (3/4 articles)", "Society and social sciences"),
        ("Writers and journalists (1,234 articles)", "Writers and journalists"),
        ("Psychology", "Psychology"),
    ],
)
def test_clean_heading(heading, clean):
    assert clean_heading(heading) == clean


@pytest.mark.parametrize(
    ("line", "article"),
    [
        ("# {{Icon|FA}} [[William Shakespeare]]", "William Shakespeare"),
        ("# {{Icon|GA}} [[Leo Tolstoy|Tolstoy]]", "Leo Tolstoy"),  # the target, not the shown text
        ("# {{Icon|C}} [[Money#History|money]]", "Money"),  # no #section part
        ("# [[File:Example.jpg]] ''[[economics]]''", "Economics"),  # skip the file, capital first letter
        ("# {{Icon|B}} no link here", None),
    ],
)
def test_article_in_line(line, article):
    assert article_in(line) == article


def test_parse_sample_into_topics():
    topics = {(t.section, t.title): t.articles for t in parse_vital_wikitext(SAMPLE)}

    assert topics[("People", "Writers and journalists")] == ["William Shakespeare", "Homer", "Leo Tolstoy"]
    assert topics[("Geography", "Geography")] == ["Earth", "Nile"]  # a section without subsections
    # A level-4 heading stays inside its level-3 topic
    assert topics[("Society and social sciences", "Economics")] == ["Economics", "Money"]
    # Links before the first section and empty headings are ignored
    assert all("Wikipedia" not in articles[0] for articles in topics.values())
    assert ("Technology", "Empty heading") not in topics


# --- Categories ---


@pytest.mark.parametrize(
    ("section", "title", "category"),
    [
        ("People", "Writers and journalists", "arts"),
        ("People", "Philosophers and social scientists", "philosophy"),
        ("People", "Political leaders", "history"),  # no rule for the kind of person: the section decides
        ("Society and social sciences", "Psychology", "psychology"),
        ("Society and social sciences", "Economics", "society"),
        ("Geography", "Geography", "geography"),
        ("Physical sciences", "Basics", "science"),
        ("Biological and health sciences", "Anatomy", "nature"),
        ("Miscellaneous", "Miscellaneous", None),
    ],
)
def test_category_for(section, title, category):
    assert category_for(VitalTopic(section, title)) == category


def test_slug():
    assert slug("Writers & journalists") == "writers-journalists"
    assert slug("Kurt Gödel") == "kurt-godel"


# --- Importing ---


def test_import_adds_topics_and_lessons(db):
    report = import_topics(db, parse_vital_wikitext(SAMPLE))

    assert report.topics_added == 7
    assert report.lessons_added == 14
    assert report.skipped == ["Miscellaneous > Miscellaneous"]

    plato = db.execute("SELECT * FROM lessons WHERE id = 'va-plato'").fetchone()
    assert plato["wiki_title"] == "Plato"
    topic = db.execute("SELECT * FROM topics WHERE id = ?", (plato["topic_id"],)).fetchone()
    assert topic["category_id"] == "philosophy"
    positions = [row[0] for row in db.execute(
        "SELECT position FROM lessons WHERE topic_id = 'va-people--writers-and-journalists' ORDER BY position"
    )]
    assert positions == [1, 2, 3]


def test_import_twice_adds_nothing_and_keeps_progress(client, db):
    topics = parse_vital_wikitext(SAMPLE)
    import_topics(db, topics)
    db.execute("INSERT INTO completions VALUES ('va-plato', '2026-10-21T10:00:00+00:00', 3)")
    db.commit()

    report = import_topics(db, topics)

    assert (report.topics_added, report.lessons_added) == (0, 0)
    assert db.execute("SELECT best_score FROM completions WHERE lesson_id = 'va-plato'").fetchone()[0] == 3


def test_imported_lesson_has_no_quiz_yet(client, db):
    import_topics(db, parse_vital_wikitext(SAMPLE))

    assert client.get("/api/lessons/va-plato/quiz").status_code == 404
    lessons = client.get("/api/topics/va-people--philosophers-and-social-scientists/lessons").json()
    assert [lesson["has_quiz"] for lesson in lessons] == [False, False]


def test_dry_run_changes_nothing(tmp_path, monkeypatch, capsys):
    sample_file = tmp_path / "sample.wikitext"
    sample_file.write_text(SAMPLE, encoding="utf-8")
    monkeypatch.setattr("backend.vital_articles.DB_PATH", tmp_path / "real.db")

    main(["--file", str(sample_file), "--dry-run"])

    assert "Would add 7 topics and 14 lessons." in capsys.readouterr().out
    assert not (tmp_path / "real.db").exists()


def test_import_from_file_into_the_database(tmp_path, monkeypatch, capsys):
    sample_file = tmp_path / "sample.wikitext"
    sample_file.write_text(SAMPLE, encoding="utf-8")
    monkeypatch.setattr("backend.vital_articles.DB_PATH", tmp_path / "real.db")

    main(["--file", str(sample_file)])

    assert "Added 7 topics and 14 lessons." in capsys.readouterr().out
    assert (tmp_path / "real.db").exists()
