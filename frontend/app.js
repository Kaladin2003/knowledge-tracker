// Runs in the browser. Asks the backend for the topics and shows them.

async function loadTopics() {
  const list = document.getElementById("topics");

  try {
    // Same server, so a relative URL is enough: no CORS setup needed.
    const response = await fetch("/api/topics");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const topics = await response.json();

    list.innerHTML = "";
    for (const topic of topics) {
      const item = document.createElement("li");
      item.className = "topic";
      item.innerHTML = `
        <span class="emoji">${topic.emoji}</span>
        <div>
          <h3>${topic.title}</h3>
          <p>${topic.description}</p>
        </div>`;
      list.appendChild(item);
    }
  } catch (error) {
    list.innerHTML = `<li class="error">Could not load topics: ${error.message}. Is the backend running?</li>`;
  }
}

loadTopics();
