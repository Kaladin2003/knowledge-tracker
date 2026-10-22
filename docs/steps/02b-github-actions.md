# Step 2b: Tests on GitHub (continuous integration)

## What we built

Every time I push, GitHub starts a fresh Linux machine, installs the app and runs all the tests. The result shows up:
- in the **Actions** tab of the repository,
- as a green check (or red cross) next to each commit,
- as the **Tests** badge at the top of the README.

The whole setup is one file: `.github/workflows/tests.yml`.

## Key ideas

### CI = continuous integration
"It works on my PC" is not enough. CI checks every change on a clean machine, so a forgotten package in `requirements.txt` or a test that only passes on my computer is caught right away.

### The workflow file
```yaml
on: [push, pull_request]        # WHEN: on every push and pull request
jobs:
  test:
    runs-on: ubuntu-latest       # WHERE: a fresh Linux machine
    strategy:
      matrix:
        python-version: ["3.12", "3.13"]
    steps:                       # WHAT: in order, stop at the first failure
      - uses: actions/checkout@v4          # get the code
      - uses: actions/setup-python@v5      # install Python
      - run: pip install -r requirements-dev.txt
      - run: python -m pytest -v
```
- `uses:` runs a ready-made action from GitHub's marketplace; `run:` runs a shell command.
- **Matrix:** the same job runs once for each Python version, at the same time. If something only breaks on 3.12, I see it.
- **Cache:** `cache: pip` keeps the downloaded packages between runs, so later runs are faster.

### Why the tests can run there
The tests never touch the internet or my real `knowledge.db`: Wikipedia is replaced with fakes (`monkeypatch`), the importer reads a saved sample, and every test gets its own temporary database (`conftest.py`). That is what makes them reliable on any machine.

## Try it
1. Push, then open the **Actions** tab on GitHub and watch the run.
2. Break a test on purpose (for example change an expected number), push, and see the red cross. Then fix it and push again.
