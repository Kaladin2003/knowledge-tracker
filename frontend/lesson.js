// Lesson page = one entry of the field guide: read it, then take the self-test.
// Reads the lesson id from the URL and shows its text from Wikipedia.

async function loadLessonPage() {
  const lessonId = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("lesson-title");
  const meta = document.getElementById("lesson-meta");
  const back = document.getElementById("back");
  back.replaceChildren(icon("arrowLeft"), "Back");

  if (!lessonId) {
    title.textContent = "No lesson selected";
    return;
  }
  setUpQuiz(lessonId); // defined in quiz.js; the self-test works even if Wikipedia is down

  try {
    const [lesson, topics] = await Promise.all([
      fetchJson(`/api/lessons/${encodeURIComponent(lessonId)}`),
      fetchJson("/api/topics").catch(() => []),
    ]);
    const sectionIndex = topics.findIndex((topic) => topic.id === lesson.topic_id);
    const topic = topics[sectionIndex];

    document.title = `${lesson.title} · Knowledge Garden`;
    if (topic) {
      document.getElementById("lesson-number").textContent = entryNumber(sectionIndex + 1, lesson.position);
      back.replaceChildren(icon("arrowLeft"), `Section ${sectionIndex + 1}: ${topic.title}`);
    }
    back.href = `topic.html?id=${encodeURIComponent(lesson.topic_id)}`;
    title.textContent = lesson.title;

    const minutes = document.createElement("span");
    minutes.className = "status";
    minutes.append(icon("clock"), `${lesson.minutes} min read`);
    const status = document.createElement("span");
    status.className = "status";
    if (lesson.completion) {
      status.classList.add("learned");
      status.append(icon("check"), `Learned, best ${lesson.completion.best_score}/3`);
    } else {
      status.textContent = "Not learned yet";
    }
    const section = document.createElement("span");
    section.textContent = topic ? topic.title : "";
    meta.replaceChildren(...(topic ? [section] : []), minutes, status);

    showBody(lesson.content);
    showSource(lesson.source, lesson.content.title);
    document.getElementById("lesson-body").hidden = false;
  } catch (error) {
    title.textContent = "Could not load this lesson";
    meta.textContent = error.message;
  }
}

function showBody(content) {
  const reading = document.getElementById("reading");
  // Wikipedia's extract is plain text; line breaks separate paragraphs
  const paragraphs = content.extract.split("\n").filter((line) => line.trim());
  reading.replaceChildren(
    ...paragraphs.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }),
  );

  const figure = document.getElementById("figure");
  if (content.image) {
    const image = document.createElement("img");
    image.src = content.image;
    image.alt = content.title;
    const caption = document.createElement("figcaption");
    caption.textContent = `Fig. ${content.title}`;
    figure.replaceChildren(image, caption);
    figure.hidden = false;
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
