# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Desktop-first web app (confirmed), served on localhost during development. A phone app comes later and will reuse the same API.

## Users

Curious adults who want a small daily learning habit: about 5 minutes a day, learning how things work (bikes, space, and later a large library such as philosophy).

## Product Purpose

Knowledge Garden teaches a little every day. The user picks a topic, reads a short lesson, passes a 3-question quiz, and keeps a daily streak. Success: the user comes back every day and can see what they have learned.

## Positioning

Every finished lesson plants a tree in the user's own garden. The garden is a map of what the user actually knows: each tree can be clicked to see why it was planted (lesson, topic, date, best score). Tree style follows the topic; tree size follows the best quiz score; the garden looks thirsty when the streak breaks.

## Operating Context

- Daily routine: open the app, see the streak and garden, pick or continue a topic, read, take the quiz.
- Lesson text comes from the Wikipedia REST API (page summaries) and must credit Wikipedia (CC BY-SA 4.0) with a link to the article.
- Quiz questions are graded on the server; answers are never sent before submitting.

## Capabilities and Constraints

- Stack: FastAPI backend, SQLite, plain HTML/CSS/JavaScript frontend (no framework, no build step). Pages: home (`index.html`), topic (`topic.html?id=`), lesson + quiz (`lesson.html?id=`).
- Features: topics with ordered lessons, Wikipedia lesson text with image, quiz with explanations (2 of 3 to pass), saved progress, daily streak (time-zone aware), isometric SVG garden with clickable trees, reset progress.
- Single user for now; accounts come later.
- Planned: large library imported from Wikipedia Vital Articles, generated quizzes, search for any topic.
- This is a learning project: code must stay readable, and each step is committed separately.

## Brand Commitments

- Name: Knowledge Garden (repository: knowledge-tracker).
- The garden metaphor: one tree per piece of knowledge, inspired by the Forest app's garden view, but drawn in the project's own style (no copied artwork).

## Evidence on Hand

- Real content: 2 topics, 6 lessons, 18 hand-written quiz questions (`backend/seed_data.py`), lesson text from Wikipedia.
- No users, testimonials, or metrics yet. Do not invent any.

## Product Principles

1. The daily habit comes first: the next step to learn today is always obvious.
2. Show knowledge, not points: the garden reflects what was actually learned.
3. Honest feedback: explain every quiz answer; credit every source.
4. Small and calm: one short lesson a day is enough.

## Accessibility & Inclusion

Keyboard access for every interactive element, including garden trees; readable text sizes for reading lessons.
