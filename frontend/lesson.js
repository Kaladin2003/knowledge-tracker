// Lesson page: reads the lesson id from the URL and shows its text from Wikipedia.

async function loadLessonPage() {
  const lessonId = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("lesson-title");
  const meta = document.getElementById("lesson-meta");

  if (!lessonId) {
    title.textContent = "No lesson selected";
    return;
  }
  setUpQuiz(lessonId); // defined in quiz.js; the quiz works even if Wikipedia is down

  try {
    const response = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}`);
    if (!response.ok) {
      // FastAPI puts the error message in "detail"
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    const lesson = await response.json();

    document.title = `${lesson.title} · Knowledge Garden`;
    title.textContent = lesson.title;
    meta.textContent = `Lesson ${lesson.order} · ${lesson.minutes} min`;
    document.getElementById("back").href = `topic.html?id=${encodeURIComponent(lesson.topic_id)}`;

    showBody(lesson.content);
    showSource(lesson.source, lesson.content.title);
  } catch (error) {
    title.textContent = "Could not load this lesson";
    meta.textContent = error.message;
  }
}

function showBody(content) {
  const body = document.getElementById("lesson-body");
  body.replaceChildren();

  if (content.image) {
    const image = document.createElement("img");
    image.src = content.image;
    image.alt = content.title;
    image.className = "lesson-image";
    body.appendChild(image);
  }

  // Wikipedia's extract is plain text; blank lines separate paragraphs
  for (const text of content.extract.split("\n").filter((line) => line.trim())) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    body.appendChild(paragraph);
  }
}

// Wikipedia text is CC BY-SA: we must credit it and link to the article
function showSource(source, articleTitle) {
  const line = document.getElementById("lesson-source");
  const link = document.createElement("a");
  link.href = source.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = `“${articleTitle}” on ${source.name}`;
  line.replaceChildren("Source: ", link, `, licensed ${source.license}. Read the full article for more.`);
}

loadLessonPage();
