// Topic page = one section of the field guide.
// Reads the topic id from the URL, then loads the topic, its lessons and the index (for the section number).
// The back link goes to the topic's category.

async function loadTopicPage() {
  // topic.html?id=bikes  ->  "bikes"
  const topicId = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("topic-title");
  const description = document.getElementById("topic-description");
  const list = document.getElementById("lessons");

  const back = document.getElementById("back");
  back.replaceChildren(icon("arrowLeft"), "Garden and index");

  if (!topicId) {
    title.textContent = "No topic selected";
    list.replaceChildren();
    return;
  }

  try {
    // Three requests at the same time. Promise.all waits for all of them.
    const [topic, lessons, topics] = await Promise.all([
      fetchJson(`/api/topics/${encodeURIComponent(topicId)}`),
      fetchJson(`/api/topics/${encodeURIComponent(topicId)}/lessons`),
      fetchJson("/api/topics"),
    ]);
    const section = topics.find((item) => item.id === topic.id).section;
    const learned = lessons.filter((lesson) => lesson.completed).length;

    document.title = `${topic.title} · Knowledge Garden`;
    if (topic.category_id) {
      back.href = `category.html?id=${encodeURIComponent(topic.category_id)}`;
      back.replaceChildren(icon("arrowLeft"), topic.category_title);
    }
    document.getElementById("topic-swatch").replaceChildren(topicSwatch(topic.category_id));
    title.textContent = topic.title;
    description.textContent = topic.description;
    document.getElementById("topic-meta").textContent =
      `${topic.category_title ? `${topic.category_title} · ` : ""}Section ${section} · ${lessons.length} ${lessons.length === 1 ? "entry" : "entries"} · ${learned} learned`;

    list.replaceChildren(...lessons.map((lesson) => entryRow(lesson, section)));
  } catch (error) {
    title.textContent = "Could not open this section";
    description.textContent = `${error.message}. Is the backend running?`;
    list.replaceChildren();
  }
}

// One row: "1.2  Brakes  4 min  Learned  ->". Links to lesson.html?id=bikes-brakes
function entryRow(lesson, section) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "entry-row";
  link.href = `lesson.html?id=${encodeURIComponent(lesson.id)}`;

  const number = document.createElement("span");
  number.className = "entry-row-number";
  number.textContent = entryNumber(section, lesson.position);

  const text = document.createElement("span");
  const name = document.createElement("span");
  name.className = "entry-row-title";
  name.textContent = lesson.title;
  const minutes = document.createElement("span");
  minutes.className = "entry-row-minutes";
  minutes.textContent = `${lesson.minutes} min read`;
  text.append(name, minutes);

  const status = document.createElement("span");
  status.className = "status";
  if (lesson.completed) {
    status.classList.add("learned");
    status.append(icon("check"), `Learned, ${lesson.best_score}/3`);
  } else if (!lesson.has_quiz) {
    status.textContent = "Read only"; // library entries get their self-test later
  } else {
    status.textContent = "Not yet";
  }

  const arrow = icon("arrowRight");
  arrow.classList.add("arrow");

  link.append(number, text, status, arrow);
  item.appendChild(link);
  return item;
}

loadTopicPage();
