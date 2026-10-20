---
version: 1
slug: "frontend-index-html"
primary_target: "frontend/index.html"
related_targets: ["frontend/topic.html","frontend/lesson.html"]
---

# Knowledge Garden: app surfaces (home, topic, lesson)

Scope: the three web pages of the app. Home and topic pages are Operate (do today's lesson, see progress); the lesson page is Read (understand the lesson, then self-test).
Audience: curious adults, ~5 minutes a day, desktop browser first.
Task: see streak and garden, continue with the next lesson, read it, pass the self-test.
Content: real topics, lessons, Wikipedia text and images, hand-written quizzes. No invented stats or users.
Constraints: plain HTML/CSS/JS, no framework, readable learning-project code, keyboard access incl. trees, Wikipedia credit on every lesson.

## Direction contract

THESIS: The app is a personal field guide to what you have learned: every lesson is a numbered entry and every tree in the garden is a specimen you can look up. It refuses the bright cartoon learning-app look (big green buttons, mascots, confetti).

OWN-WORLD: Deep field-guide cover green shell (top bar), clean white plate pages on a pale grey-green ground, near-black green ink, hairline rules, per-topic plate colours (rust for Bikes, indigo for Space, hashed hue for others) carried into trees and swatches. Barlow Condensed for entry numbers, titles and labels; system UI sans for controls; Source Serif 4 for lesson reading. Authored SVG icons, no emoji icons.

STORY: The visitor sees how many entries they have collected and their streak, sees the next entry to learn, opens it, reads, self-tests, and watches a new specimen appear in the garden plate.

FIRST VIEWPORT: Cover-green top bar: wordmark left, streak count and entries count right. Below, a two-column page at desktop: left (about 60%) the garden plate, a white plate with a ruled caption line "Plate 1: Your garden, 5 specimens" and the isometric garden; clicking a tree opens its field-guide entry under the plate. Right (about 40%): the "Next entry" panel with entry number, title, topic and a primary "Start lesson" button; under it the topic index as a ruled list with section numbers, swatch, name, progress count and a hairline progress bar.

FORM: Field guide (natural-history field guides: numbered entries, plates, index). Position 1 on the ordered list; chosen by the user over the assigned direction (position 7, Systematic Garden). seed:81ce4dd238aca772

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
