# Step 12b: The search bar

## What we built

A search box in the top bar of every page. Type at least 2 letters and the matching **lessons** and **topics** appear under the box, with their tree, their entry number and the matching letters highlighted.

- **Enter** opens the first result.
- **Arrow Down / Up** move through the results, **Escape** closes them.
- Clicking somewhere else closes them too.
- On a phone the box gets its own row under the wordmark.

```text
GET /api/search?q=moon  ->  {"lessons": [{"title": "Why the Moon has phases", "section": 2, "position": 2, ...}],
                             "topics": []}
```

## Key ideas

### `LIKE` in SQL
```sql
WHERE l.title LIKE '%moon%'          -- % = any text: "contains moon"
ORDER BY l.title LIKE 'moon%' DESC,  -- titles that START with "moon" first (true = 1, false = 0)
         LENGTH(l.title),            -- then shorter titles
         l.title                     -- then A to Z
```
SQLite's `LIKE` ignores upper/lower case (for English letters), so "MOON" also finds "Moon".

### Escaping wildcards
In `LIKE`, `%` and `_` are wildcards. If someone types `%%`, a plain `'%' + text + '%'` would match **every** lesson. `like_pattern()` puts a backslash before them, and `ESCAPE '\'` tells SQLite that a backslash means "this character is plain text". The test `test_search_wildcards_are_plain_text` checks it.

### Don't call the API on every key press (debounce)
```js
clearTimeout(searchTimer);
searchTimer = setTimeout(() => runSearch(input.value), 150);
```
Typing "plato" quickly makes **one** request, not five: each key press cancels the timer of the one before.

### Old answers must not win (race condition)
Requests can come back in a different order than they were sent. Each search gets a number (`searchRequest`); when an answer arrives, it's only shown if it belongs to the newest search.

### Highlighting safely
The matching part is wrapped in `<mark>` using text nodes (`document.createElement`, `textContent`), never `innerHTML`, so a lesson title can never inject HTML into the page.

### The bug of the day: one global scope
`search.js` first had a function called `showResults`, and `quiz.js` already had one. Plain `<script>` files share **one global scope**, so the one loaded last silently replaced the other, and the lesson page crashed. Fix: every search function has "search" in its name (`showSearchResults`, ...). Real projects avoid this with JavaScript **modules** (`<script type="module">`), where each file has its own scope; that's a good later step.

## Try it
1. Type `th` in the search box: see the matches highlighted.
2. Press Arrow Down twice, then Escape.
3. Type `plato` and press Enter.
4. Try `%%`: nothing matches, as it should.
