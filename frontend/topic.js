// Topic page: reads the topic id from the URL, then loads the topic and its lessons.

async function loadTopicPage() {
  // topic.html?id=bikes  ->  "bikes"
  const topicId = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("topic-title");
  const description = document.getElementById("topic-description");
  const list = document.getElementById("lessons");

  if (!topicId) {
    title.textContent = "No topic selected";
    return;
  }

  try {
    // Two requests at the same time. Promise.all waits for both.
    const [topicResponse, lessonsResponse] = await Promise.all([
      fetch(`/api/topics/${encodeURIComponent(topicId)}`),
      fetch(`/api/topics/${encodeURIComponent(topicId)}/lessons`),
    ]);

    if (topicResponse.status === 404) {
      title.textContent = "Topic not found";
      return;
    }
    if (!topicResponse.ok || !lessonsResponse.ok) {
      throw new Error(`HTTP ${topicResponse.status} / ${lessonsResponse.status}`);
    }

    const topic = await topicResponse.json();
    const lessons = await lessonsResponse.json();

    document.title = `${topic.title} · Knowledge Garden`;
    title.textContent = `${topic.emoji} ${topic.title}`;
    description.textContent = topic.description;

    list.replaceChildren();
    for (const lesson of lessons) {
      list.appendChild(lessonItem(lesson));
    }
  } catch (error) {
    title.textContent = "Something went wrong";
    description.textContent = `${error.message}. Is the backend running?`;
  }
}

function lessonItem(lesson) {
  const item = document.createElement("li");
  item.className = "card lesson";

  const name = document.createElement("h3");
  name.textContent = lesson.title;

  const minutes = document.createElement("p");
  minutes.textContent = `Lesson ${lesson.order} · ${lesson.minutes} min`;

  item.append(name, minutes);
  return item;
}

loadTopicPage();
