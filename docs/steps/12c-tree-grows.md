# Step 12c: The tree grows when it is planted

## What we built

Pass a self-test, click **See your garden**, and the new tree **grows up from its tile**: it pops up a bit too big, settles to its real size, and a few yellow sparks fly out of its crown. Its entry card opens by itself, and the garden says "Just planted: …" (or "Just grew: …" when a retake made a young tree full size).

If your computer has **reduce motion** turned on, there is no animation: the tree is simply there, selected.

## Key ideas

### Passing information to the next page with the URL
The quiz result links to `/?planted=bikes-drivetrain`. The garden reads it with
```js
new URLSearchParams(window.location.search).get("planted")
```
and afterwards removes it with `history.replaceState(...)`, so a reload doesn't replay the animation.

### CSS keyframes
```css
@keyframes tree-grow {
  0%   { opacity: 0; transform: scale(0.15); }
  70%  { transform: scale(1.08); }   /* a little too big... */
  100% { transform: scale(1); }      /* ...then it settles */
}
.tree.growing { animation: tree-grow 900ms cubic-bezier(0.2, 0.8, 0.3, 1) 300ms both; }
```
- `transform-origin: 50% 100%` (already on `.tree`) makes it grow **from the ground up**, not from the middle.
- `300ms` is a delay, so the page is visible before the tree appears.
- `both` keeps the 0% frame during the delay (invisible) and the 100% frame at the end.

### One animation, many directions: CSS variables
Each spark gets its own direction in a `style` attribute: `--dx: -26px; --dy: -14px`. One keyframe rule uses them: `transform: translate(var(--dx), var(--dy))`.

### Cleaning up after an animation
- `animationend` fires when an animation finishes. Each spark removes itself; the tree loses its `growing` class, so the normal hover effect works again.
- Events **bubble**: the sparks' `animationend` also reaches the tree's listener, so it checks `event.target === group`.
- The bug of the day: at first the tree's listener removed **all** the sparks when the tree finished (1.2 s), before the sparks had finished flying (1.7 s), so they were never seen. Lesson: let each element clean up after its own animation.

### Respecting "reduce motion"
Some people get dizzy from motion. `window.matchMedia("(prefers-reduced-motion: reduce)")` asks the system setting; when it's on, we skip the animation (CSS has a matching `@media` rule too).

## Try it
1. Open a lesson, pass its self-test, click **See your garden**.
2. Reload the page: no animation the second time.
3. Windows: Settings > Accessibility > Visual effects > turn off **Animation effects**, and try again.
