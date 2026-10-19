// Quiz on the lesson page.
// 1. GET  /api/lessons/{id}/quiz  -> questions and options (no answers)
// 2. user picks one option per question
// 3. POST /api/lessons/{id}/quiz  -> score, correct answers, explanations

function setUpQuiz(lessonId) {
  const section = document.getElementById("quiz-section");
  const startButton = document.getElementById("start-quiz");
  const form = document.getElementById("quiz-form");

  section.hidden = false;
  startButton.addEventListener("click", () => startQuiz(lessonId));
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    submitQuiz(lessonId);
  });
}

async function startQuiz(lessonId) {
  const startButton = document.getElementById("start-quiz");
  const form = document.getElementById("quiz-form");
  const result = document.getElementById("quiz-result");

  try {
    const response = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/quiz`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    const questions = await response.json();

    form.replaceChildren(...questions.map(questionBlock));
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "button";
    submit.textContent = "Check answers";
    form.appendChild(submit);

    startButton.hidden = true;
    result.hidden = true;
    form.hidden = false;
  } catch (error) {
    result.hidden = false;
    result.textContent = `Could not load the quiz: ${error.message}`;
  }
}

// One question: a <fieldset> with a radio button per option.
// All radios of a question share the name "q0", "q1"... so only one can be picked.
function questionBlock(question, index) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "card question";

  const legend = document.createElement("legend");
  legend.textContent = `${index + 1}. ${question.question}`;
  fieldset.appendChild(legend);

  question.options.forEach((option, optionIndex) => {
    const label = document.createElement("label");
    label.className = "option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `q${index}`;
    radio.value = String(optionIndex);
    radio.required = true; // the browser blocks "Check answers" until every question is answered

    label.append(radio, ` ${option}`);
    fieldset.appendChild(label);
  });

  const explanation = document.createElement("p");
  explanation.className = "explanation";
  explanation.hidden = true;
  fieldset.appendChild(explanation);

  return fieldset;
}

async function submitQuiz(lessonId) {
  const form = document.getElementById("quiz-form");
  const result = document.getElementById("quiz-result");
  const fieldsets = [...form.querySelectorAll("fieldset")];

  // Read the chosen option of every question: [1, 0, 2]
  const answers = fieldsets.map((_, index) => Number(form.elements[`q${index}`].value));

  try {
    const response = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    const grade = await response.json();
    showResults(fieldsets, grade);
  } catch (error) {
    result.hidden = false;
    result.textContent = `Could not check the answers: ${error.message}`;
  }
}

function showResults(fieldsets, grade) {
  grade.results.forEach((questionResult, index) => {
    const fieldset = fieldsets[index];
    const labels = fieldset.querySelectorAll("label");

    labels[questionResult.correct_answer].classList.add("right");
    if (!questionResult.correct) {
      labels[questionResult.chosen].classList.add("wrong");
    }
    fieldset.querySelectorAll("input").forEach((radio) => (radio.disabled = true));

    const explanation = fieldset.querySelector(".explanation");
    explanation.textContent = `${questionResult.correct ? "✓ Correct." : "✗ Not quite."} ${questionResult.explanation}`;
    explanation.hidden = false;
  });

  document.querySelector("#quiz-form button[type=submit]").hidden = true;

  const result = document.getElementById("quiz-result");
  const heading = document.createElement("h3");
  heading.textContent = `${grade.score}/${grade.total} correct`;
  const message = document.createElement("p");
  message.textContent = grade.saved
    ? "🌱 Lesson complete! Saved to your progress."
    : `📖 Not yet: you need 2 correct answers. Read the lesson again and retry.`;
  const retry = document.createElement("button");
  retry.className = "button";
  retry.textContent = "Try again";
  retry.addEventListener("click", () => startQuiz(new URLSearchParams(window.location.search).get("id")));

  result.replaceChildren(heading, message, retry);
  result.classList.toggle("passed", grade.passed);
  result.hidden = false;
}
