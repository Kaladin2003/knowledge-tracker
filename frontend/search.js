// Search box in the top bar (every page).
// As you type, it asks GET /api/search?q=... and shows matching lessons and topics under the box.
// Keyboard: Arrow Down moves into the results, Escape closes them, Enter opens the first result.
// Function names start with "search"-something on purpose: all plain scripts share one global scope,
// and quiz.js already has a showResults().

const SEARCH_DELAY = 150; // ms to wait after the last key press, so we don't call the API on every letter

let searchTimer = null;
let searchRequest = 0; // numbers the requests, so an old (slow) answer can't replace a newer one
let keepClosed = false; // after Escape, moving the focus back to the box must not reopen the results

function setUpSearch() {
  const form = document.getElementById("search-form");
  if (!form) return;
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  form.prepend(icon("search"));

  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(input.value), SEARCH_DELAY);
  });

  // Enter: open the first result (if there is one)
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const first = results.querySelector("a");
    if (first) window.location.href = first.href;
  });

  form.addEventListener("keydown", (event) => {
    const links = [...results.querySelectorAll("a")];
    const index = links.indexOf(document.activeElement);
    if (event.key === "Escape") {
      closeSearchResults();
      keepClosed = true;
      input.focus();
      keepClosed = false;
    } else if (event.key === "ArrowDown" && links.length) {
      event.preventDefault();
      links[Math.min(index + 1, links.length - 1)].focus();
    } else if (event.key === "ArrowUp" && index !== -1) {
      event.preventDefault();
      if (index === 0) input.focus();
      else links[index - 1].focus();
    }
  });

  // Close when the focus or a click goes somewhere else on the page
  form.addEventListener("focusout", (event) => {
    if (!form.contains(event.relatedTarget)) closeSearchResults();
  });
  input.addEventListener("focus", () => {
    if (!keepClosed && results.childElementCount) openSearchResults();
  });
}

async function runSearch(text) {
  const query = text.trim();
  const request = ++searchRequest;
  if (query.length < 2) {
    closeSearchResults();
    document.getElementById("search-results").replaceChildren();
    return;
  }

  try {
    const found = await fetchJson(`/api/search?q=${encodeURIComponent(query)}`);
    if (request !== searchRequest) return; // a newer search has started: ignore this answer
    showSearchResults(found, query);
  } catch (error) {
    showSearchResults({ lessons: [], topics: [], error: error.message }, query);
  }
}

function showSearchResults(found, query) {
  const results = document.getElementById("search-results");
  const rows = [
    ...found.lessons.map((lesson) => searchResultRow({
      href: `lesson.html?id=${encodeURIComponent(lesson.id)}`,
      title: lesson.title,
      meta: `Entry ${entryNumber(lesson.section, lesson.position)} · ${lesson.topic_title}${lesson.completed ? " · learned" : ""}`,
      categoryId: lesson.category_id,
      query,
    })),
    ...found.topics.map((topic) => searchResultRow({
      href: `topic.html?id=${encodeURIComponent(topic.id)}`,
      title: topic.title,
      meta: `Section ${topic.section} · ${topic.lesson_count} ${topic.lesson_count === 1 ? "entry" : "entries"}`,
      categoryId: topic.category_id,
      query,
    })),
  ];

  if (rows.length) {
    results.replaceChildren(...rows);
  } else {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = found.error ? `Search failed: ${found.error}` : `Nothing matches “${query}”.`;
    results.replaceChildren(empty);
  }
  document.getElementById("search-status").textContent =
    rows.length === 1 ? "1 result" : `${rows.length} results`;
  openSearchResults();
}

// One result: the category's tree, the title with the matching part highlighted, and a meta line
function searchResultRow({ href, title, meta, categoryId, query }) {
  const link = document.createElement("a");
  link.className = "search-result";
  link.href = href;

  if (typeof topicSwatch === "function") link.appendChild(topicSwatch(categoryId));

  const text = document.createElement("span");
  const name = document.createElement("span");
  name.className = "search-title";
  name.append(...highlightMatch(title, query));
  const details = document.createElement("span");
  details.className = "search-meta";
  details.textContent = meta;
  text.append(name, details);

  link.appendChild(text);
  return link;
}

// "Why the Moon has phases" + "moon" -> ["Why the ", <mark>Moon</mark>, " has phases"]
// Built from text nodes, never innerHTML, so a title can't inject HTML.
function highlightMatch(title, query) {
  const start = title.toLowerCase().indexOf(query.toLowerCase());
  if (start === -1) return [title];
  const mark = document.createElement("mark");
  mark.textContent = title.slice(start, start + query.length);
  return [title.slice(0, start), mark, title.slice(start + query.length)];
}

function openSearchResults() {
  document.getElementById("search-results").hidden = false;
  document.getElementById("search-input").setAttribute("aria-expanded", "true");
}

function closeSearchResults() {
  document.getElementById("search-results").hidden = true;
  document.getElementById("search-input").setAttribute("aria-expanded", "false");
}

setUpSearch();
