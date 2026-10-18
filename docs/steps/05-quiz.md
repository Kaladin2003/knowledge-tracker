# Step 5: The quiz

## What we built

Under each lesson there is now a 3-question quiz. 2 correct answers pass the lesson.

```text
Browser                                   Backend
-------                                   -------
click "Start quiz"
  GET  /api/lessons/bikes-frame/quiz  -->  questions + options (NO answers)
user picks one option per question
click "Check answers"
  POST /api/lessons/bikes-frame/quiz  -->  check_quiz(): compare with QUIZZES
       body: {"answers": [1, 1, 2]}
                                     <--  {"score": 2, "total": 3, "passed": true,
                                           "results": [{correct, correct_answer, explanation}, ...]}
color answers green/red, show explanations and score
```

## Key ideas

### Never trust the browser: grade on the server
If the API sent the answers with the questions, anyone could open the dev tools (F12, Network tab) and read them.
So `GET` returns only `question` and `options`. The answers stay in `backend/quizzes.py`, and the server does the grading.
Rule: **the browser shows things, the server decides things.** This matters even more later, when passing a quiz grows your streak.

### GET vs POST
- **GET** reads data. It has no body, and repeating it changes nothing.
- **POST** sends data to the server in the request **body**. Here the body is the user's answers.
Same URL, different method, different function: `@app.get(...)` vs `@app.post(...)`.

### Request body and Pydantic
```python
class QuizAnswers(BaseModel):
    answers: list[int]

@app.post("/api/lessons/{lesson_id}/quiz")
def check_quiz(lesson_id: str, submission: QuizAnswers):
```
FastAPI reads the JSON body and builds a `QuizAnswers` object. **Pydantic** checks the types:
`{"answers": [1, 0, 2]}` is accepted, `{"answers": "abc"}` gets an automatic **422 Unprocessable Entity** with a description of the problem.
You get input validation for free, just by declaring the shape.

### 400 vs 422
- **422:** the body has the wrong **shape or types** (Pydantic catches it).
- **400 Bad Request:** the shape is right but the **content** makes no sense for this quiz (2 answers for 3 questions). We check that ourselves.

### Sending JSON from JavaScript
```js
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ answers }),
});
```
`JSON.stringify` turns the object into text. The `Content-Type` header tells FastAPI the body is JSON.

### HTML forms: radio buttons
- Radio buttons with the same `name` (`q0`) form a group: only one can be picked.
- `required` on the radios makes the browser refuse "Check answers" until every question is answered. Validation in the browser is only for convenience; the server checks again.
- `event.preventDefault()` stops the form's default behaviour (reloading the page), so our JavaScript can send the request instead.
- `form.elements["q0"].value` reads the picked option of question 0.

### Splitting JavaScript files
`quiz.js` holds the quiz code and `lesson.js` the lesson code. `lesson.js` calls `setUpQuiz()`, which is defined in `quiz.js`, so `quiz.js` must be loaded **first** in `lesson.html`. Scripts run in the order they appear.

### Data in its own module
The questions live in `backend/quizzes.py`, not in `main.py`. `main.py` stays about routes; data files can grow without making it hard to read. Step 6 moves both into a database.

### Tests added (33 in total)
- `GET` never includes the answers.
- 3/3 and 2/3 pass, 1/3 fails.
- Wrong number of answers: 400. Wrong type: 422. Unknown lesson: 404.
- Every lesson has exactly 3 questions, each `answer` points to a real option, and no option appears twice.

## Limits of this step
- The questions are written by hand and may cover more than the Wikipedia intro shows. "Read the full article" helps. Later, an LLM can write questions from the exact Wikipedia text.
- Passing is not saved yet. Reload the page and it is forgotten. Step 7 saves progress.

## Try it yourself
1. Answer the quiz, then open the dev tools Network tab. Find the POST request and look at its **Payload** (what you sent) and **Response** (the grade).
2. Open http://localhost:8000/docs, find `POST /api/lessons/{lesson_id}/quiz`, click **Try it out**, and send `{"answers": "abc"}`. Read the 422 error.
3. Change `PASS_SCORE` to 3 in `main.py`. Which test fails? Why? Change it back.
4. Write a fourth question for one lesson. Which test fails, and what does that tell you?
