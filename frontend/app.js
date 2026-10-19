// Home page: asks the backend for the topics and shows them as links.

async function loadTopics() {
  const list = document.getElementById("topics");

  try {
    // Same server, so a relative URL is enough: no CORS setup needed.
    const response = await fetch("/api/topics");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const topics = await response.json();

    list.replaceChildren(); // remove "Loading…"
    for (const topic of topics) {
      list.appendChild(topicCard(topic));
    }
  } catch (error) {
    list.replaceChildren(message(`Could not load topics: ${error.message}. Is the backend running?`, "error"));
  }
}

// One clickable card. It links to the topic page with the topic id in the URL:
// topic.html?id=bikes
function topicCard(topic) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "card topic";
  link.href = `topic.html?id=${encodeURIComponent(topic.id)}`;

  const emoji = document.createElement("span");
  emoji.className = "emoji";
  emoji.textContent = topic.emoji;

  const text = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = topic.title;
  const description = document.createElement("p");
  description.textContent = topic.description;
  text.append(title, description);

  // "1/3" finished lessons in this topic
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = `${topic.completed_count}/${topic.lesson_count}`;
  if (topic.lesson_count > 0 && topic.completed_count === topic.lesson_count) {
    count.classList.add("done");
  }

  link.append(emoji, text, count);
  item.appendChild(link);
  return item;
}

// "You finished 2 of 6 lessons" above the topics
async function loadProgressSummary() {
  const summary = document.getElementById("progress-summary");
  try {
    const response = await fetch("/api/progress");
    if (!response.ok) return;
    const progress = await response.json();
    summary.textContent =
      progress.completed_count === 0
        ? "Pick a topic and finish your first lesson 🌱"
        : `You finished ${progress.completed_count} of ${progress.total_lessons} lessons.`;
    summary.hidden = false;
  } catch {
    // The topics list already shows a "backend not running" message
  }
}

// DELETE /api/progress after the user confirms
async function resetProgress() {
  if (!confirm("Forget all finished lessons? This cannot be undone.")) return;
  const response = await fetch("/api/progress", { method: "DELETE" });
  if (response.ok) {
    loadTopics();
    loadProgressSummary();
  }
}

document.getElementById("reset-progress").addEventListener("click", resetProgress);
loadProgressSummary();

function message(text, className) {
  const item = document.createElement("li");
  item.className = className;
  item.textContent = text;
  return item;
}

loadTopics();
