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

  link.append(emoji, text);
  item.appendChild(link);
  return item;
}

function message(text, className) {
  const item = document.createElement("li");
  item.className = className;
  item.textContent = text;
  return item;
}

loadTopics();
