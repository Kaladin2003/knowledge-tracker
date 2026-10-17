# Step 2: Testing the API

## What we built

```text
tests/test_api.py      6 tests for the API and the home page
pytest.ini             tells pytest where the tests are
requirements-dev.txt   app requirements + pytest
.github/workflows/tests.yml   runs the tests on GitHub after every push
```

## Why test?

Every new feature can break an old one without you noticing. A test is a small program that checks one behaviour:
"`GET /api/topics/does-not-exist` must return 404". You run all tests in one second after every change.
If they pass, the old features still work. If one fails, it tells you exactly what broke.

## Key ideas

### pytest
- pytest finds files named `test_*.py` and runs every function named `test_*`.
- Inside a test you write `assert <something true>`. If the condition is false, the test fails and pytest shows the values.
- `pytest -v` (verbose) prints every test name with PASSED or FAILED.

### Arrange, act, assert
Each test has the same 3 parts:

```python
def test_get_one_topic():
    response = client.get("/api/topics/bikes")      # act: call the API
    assert response.status_code == 200             # assert: check the result
    assert response.json()["title"] == "Bikes"
```

(Arrange, the setup, is the `client = TestClient(app)` line at the top, shared by all tests.)

### TestClient
`TestClient(app)` sends requests **directly to the FastAPI app in memory**. No server has to run, and no port is used.
It speaks the same HTTP as a browser, so `client.get("/api/topics")` behaves exactly like `fetch("/api/topics")`.

### What to test
- The **happy path**: the normal case works (`/api/topics/bikes` returns Bikes).
- The **error path**: bad input fails the right way (`/api/topics/does-not-exist` returns 404).
- **Rules about the data**: every topic has the fields the page needs, and ids are unique.

### `pytest.ini` and `pythonpath = .`
The tests do `from backend.main import app`. For that import to work, Python must look for modules in the project root.
`pythonpath = .` adds the project root. `testpaths = tests` tells pytest to look only in `tests/`.

### `requirements-dev.txt`
The app itself does not need pytest, so pytest is not in `backend/requirements.txt`.
`requirements-dev.txt` starts with `-r backend/requirements.txt` (include that file), then adds development tools.

### Continuous Integration (CI) with GitHub Actions
`.github/workflows/tests.yml` tells GitHub: "on every push, start a fresh Linux machine, install Python, install the requirements, run pytest".
- A green check next to a commit on GitHub means all tests passed.
- A red cross means something broke. Click it to see which test failed.
- The badge at the top of the README shows the latest result.

CI catches mistakes even when you forget to run the tests yourself.

## Try it yourself
1. Run `pytest -v`. All 6 tests pass.
2. Break the code on purpose: in `main.py`, change `status_code=404` to `status_code=400`. Run `pytest -v` and read the failure message. Then undo the change.
3. If you added a topic or `/api/stats` in Step 1, write a test for it.
4. After pushing, open the **Actions** tab of the repo on GitHub and watch the tests run.
