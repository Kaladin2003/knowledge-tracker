// Home page: the next entry to learn, the daily streak, and the index of categories.
// Helpers like fetchJson and icon come from common.js; topicSwatch from trees.js.

// The index lists categories; each one opens a page with its topics (category.html).
async function loadIndex() {
  const list = document.getElementById("topics");

  try {
    // Same server, so a relative URL is enough: no CORS setup needed.
    const categories = await fetchJson("/api/categories");
    const used = categories.filter((category) => category.topic_count > 0);

    list.replaceChildren(...used.map(categoryRow)); // also removes "Loading…"
  } catch (error) {
    list.replaceChildren(message(`Could not load the index: ${error.message}. Is the backend running?`, "error"));
  }
}

// One row of the index: tree, name, "3 topics · 1/12", and a thin progress meter
function categoryRow(category) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "index-row category-row";
  link.href = `category.html?id=${encodeURIComponent(category.id)}`;

  const text = document.createElement("span");
  const name = document.createElement("span");
  name.className = "index-name";
  name.textContent = category.title;
  const description = document.createElement("span");
  description.className = "index-description";
  description.textContent = `${category.topic_count} ${category.topic_count === 1 ? "topic" : "topics"} · ${category.description}`;
  text.append(name, description);

  link.append(topicSwatch(category.id), text, progressCount(category.completed_count, category.lesson_count), meter(category.completed_count, category.lesson_count));
  item.appendChild(link);
  return item;
}

// The next entry: the server picks it (GET /api/next)
async function loadNextEntry() {
  const slot = document.getElementById("next-entry");

  try {
    const [lesson, topics] = await Promise.all([fetchJson("/api/next"), fetchJson("/api/topics")]);

    if (!lesson) {
      slot.replaceChildren(
        paragraph("You have learned every entry that has a self-test.", "next-meta"),
        paragraph("Library entries can already be read; their self-tests are coming soon. Until then, retake a self-test to grow a young tree.", "muted"),
      );
      return;
    }

    const topic = topics.find((item) => item.id === lesson.topic_id);
    // "1.2  The drivetrain…": the entry number sits beside the title, like a field guide entry
    const title = document.createElement("p");
    title.className = "next-title";
    const number = document.createElement("span");
    number.className = "next-number";
    number.textContent = entryNumber(topic.section, lesson.position);
    title.append(number, " ", lesson.title);
    const meta = document.createElement("p");
    meta.className = "next-meta";
    meta.append(`${lesson.topic_title} · `, icon("clock"), ` ${lesson.minutes} min read, then a 3-question self-test`);

    const start = document.createElement("a");
    start.className = "button";
    start.href = `lesson.html?id=${encodeURIComponent(lesson.id)}`;
    start.append("Start lesson", icon("arrowRight"));

    slot.replaceChildren(title, meta, start);
  } catch (error) {
    slot.replaceChildren(paragraph(`Could not find the next entry: ${error.message}`, "message-error"));
  }
}

// The daily streak, in the user's time zone
async function loadStreak() {
  const slot = document.getElementById("streak");
  try {
    const streak = await fetchJson(`/api/streak?tz=${encodeURIComponent(userTimeZone())}`);

    const line = document.createElement("div");
    line.className = "streak-line";
    line.classList.toggle("cold", streak.current === 0);

    const text = document.createElement("div");
    const count = paragraph(
      streak.current === 1 ? "1 day in a row" : `${streak.current} days in a row`,
      "streak-count",
    );
    const today = paragraph(
      streak.learned_today
        ? `Today is done. Best so far: ${streak.best} ${streak.best === 1 ? "day" : "days"}.`
        : streak.current > 0
          ? "Pass one self-test today to keep it going."
          : "Pass one self-test today to start a streak.",
      "streak-today",
    );
    today.classList.toggle("done", streak.learned_today);
    text.append(count, today);

    line.append(icon("flame"), text);
    slot.replaceChildren(line);
  } catch {
    slot.replaceChildren(paragraph("The streak is not available right now.", "muted"));
  }
}

// DELETE /api/progress after the user confirms
async function resetProgress() {
  if (!confirm("Forget every learned entry and your streak? This cannot be undone.")) return;
  const response = await fetch("/api/progress", { method: "DELETE" });
  if (response.ok) {
    loadIndex();
    loadNextEntry();
    loadStreak();
    loadTopbarStats(); // defined in common.js
    loadGarden(); // defined in garden.js
  }
}

function paragraph(text, className) {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  return element;
}

function message(text, className) {
  const item = document.createElement("li");
  item.className = `list-message ${className}`;
  item.textContent = text;
  return item;
}

document.getElementById("reset-progress").addEventListener("click", resetProgress);
loadIndex();
loadNextEntry();
loadStreak();
