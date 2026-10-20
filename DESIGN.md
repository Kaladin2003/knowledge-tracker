---
name: Knowledge Garden
description: A personal field guide where every lesson you pass plants a tree.
colors:
  cover: "#1f4a37"
  cover-deep: "#173a2b"
  cover-ink: "#eef5ef"
  cover-ink-2: "#b9d1c1"
  ground: "#edf1ec"
  page: "#ffffff"
  ink: "#17241d"
  ink-2: "#4c5c52"
  rule: "#d4dcd5"
  rule-strong: "#b3c0b6"
  action: "#1f6b48"
  action-hover: "#17573a"
  streak: "#a8540e"
  success: "#2a7449"
  success-bg: "#e2f0e6"
  error: "#b42318"
  error-bg: "#fbe8e6"
  selection: "#cfe6d6"
  grass-light: "#a6d46b"
  grass-dark: "#97c95c"
  soil: "#8d5d3b"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.1
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.15
  reading:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.page}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.page}"
    textColor: "{colors.action}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "44px"
  plate:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.lg}"
    padding: "24px"
  topbar:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
  option-right:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  option-wrong:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
---

# Design System: Knowledge Garden

## Overview

**Creative North Star: "The Personal Field Guide"**

Knowledge Garden is drawn as a naturalist's field guide that the reader writes by learning. Topics are numbered sections, lessons are numbered entries (2.3 = section 2, entry 3), the garden is a captioned plate, and the topic list is an index. The cover is a deep bottle green; the pages are white plates resting on a pale grey-green ground, separated by hairline rules.

The system is calm and dense enough for a five-minute daily visit: one obvious next step, honest numbers, no confetti. Expression lives in the details a field guide would have: tabular entry numbers, condensed display lettering, plate captions, and topic colours carried by small tree pictograms. It rejects the cartoon learning-app look: no mascots, no bubbly gradients, no emoji used as icons.

**Key Characteristics:**
- Numbered everything: sections, entries, plates.
- White plates on a grey-green ground with hairline rules, not floating cards.
- Condensed display face for headings and numbers, a serif only for reading, system UI for controls.
- Colour is reserved in the interface (one green action colour, one rust streak colour); the garden is where colour lives, one tree species per category.

## Colors

A cool, botanical palette: bottle-green cover, grey-green ground, near-black green ink, with rust kept for the streak alone.

