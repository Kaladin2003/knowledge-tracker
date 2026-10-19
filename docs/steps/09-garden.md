# Step 9: The Knowledge Garden

## What we built

The home page now shows **your garden**: an isometric field where **every finished lesson is a tree**.

- **Click a tree** (or Tab to it and press Enter) to see **why it was planted**: which lesson, which topic, the date, and your best quiz score, with a link to read the lesson again.
- **Tree style = topic.** Bikes trees are green with red fruit, Space trees are blue with yellow stars. A new topic automatically gets its own color.
- **Tree size = how well you know it.** Best score 3/3 = full tree with fruit, 2/3 = young tree. Retake the quiz with 3/3 and the tree grows. (Retaking never plants a second tree.)
- **Thirsty garden:** when your streak is broken, the trees turn brown. Pass a quiz today and they are green again.
- The garden is 6 × 6 and grows when it is full.

Also: the server now sends `Cache-Control: no-cache` for page files, so you no longer need Ctrl+F5 after an update.

```text
GET /api/garden  ->  {"size": 6, "trees": [
                        {"lesson_id": "bikes-frame", "lesson_title": "...", "topic_id": "bikes",
                         "topic_title": "Bikes", "topic_emoji": "🚲",
                         "planted_at": "2026-10-19T10:15:00+00:00", "best_score": 3}, ...]}
garden.js: draw tiles, then one tree per entry, in planting order
```

## Key ideas

### The data already existed
A tree is just a row of `completions`, joined with its lesson and topic. **No new table.** The garden is a new way to *show* data we already store (Step 7). Good design often means a new view, not new data.

### Isometric projection: from grid to screen
The garden is a square grid. Each cell `(x, y)` is drawn as a diamond:

```text
screenX = originX + (x - y) * TILE_W / 2
screenY = HEADROOM + (x + y) * TILE_H / 2
```
- Going **+1 in x** moves the diamond **right and down**. Going **+1 in y** moves it **left and down**.
- `TILE_H = TILE_W / 2` gives the classic "2:1" isometric look.
- The two brown polygons under the grass are the soil, drawn from the 3 outer corners.

### Drawing order (the painter's algorithm)
SVG draws elements in the order they are added: later ones cover earlier ones. A tree in the **front** must be drawn **after** a tree behind it. Front means a bigger `x + y`, so `plantingOrder()` sorts cells by `x + y`. That one sort gives both the planting order (back corner first) and the right drawing order.

### SVG from JavaScript
- SVG elements live in their own **namespace**, so they are made with `document.createElementNS("http://www.w3.org/2000/svg", "circle")`, not `createElement`.
- `viewBox="0 0 width height"` sets the drawing's own coordinate system. With `width: 100%` in CSS, the whole garden scales to any screen.
- A `<g>` (group) holds all shapes of one tree, so one click handler covers the whole tree.
- `<title>` inside a group shows a tooltip on hover.

### Clickable and accessible
Each tree has `tabindex="0"` (can get keyboard focus), `role="button"` and an `aria-label`, plus a `keydown` handler for Enter and Space. Screen-reader and keyboard users can use the garden too.

### Colors from an id: a tiny hash
For topics without a hand-picked style, `topicStyle()` turns the topic id into a number from 0 to 359 (a **hash**), then uses it as the hue in `hsl(...)`. The same topic always gets the same color, and no list needs updating when you add topics.

### Garden size grows
`garden_size(n) = max(6, ceil(sqrt(n)))`: at least 6 × 6, and just big enough for all trees. 37 trees need a 7 × 7 garden. It is a pure function, so it is tested with a table of cases.

### HTTP middleware and caching
A **middleware** runs around every request:
```python
@app.middleware("http")
async def no_cache_for_pages(request, call_next):
    response = await call_next(request)          # the normal handling
    response.headers["Cache-Control"] = "no-cache"   # then add a header
    return response
```
`no-cache` does not mean "never store". It means "ask the server whether the file changed before using your copy". The server answers "304 Not Modified" when nothing changed, so it stays fast, and you always get the newest files.

## Tests added (81 in total)
- `garden_size` for 0, 1, 36, 37, 49 and 50 trees.
- Empty garden; one tree per finished lesson; each tree says why it was planted; planting order; retake grows the tree instead of planting a second one; failed quiz plants nothing.
- Page files get the `Cache-Control: no-cache` header.

## Try it yourself
1. Pass two quizzes, click each tree, and read why it was planted.
2. Change `TILE_H` in `garden.js` from 48 to 40. What happens to the look? Put it back.
3. Add a third topic in `seed_data.py` (delete `knowledge.db`, restart). Pass its quiz. What color is its tree, and where did that color come from?
4. In `plantingOrder`, remove `|| a.x - b.x`. Does anything change? Why is the main sort by `x + y` the important part?
5. Idea: show the planting date as a small label when you hover a tree. Where would you add it?
