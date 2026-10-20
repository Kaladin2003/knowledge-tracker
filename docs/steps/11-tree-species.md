# Step 11: Categories and tree species

## What we built

Every topic now belongs to a **category**, and every category grows **its own kind of tree** in the garden:

| Category | Tree |
|---|---|
| Technology | Pine |
| Science | Lantern tree (yellow lights) |
| Nature and health | Apple tree |
| Psychology | Blossom tree (pink) |
| Philosophy | Olive tree |
| History | Oak |
| Arts | Flower bush |
| Society | Maple (autumn red) |
| Mathematics | Topiary (clipped balls) |

- The garden got a new look, inspired by the Forest app but drawn in our own style: a dark backdrop, a grass edge hanging over the soil, pebbles, grass tufts and tiny flowers on empty tiles.
- **3/3** = a full-size tree with fruit or flowers. **2/3** = a young, smaller tree.
- Under the garden there is a **key to the trees**. Categories without topics yet are faded, so you can see what will grow later.
- The index and topic pages show the category's tree next to each topic.
- New API: `GET /api/categories`. Topics and garden trees now include `category_id` and `category_title`.

## Key ideas

### Do we need a "bot" to sort topics? Not yet
- Our own topics: the category is written by hand in `seed_data.py`.
- The big library (Step 12): Wikipedia's Vital Articles list is already split into sections by its editors, so the category comes with the import.
- Only a topic that is in no list (search, Step 14) needs a **classifier** that guesses its category from the text. That is a nice machine-learning step for later.

### A new table and a foreign key
```sql
CREATE TABLE categories (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL);
-- topics.category_id REFERENCES categories(id)
```
`LEFT JOIN categories` adds the category title to the topic rows. LEFT, so a topic without a category still shows up.

### Migrations: changing a database that already has data
`CREATE TABLE IF NOT EXISTS` **never changes a table that already exists**. Your `knowledge.db` from Step 10 has a `topics` table without `category_id`, and we don't want to delete it (your progress is in there). So `db.py` has `migrate()`:

```python
if "category_id" not in column_names(connection, "topics"):   # PRAGMA table_info(topics)
    connection.execute("ALTER TABLE topics ADD COLUMN category_id TEXT REFERENCES categories(id)")
```
Then `fill_missing_categories()` gives the old topics their category. The test `test_old_database_gets_categories` builds an old-style database and checks that it gets updated without losing data. Big projects use tools like Alembic for this; the idea is the same.

### Data vs drawing
The backend only knows the **category** (data). Which tree grows for it is a **drawing decision**, so it lives in the frontend: `CATEGORY_SPECIES` in `trees.js`. To change the tree of a category, you only touch the frontend.

### One function per species, same arguments
```js
draw(group, x, y, size, palette, full)
```
Every species is drawn the same way: `(x, y)` is where the trunk meets the ground, `size` makes young trees smaller, `full` adds fruit or flowers. The garden, the key and the index all call `drawSpecies(...)`, so a new species shows up everywhere at once.

### Simple 3D with flat shapes
- **A ball of leaves** = 3 circles: a dark one, a mid one moved up and right, a small light one (the light comes from the upper right).
- **A pine tier** = a triangle cut in two: dark left half, lighter right half.
- **A trunk** = two thin rectangles: dark left, light right.

### A fixed "random"
The tufts and flowers on empty tiles must not jump around on every reload. `cellNoise(x, y)` turns a cell's position into a number from 0 to 1 that is always the same for that cell (a tiny hash with `Math.sin`).

## Try it
1. Restart the server. Your old `knowledge.db` is updated automatically.
2. Open http://localhost:8000: Bikes lessons grow pines, Space lessons grow lantern trees.
3. Open http://localhost:8000/api/categories to see all categories.
