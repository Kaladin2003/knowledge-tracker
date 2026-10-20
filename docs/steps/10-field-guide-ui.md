# Step 10: The Field Guide redesign

## What we built

The whole frontend got a new look: the app is now drawn as a **personal field guide** (like a bird or plant guide) that you fill in by learning.

- **Topics are numbered sections, lessons are numbered entries.** Entry `1.3` = section 1 (Bikes), lesson 3. The number is never stored: it comes from the order of `/api/topics` and the lesson's `position`.
- **Home page:** the garden is "Plate 1" on the left. On the right: the **next entry** to learn (one button), the **daily streak**, and the **index** of topics with a small progress meter.
- **Click a tree** and its entry opens under the plate: number, title, topic, date planted, self-test score.
- **Topic page:** a ruled list of entries with "Learned, 3/3" or "Not yet".
- **Lesson page:** big title with its entry number, a serif reading column, the Wikipedia image as a figure, the source line, then the **self-test**.
- **Top bar on every page:** streak and "N of M entries learned".
- **No emoji as icons anymore.** Icons are small SVG drawings in `common.js`.

Backend change: `/api/garden` now also returns `lesson_position`, so a tree knows its entry number.

## Key ideas

### Design tokens
All colours, fonts and spacing are CSS variables at the top of `style.css`:

```css
:root {
  --cover: #1f4a37;   /* the top bar */
  --ground: #edf1ec;  /* page background */
  --action: #1f6b48;  /* buttons and links */
  --streak: #a8540e;  /* only the streak flame */
  --s4: 16px;         /* spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 */
}
.button { background: var(--action); padding: 0 var(--s5); }
```
Change a token once and the whole app follows. `DESIGN.md` writes these rules down, so new pages (and AI helpers) stay in the same style.

### A shared script: `common.js`
Every page loads `common.js` first. It holds code used everywhere: `icon()`, `topicColor()`, `topicSwatch()`, `entryNumber()`, `fetchJson()` and the top bar. Plain `<script>` files share one global scope, so **a `const` can be declared only once**: that is why `SVG_NS` now lives only in `common.js` (declaring it again in `garden.js` would be a SyntaxError).

### `[hidden]` vs `display`
The `hidden` attribute is just a default `display: none`. A class with `display: grid` **wins** over it, so a "hidden" box still showed. One rule fixes it everywhere:
```css
[hidden] { display: none !important; }
```

### CSS specificity
A wrong answer you picked has two matching rules: `.option:has(input:checked)` (green) and `.option.wrong` (red). The first is *more specific* (`:has(...)` counts its inside), so it won. Fix: `.option.wrong:has(input:checked)` makes the red rule at least as strong.

### Self-hosted fonts
The fonts are `.woff2` files in `frontend/fonts/`, loaded with `@font-face`. No Google request, works offline, and the licence (OFL) is in `fonts/README.md`.

### Accessibility kept
- Trees: `tabindex="0"`, `role="button"`, Enter/Space.
- Icons that mean something get `role="img"` + `aria-label` (the check and cross in the self-test); decorative ones get `aria-hidden="true"`.
- A real space between "1.2" and the title, so a screen reader doesn't read "1.2The".

## Try it
1. `uvicorn backend.main:app --reload`, open http://localhost:8000.
2. Click **Start lesson**, read, take the self-test, get 2 of 3 right.
3. Click **See your garden** and click the new tree.
4. Make the window narrow (phone width): everything stacks in one column.
