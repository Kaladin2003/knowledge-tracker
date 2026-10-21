# Step 12: The big library

## What we built

An **importer** that fills the app with about 1,000 lessons from [Wikipedia's Vital Articles](https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/3): the list of the most important articles, chosen and sorted by Wikipedia's editors.

```bash
python -m backend.vital_articles --dry-run      # download the list and show what would be imported
python -m backend.vital_articles                # import it into knowledge.db
python -m backend.vital_articles --save vital3.txt   # also keep a copy of the list
python -m backend.vital_articles --file vital3.txt   # import from that copy (no internet)
```

How the list becomes our data:

```text
== People ==                              -> a section: decides the category
=== Writers and journalists ===           -> a topic (category: arts)
# {{Icon|FA}} [[William Shakespeare]]     -> a lesson; its text comes from Wikipedia like every lesson
```

Also in this step:
- **New category: Geography**, with its own tree: the **palm tree**.
- **The home index lists categories**, not topics: with ~70 topics, one long list is too much. Click a category to see its topics (`category.html`).
- **Section numbers never change**: topics are ordered by the order they were added (`rowid`), so Bikes stays section 1 after an import.
- **`GET /api/next`**: the server picks the next lesson (a topic you started comes first).
- **Imported lessons are "read only" for now**: they have no questions yet, so the lesson page says so instead of showing a broken self-test. The quiz generator (Step 13) fills that gap.

## Key ideas

### Wikitext and the MediaWiki API
Every Wikipedia page is written in **wikitext**: `== Heading ==`, `# list item`, `[[Link]]`, `{{template}}`. The MediaWiki API gives us that source:

```text
GET https://en.wikipedia.org/w/api.php?action=parse&page=Wikipedia:Vital_articles/Level/3&prop=wikitext&format=json
```
(The lesson text uses a different API, the REST "summary", from Step 4.)

### Parsing with regular expressions
```python
HEADING = re.compile(r"^(={2,6})\s*(.*?)\s*\1\s*$")      # \1 = the same number of = at the end
LINK = re.compile(r"\[\[\s*([^\]|#]+?)\s*(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")
```
- `(={2,6})` captures 2 to 6 `=`; its length is the heading level.
- In `[[Leo Tolstoy|Tolstoy]]` the **target** is before the `|`; we want the target (the real article name), not the shown text.
- `(?:...)` is a group that is not captured: used for the optional `#section` and `|text` parts.
- Links to `File:`, `Category:`, etc. are skipped.

The parser is **tolerant**: it doesn't care about icons, templates or `#` vs `*` lists, so small changes on Wikipedia's side don't break it. If it ever finds 0 articles it stops with a clear message.

### Rules instead of a "bot"
`category_for()` uses keyword rules: the section decides (`"Physical sciences"` → science), with a few exceptions: a `Psychology` subsection becomes psychology, and for **People** the kind of person decides (writers → arts, philosophers → philosophy). Simple, readable and testable. Topics that match nothing are skipped and listed, never guessed.

### An import you can run twice (idempotent)
- `INSERT OR IGNORE` for topics: an existing id is left alone.
- A lesson that already exists is skipped; a new one goes **after** the existing lessons of its topic.
- One transaction (`with db:`): all or nothing.
- Nothing is deleted, so your progress and trees are always safe.

### `--dry-run`
Runs everything on a throwaway **in-memory database** (`sqlite3.connect(":memory:")`), so you see exactly what would happen without changing `knowledge.db`.

### Testing without the internet
`tests/fixtures/vital_sample.wikitext` is a small hand-made page in the same format. The tests check headings, link variants, categories, a second import, and that `--dry-run` creates no database.

## Try it
1. `python -m backend.vital_articles --dry-run` and read the summary: how many topics per category, and which were skipped.
2. `python -m backend.vital_articles`
3. Start the server: the index now shows all categories. Open Philosophy, then a topic, then an article.
