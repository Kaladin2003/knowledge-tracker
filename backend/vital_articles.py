"""Import the big library: Wikipedia's Vital Articles (Step 12).

Wikipedia's editors keep a list of the most important articles, sorted into sections:
    Level 3 = about 1,000 articles: https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/3

This module turns that list into topics and lessons:
    section    "People"                       -> a category ("history")
    subsection "Writers and journalists"      -> a topic
    list item  "# {{Icon|FA}} [[Plato]]"      -> a lesson (its text comes from Wikipedia, like every lesson)

Run it from the project root:
    python -m backend.vital_articles --dry-run      # download and show what would be imported
    python -m backend.vital_articles                # import into knowledge.db
    python -m backend.vital_articles --save vital3.txt   # also keep a copy of the downloaded list
    python -m backend.vital_articles --file vital3.txt   # import from a saved copy (no internet needed)

Importing twice is safe: it only adds what is new and never touches your progress.
"""

import argparse
import re
import sqlite3
import sys
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import httpx

from backend.db import DB_PATH, connect, init_db
from backend.wikipedia import HEADERS

API_URL = "https://en.wikipedia.org/w/api.php"
DEFAULT_MINUTES = 3  # Wikipedia summaries are short


@dataclass
class VitalTopic:
    """One group of articles from the list, e.g. People > Writers and journalists."""

    section: str  # level-2 heading: "People"
    title: str  # level-3 heading, or the section itself if it has no subsections
    articles: list[str] = field(default_factory=list)  # Wikipedia article titles, in list order


# ---------- 1. Download ----------


