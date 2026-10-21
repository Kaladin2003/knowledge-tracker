// Category page: all topics of one category, e.g. category.html?id=philosophy
// Each topic keeps its section number from the whole index (GET /api/topics gives it).

async function loadCategoryPage() {
  const categoryId = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("category-title");
  const description = document.getElementById("category-description");
  const list = document.getElementById("category-topics");
  document.getElementById("back").replaceChildren(icon("arrowLeft"), "Garden and index");

  if (!categoryId) {
    title.textContent = "No category selected";
    list.replaceChildren();
    return;
  }

  try {
    const [categories, topics] = await Promise.all([
      fetchJson("/api/categories"),
      fetchJson(`/api/topics?category=${encodeURIComponent(categoryId)}`),
    ]);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) {
      title.textContent = "Category not found";
      list.replaceChildren();
      return;
    }

    document.title = `${category.title} · Knowledge Garden`;
    document.getElementById("category-swatch").replaceChildren(topicSwatch(category.id));
    title.textContent = category.title;
    description.textContent = category.description;
    document.getElementById("category-meta").textContent =
      `${speciesFor(category.id).name} · ${category.topic_count} ${category.topic_count === 1 ? "topic" : "topics"} · ` +
      `${category.completed_count} of ${category.lesson_count} entries learned`;

    list.replaceChildren(...topics.map(topicRow));
    if (topics.length === 0) {
      const empty = document.createElement("li");
      empty.className = "list-message";
      empty.textContent = "No topics here yet. Importing the library fills it.";
      list.appendChild(empty);
    }
  } catch (error) {
    title.textContent = "Could not open this category";
    description.textContent = `${error.message}. Is the backend running?`;
    list.replaceChildren();
  }
}

// One topic: "12  Philosophers  9 entries  2/9  ->"
function topicRow(topic) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "entry-row";
  link.href = `topic.html?id=${encodeURIComponent(topic.id)}`;

  const number = document.createElement("span");
  number.className = "entry-row-number";
  number.textContent = topic.section;

  const text = document.createElement("span");
  const name = document.createElement("span");
  name.className = "entry-row-title";
  name.textContent = topic.title;
  const size = document.createElement("span");
  size.className = "entry-row-minutes";
  size.textContent = `${topic.lesson_count} ${topic.lesson_count === 1 ? "entry" : "entries"}`;
  text.append(name, size);

  const arrow = icon("arrowRight");
  arrow.classList.add("arrow");

  link.append(number, text, progressCount(topic.completed_count, topic.lesson_count), arrow);
  item.appendChild(link);
  return item;
}

loadCategoryPage();