### Primary
- **Bottle Green Cover** (#1f4a37): the top bar and the favicon tile. It is the guide's binding.
- **Field Green Action** (#1f6b48): primary buttons, links, focus outlines, progress meters. Hover deepens to #17573a.

### Secondary
- **Rust Streak** (#a8540e): the streak flame and the thirsty-garden status. Nothing else uses it.

### Garden colours
- **Grass** (#a6d46b / #97c95c checkerboard, edge #7fb04a) and **Soil** (#8d5d3b left side, #6f4630 right side) on a **Cover Deep** (#173a2b) backdrop.
- **Tree species** (in `frontend/trees.js`), one per category, each with a dark / mid / light palette: Pine (technology), Lantern tree (science), Apple tree (nature and health), Blossom tree (psychology), Olive tree (philosophy), Oak (history), Flower bush (arts), Maple (society), Topiary (mathematics). Unknown categories grow an oak. A thirsty garden turns every species dry brown (#7d6346 / #9b7d58 / #bc9f76).

### Neutral
- **Ground** (#edf1ec): the page background.
- **Page White** (#ffffff): plates.
- **Ink** (#17241d) and **Ink 2** (#4c5c52): text and secondary text.
- **Rule** (#d4dcd5) and **Rule Strong** (#b3c0b6): hairlines, borders, scrollbar.

### Named Rules
**The One Rust Rule.** Rust means the streak. Never use it for buttons, links or decoration.
**The Species Rule.** A category is shown by its tree species (in the garden, the index, the topic header and the key), never by a coloured label. Text and controls stay green and ink.

## Typography

**Display Font:** Barlow Condensed 500/600 (self-hosted, with Arial Narrow)
**Reading Font:** Source Serif 4 400/400 italic/600 (self-hosted, with Georgia)
**UI Font:** system-ui stack

**Character:** The condensed sans gives headings and numbers the compact authority of a printed guide. The serif makes the lesson feel like reading, not using an app.

### Hierarchy
- **Display** (600, 2.75rem, 1.1): lesson title, with its entry number inline in Ink 2.
- **Headline** (600, 2.25–2.5rem, 1.1): page titles such as "Your garden" and the topic name.
- **Title** (600, 1.35–1.75rem): entry rows, next-entry title, quiz questions.
- **Reading** (400, 1.1875rem, 1.65, max 65ch): Wikipedia lesson text only.
- **Body** (400, 1rem, 1.5): everything else.
- **Label** (600, 0.875rem): statuses such as "Learned, 3/3".

### Named Rules
**The Inline Number Rule.** An entry number sits on the same line as its title (`1.3 Brakes: rim vs disc`) or in a column beside it. It never sits above a heading as a kicker.
**The Tabular Rule.** Every number that can change (entry numbers, counts, scores, streak) uses `font-variant-numeric: tabular-nums`.

## Layout

The page is centred at a 1180px maximum width. The home page is a two-column grid (3fr garden plate, minmax(300px, 2fr) side column) that stacks below 960px. Lesson body: a reading column capped at 65ch beside a 220–300px figure column, which stacks below 960px. Spacing uses a 4px base scale (s1–s8). Below 600px, the page gutter becomes 16px, top-bar labels hide (numbers and icons stay), and quiz plates tighten to 16px padding.

## Elevation & Depth

The system is mostly flat. Plates carry one quiet ambient shadow so they read as pages lying on the ground, and depth inside a plate comes from hairline rules, not shadows.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 1px 2px rgba(23, 36, 29, 0.06), 0 6px 18px rgba(23, 36, 29, 0.06)`): every `.plate`. Nothing else casts a shadow.

## Shapes

Radius is small and consistent: 6px for plates, buttons, options, entry cards and the garden backdrop; 4px for lesson figures; 2px for meters. The garden is the one illustrated shape: an isometric block of 96×48 diamond tiles with a wavy grass edge over the soil, grass tufts and tiny flowers on empty tiles. Trees are flat-shaded vector shapes lit from the upper right (dark base, mid colour, soft highlight; trunks split into a shaded and a lit half). A 3/3 tree is full size with fruit or flowers; a 2/3 tree is drawn at 72% without them.

## Components

- **Top bar:** cover green, wordmark (tree mark plus display face), and two stats: flame + streak number, leaves + "N of M entries learned". The flame turns warm (#f2a65a) when the streak is alive.
- **Plate:** white, 1px rule border, 6px radius, plate shadow. Every content block is a plate.
- **Plate caption:** a hairline rule above, then small Ink 2 text starting "Plate N.".
- **Garden:** the block on a Cover Deep backdrop; a selected or focused tree gets a white ring on its tile.
- **Key to the trees:** under the plate caption, every category with its small tree; categories without topics are faded.
- **Entry card (tree info):** the entry number in a large left column, then the title, a `dl` of Topic / Tree / Planted / Self-test, and one link.
- **Index row and entry row:** a ruled list; number column, the category's tree as the topic mark, name with a description, count, and a 3px meter in action green.
- **Buttons:** primary is filled field green, 44px minimum height, with an optional trailing arrow icon. Secondary is white with green text. Text buttons are underlined ink and turn red on hover (only "Reset all progress").
- **Quiz option:** a bordered row with a radio; checked is green-tinted. After grading, the right answer is success-tinted with a check icon and a wrong pick is error-tinted with a cross icon. Each question ends with a bold "Correct." or "Not quite." and the explanation.
- **Icons:** authored 24×24 line icons (1.75 stroke, round caps) from `ICON_PATHS` in `common.js`. Never emoji.

## Do's and Don'ts

- **Do** number sections and entries and show the number with the title.
- **Do** credit Wikipedia under every lesson with a link and the licence.
- **Do** keep every interactive element keyboard-reachable, garden trees included (`tabindex="0"`, `role="button"`, Enter/Space).
- **Don't** use emoji as icons; add a path to `ICON_PATHS` instead.
- **Don't** put a small label above a heading (kicker/eyebrow).
- **Don't** use rust outside the streak, or tree colours on text and controls.
- **Don't** copy another app's garden artwork; draw new species in `trees.js` in the same flat-shaded style.
- **Don't** add a coloured stripe on the side of a card or a gradient on text.
