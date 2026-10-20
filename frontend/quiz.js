// Self-test on the lesson page.
// 1. GET  /api/lessons/{id}/quiz  -> questions and options (no answers)
// 2. user picks one option per question
// 3. POST /api/lessons/{id}/quiz  -> score, correct answers, explanations
// icon, fetchJson and userTimeZone come from common.js.

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
    const questions = await fetchJson(`/api/lessons/${encodeURIComponent(lessonId)}/quiz`);

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "button";
    submit.textContent = "Check answers";
    const actions = document.createElement("div");
    actions.className = "quiz-actions";
    actions.appendChild(submit);

    form.replaceChildren(...questions.map(questionBlock), actions);
    startButton.hidden = true;
    result.hidden = true;
    form.hidden = false;
    form.querySelector("input").focus();
  } catch (error) {
    showResultError(`Could not load the self-test: ${error.message}`);
  }
}

// One question: a <fieldset> with a radio button per option.
// All radios of a question share the name "q0", "q1"... so only one can be picked.
function questionBlock(question, index) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "question";

  const legend = document.createElement("legend");
  const number = document.createElement("span");
  number.className = "q-number";
  number.textContent = `${index + 1}.`;
  legend.append(number, question.question);
  fieldset.appendChild(legend);

  question.options.forEach((option, optionIndex) => {
    const label = document.createElement("label");
    label.className = "option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `q${index}`;
    radio.value = String(optionIndex);
    radio.required = true; // the browser blocks "Check answers" until every question is answered

    const text = document.createElement("span");
    text.textContent = option;

    label.append(radio, text);
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
    showResults(fieldsets, grade, lessonId);
  } catch (error) {
    showResultError(`Could not check the answers: ${error.message}`);
  }
}

function showResults(fieldsets, grade, lessonId) {
  grade.results.forEach((questionResult, index) => {
    const fieldset = fieldsets[index];
    const labels = fieldset.querySelectorAll("label");

    labels[questionResult.correct_answer].classList.add("right");
    labels[questionResult.correct_answer].appendChild(icon("check", "Correct answer"));
    if (!questionResult.correct) {
      labels[questionResult.chosen].classList.add("wrong");
      labels[questionResult.chosen].appendChild(icon("cross", "Your answer"));
    }
    fieldset.querySelectorAll("input").forEach((radio) => (radio.disabled = true));

    const explanation = fieldset.querySelector(".explanation");
    const verdict = document.createElement("strong");
    verdict.textContent = questionResult.correct ? "Correct. " : "Not quite. ";
    explanation.replaceChildren(verdict, questionResult.explanation);
    explanation.hidden = false;
  });

  document.querySelector("#quiz-form .quiz-actions").hidden = true;

  const score = document.createElement("p");
  score.className = "result-score";
  score.textContent = `${grade.score}/${grade.total}`;

  const message = document.createElement("p");
  message.className = "result-message";
  message.textContent = grade.saved
    ? "Learned. A new tree is planted in your garden."
    : "Not yet: you need 2 correct answers. Read the entry again and retry.";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = grade.passed ? "button secondary" : "button";
  retry.textContent = "Take it again";
  retry.addEventListener("click", () => startQuiz(lessonId));

  const result = document.getElementById("quiz-result");
  const actions = [retry];
  if (grade.saved) {
    const garden = document.createElement("a");
    garden.className = "button";
    garden.href = "/";
    garden.append("See your garden", icon("arrowRight"));
    actions.unshift(garden);
  }
  const buttons = document.createElement("div");
  buttons.className = "result-actions";
  buttons.append(...actions);

  result.replaceChildren(score, message, buttons);
  result.classList.toggle("passed", grade.passed);
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });

  if (grade.saved) {
    showStreakAfterPass(message);
    loadTopbarStats(); // common.js: refresh the streak and entries in the top bar
  }
}

function showResultError(text) {
  const result = document.getElementById("quiz-result");
  const message = document.createElement("p");
  message.className = "message-error";
  message.textContent = text;
  result.classList.remove("passed");
  result.replaceChildren(message);
  result.hidden = false;
}

// After a pass, add the streak under the result message
async function showStreakAfterPass(message) {
  try {
    const streak = await fetchJson(`/api/streak?tz=${encodeURIComponent(userTimeZone())}`);
    const line = document.createElement("span");
    line.className = "muted";
    line.textContent = streak.current === 1 ? "Day 1 of your streak." : `${streak.current} days in a row.`;
    message.appendChild(line);
  } catch {
    // Not important enough to show an error
  }
}