def fetch_wikitext(page: str) -> str:
    """Download the source text (wikitext) of a Wikipedia page with the MediaWiki API."""
    params = {
        "action": "parse",
        "page": page,
        "prop": "wikitext",
        "format": "json",
        "formatversion": "2",
        "redirects": "1",
    }
    try:
        response = httpx.get(API_URL, params=params, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise SystemExit(f"Could not download '{page}' from Wikipedia: {error}") from error

    data = response.json()
    if "error" in data:  # the API answers 200 even for errors, with an "error" object
        raise SystemExit(f"Wikipedia API error: {data['error'].get('info', data['error'])}")
    return data["parse"]["wikitext"]


# ---------- 2. Parse ----------

HEADING = re.compile(r"^(={2,6})\s*(.*?)\s*\1\s*$")  # == People (95 articles) ==
LINK = re.compile(r"\[\[\s*([^\]|#]+?)\s*(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")  # [[Target#part|shown text]]
NAMESPACES = {"file", "image", "category", "wikipedia", "wp", "template", "help", "portal", "user", "talk"}


def clean_heading(text: str) -> str:
    """'[[Physical sciences]] (8/10 articles)' -> 'Physical sciences'."""
    text = re.sub(r"\{\{[^{}]*\}\}", "", text)  # templates like {{icon|FA}}
    text = LINK.sub(lambda m: m.group(0)[2:-2].split("|")[-1], text)  # [[a|b]] -> b
    text = text.replace("'''", "").replace("''", "")
    text = re.sub(r"\(\s*[\d,]+(\s*/\s*[\d,]+)?\s*articles?\s*\)", "", text, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", text).strip(" :")


def article_in(line: str) -> str | None:
    """The article a list line points to, or None. Skips links to files, categories, etc."""
    for match in LINK.finditer(line):
        target = match.group(1).strip()
        prefix = target.split(":", 1)[0].strip().lower() if ":" in target else ""
        if prefix in NAMESPACES:
            continue
        return target[0].upper() + target[1:]  # Wikipedia titles start with a capital letter
    return None


def parse_vital_wikitext(wikitext: str) -> list[VitalTopic]:
    """Read the list page and return its topics, in page order.

    - A level-2 heading (== ... ==) starts a section.
    - A level-3 heading (=== ... ===) starts a topic inside it.
    - Deeper headings stay inside their level-3 topic, so topics don't get too small.
    - Every list line (starting with # or *) with a link is one article.
    """
    topics: list[VitalTopic] = []
    section = None
    current = None

    for raw_line in wikitext.splitlines():
        line = raw_line.strip()
        heading = HEADING.match(line)
        if heading:
            level, title = len(heading.group(1)), clean_heading(heading.group(2))
            if level == 2:
                section = title
                current = VitalTopic(section, section)  # used if the section has no subsections
                topics.append(current)
            elif level == 3 and section:
                current = VitalTopic(section, title)
                topics.append(current)
            continue

        if current and line[:1] in ("#", "*"):
            article = article_in(line)
            if article and article not in current.articles:
                current.articles.append(article)

    return [topic for topic in topics if topic.articles]  # drop empty sections and headings


# ---------- 3. Sort into our categories ----------

# For people, the kind of person decides: writers grow in arts, philosophers in philosophy...
PEOPLE_RULES = [
    ("philosoph", "philosophy"),
    ("religio", "philosophy"),
    ("writer", "arts"),
    ("artist", "arts"),
    ("musician", "arts"),
    ("composer", "arts"),
    ("entertain", "arts"),
    ("director", "arts"),
    ("mathematic", "mathematics"),
    ("inventor", "technology"),
    ("scientist", "science"),
]

# Any section: some subsections are a category of their own
SUBSECTION_RULES = [
    ("psycholog", "psychology"),
]

# Otherwise the section decides
SECTION_RULES = [
    ("people", "history"),
    ("history", "history"),
    ("geograph", "geography"),
    ("arts", "arts"),
    ("philosoph", "philosophy"),
    ("religion", "philosophy"),
    ("everyday", "society"),
    ("society", "society"),
    ("social", "society"),
    ("biolog", "nature"),
    ("health", "nature"),
    ("physical science", "science"),
    ("science", "science"),
    ("technolog", "technology"),
    ("mathemat", "mathematics"),
]


def first_match(text: str, rules: list[tuple[str, str]]) -> str | None:
    text = text.lower()
    for keyword, category in rules:
        if keyword in text:
            return category
    return None


def category_for(topic: VitalTopic) -> str | None:
    """Which of our categories a list topic belongs to, or None if we don't know."""
    if topic.section.lower().startswith("people"):
        by_person = first_match(topic.title, PEOPLE_RULES)
        if by_person:
            return by_person
    return first_match(topic.title, SUBSECTION_RULES) or first_match(topic.section, SECTION_RULES)


# ---------- 4. Save in the database ----------


def slug(text: str) -> str:
    """'Writers & journalists' -> 'writers-journalists'. Accents are dropped: 'Gödel' -> 'godel'."""
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-") or "x"


def topic_id(topic: VitalTopic) -> str:
    # The section is part of the id: two sections may both have a subsection called "Basics"
    if topic.title == topic.section:
        return f"va-{slug(topic.section)}"
    return f"va-{slug(topic.section)}--{slug(topic.title)}"


def lesson_id(article: str) -> str:
    return f"va-{slug(article)}"


@dataclass
class ImportReport:
    topics_added: int = 0
    lessons_added: int = 0
    per_category: Counter = field(default_factory=Counter)  # category -> lessons in the list
    skipped: list[str] = field(default_factory=list)  # "Section > Topic" we could not place


def import_topics(db: sqlite3.Connection, topics: list[VitalTopic], level: int = 3) -> ImportReport:
    """Add the topics and lessons that are not in the database yet. One transaction: all or nothing."""
    report = ImportReport()
    known_categories = {row["id"] for row in db.execute("SELECT id FROM categories")}

    with db:
        for topic in topics:
            category = category_for(topic)
            if category not in known_categories:
                report.skipped.append(f"{topic.section} > {topic.title}")
                continue
            report.per_category[category] += len(topic.articles)

            tid = topic_id(topic)
            added = db.execute(
                "INSERT OR IGNORE INTO topics (id, title, emoji, description, category_id) VALUES (?, ?, '', ?, ?)",
                (
                    tid,
                    topic.title,
                    f"{len(topic.articles)} core articles from {topic.section}, chosen by Wikipedia's editors "
                    f"(Vital Articles, level {level}).",
                    category,
                ),
            ).rowcount
            report.topics_added += added

            # New lessons go after the ones the topic already has
            position = db.execute(
                "SELECT COALESCE(MAX(position), 0) FROM lessons WHERE topic_id = ?", (tid,)
            ).fetchone()[0]
            for article in topic.articles:
                exists = db.execute("SELECT 1 FROM lessons WHERE id = ?", (lesson_id(article),)).fetchone()
                if exists:  # already imported (maybe in another topic): keep it where it is
                    continue
                position += 1
                db.execute(
                    "INSERT INTO lessons (id, topic_id, position, title, minutes, wiki_title) VALUES (?, ?, ?, ?, ?, ?)",
                    (lesson_id(article), tid, position, article, DEFAULT_MINUTES, article),
                )
                report.lessons_added += 1

    return report


# ---------- 5. Command line ----------


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Import Wikipedia's Vital Articles as topics and lessons.")
    parser.add_argument("--level", type=int, default=3, help="list level (3 = about 1,000 articles)")
    parser.add_argument("--page", help="another list page, e.g. 'Wikipedia:Vital articles/Level/4/Technology'")
    parser.add_argument("--file", type=Path, help="read the list from a saved wikitext file instead of downloading")
    parser.add_argument("--save", type=Path, help="save the downloaded wikitext to this file")
    parser.add_argument("--dry-run", action="store_true", help="show what would be imported, change nothing")
    args = parser.parse_args(argv)
    # The Windows console can't show every character (e.g. Chinese titles): print "?" instead of crashing
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")

    page = args.page or f"Wikipedia:Vital articles/Level/{args.level}"
    if args.file:
        wikitext = args.file.read_text(encoding="utf-8")
        print(f"Read {args.file}")
    else:
        print(f"Downloading '{page}'...")
        wikitext = fetch_wikitext(page)
        if args.save:
            args.save.write_text(wikitext, encoding="utf-8")
            print(f"Saved a copy to {args.save}")

    topics = parse_vital_wikitext(wikitext)
    total = sum(len(topic.articles) for topic in topics)
    print(f"Found {len(topics)} topics with {total} articles.")
    if total == 0:
        sys.exit("No articles found: the page format may have changed. Try --save and look at the file.")

    if args.dry_run:
        # Use a throwaway in-memory database, so nothing real changes
        db = sqlite3.connect(":memory:")
        db.row_factory = sqlite3.Row
    else:
        db = connect(DB_PATH)
    init_db(db)
    report = import_topics(db, topics, level=args.level)
    db.close()

    for category, count in sorted(report.per_category.items()):
        print(f"  {category:<12} {count:>4} article{'' if count == 1 else 's'}")
    if report.skipped:
        print(f"Skipped {len(report.skipped)} topics with no matching category:")
        for name in report.skipped:
            print(f"  - {name}")
    verb = "Would add" if args.dry_run else "Added"
    print(f"{verb} {report.topics_added} topics and {report.lessons_added} lessons.")


if __name__ == "__main__":
    main()
