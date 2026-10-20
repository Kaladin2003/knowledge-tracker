// Home page: the index of topics, the next entry to learn, and the daily streak.
// Helpers like fetchJson and icon come from common.js; topicSwatch from trees.js.

let topicsCache = []; // the topics in index order; their position is the section number

async function loadTopics() {
  const list = document.getElementById("topics");

  try {
    // Same server, so a relative URL is enough: no CORS setup needed.
    topicsCache = await fetchJson("/api/topics");

    list.replaceChildren(); // remove "Loading…"
    topicsCache.forEach((topic, index) => list.appendChild(indexRow(topic, index + 1)));
    loadNextEntry();
  } catch (error) {
    list.replaceChildren(message(`Could not load topics: ${error.message}. Is the backend running?`, "error"));
    document.getElementById("next-entry").replaceChildren(paragraph("The index is not available right now.", "muted"));
  }
}

// One row of the index: section number, swatch, name, "1/3", and a thin progress meter
function indexRow(topic, sectionNumber) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "index-row";
  link.href = `topic.html?id=${encodeURIComponent(topic.id)}`;

  const number = document.createElement("span");
  number.className = "section-number";
  number.textContent = sectionNumber;

  const text = document.createElement("span");
  const name = document.createElement("span");
  name.className = "index-name";
  name.textContent = topic.title;
  const description = document.createElement("span");
  description.className = "index-description";
  description.textContent = topic.description;
  text.append(name, description);

  const count = document.createElement("span");
  count.className = "index-count";
  count.textContent = `${topic.completed_count}/${topic.lesson_count}`;
  count.setAttribute("aria-label", `${topic.completed_count} of ${topic.lesson_count} learned`);
  const complete = topic.lesson_count > 0 && topic.completed_count === topic.lesson_count;
  count.classList.toggle("complete", complete);

  const meter = document.createElement("span");
  meter.className = "meter";
  meter.setAttribute("aria-hidden", "true");
  const fill = document.createElement("span");
  fill.style.width = topic.lesson_count ? `${(topic.completed_count / topic.lesson_count) * 100}%` : "0%";
  meter.appendChild(fill);

  link.append(number, topicSwatch(topic.category_id), text, count, meter);
  item.appendChild(link);
  return item;
}

// The next entry: the first lesson not learned yet, in index order
async function loadNextEntry() {
  const slot = document.getElementById("next-entry");
  const sectionIndex = topicsCache.findIndex((topic) => topic.completed_count < topic.lesson_count);

  if (sectionIndex === -1) {
    slot.replaceChildren(
      paragraph("You have learned every entry in the guide.", "next-meta"),
      paragraph("New topics are coming. Until then, retake a self-test to grow a young tree to full size.", "muted"),
    );
    return;
  }

  try {
    const topic = topicsCache[sectionIndex];
    const lessons = await fetchJson(`/api/topics/${encodeURIComponent(topic.id)}/lessons`);
    const lesson = lessons.find((item) => !item.completed);

    // "1.2  The drivetrain…": the entry number sits beside the title, like a field guide entry
    const title = document.createElement("p");
    title.className = "next-title";
    const number = document.createElement("span");
    number.className = "next-number";
    number.textContent = entryNumber(sectionIndex + 1, lesson.position);
    title.append(number, " ", lesson.title);
    const meta = document.createElement("p");
    meta.className = "next-meta";
    meta.append(`${topic.title} · `, icon("clock"), ` ${lesson.minutes} min read, then a 3-question self-test`);

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
    loadTopics();
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
loadTopics();
loadStreak();
