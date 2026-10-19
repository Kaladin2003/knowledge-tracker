# Step 8: The daily streak

## What we built

The home page shows **🔥 3 day streak · best 5**, plus "✓ You learned something today" or "Finish a lesson today to keep your streak". After passing a quiz, the result says "🔥 3 day streak!".

**Rule:** a day counts when you pass at least one quiz that day (a retake counts too). Missing a whole day resets the streak.

```text
POST /api/lessons/{id}/quiz  (passed)
  record_completion(...)   -> completions   (which lessons are finished)
  record_pass(...)         -> quiz_passes   (a log: one row per pass, with the UTC time)

GET /api/streak?tz=Europe/Athens
  get_streak(): read all passed_at times
                -> convert each to a calendar day in Europe/Athens
                -> calculate_streak(days, today)
  <- {"current": 3, "best": 5, "learned_today": true, "today": "2026-10-19"}
```

## Key ideas

### Store events, calculate results
We do **not** store "streak = 3" in the database. We store **what happened** (each passed quiz, with its time) in `quiz_passes`, and **calculate** the streak when asked.
- No stored number can get out of date or wrong.
- If the rules change (for example a "streak freeze"), old data still works: only the calculation changes.
- Each lesson stays in `completions` once, but `quiz_passes` gets a row for every pass. A retake on a new day keeps your streak.

### The rule, step by step
1. Turn every pass into a **calendar day** in the user's time zone. Several passes on one day become one day (a `set`).
2. If **today** is in the set, count backwards from today.
3. Else, if **yesterday** is in the set, count backwards from yesterday. The streak is still alive: you have the rest of today.
4. Otherwise the streak is **0**.
5. **Best** = the longest run of consecutive days ever (`longest_run`).

### Pure functions are easy to test
`calculate_streak(days, today)` takes dates and returns a dict. It does not read the database or the clock. That is why `test_streak.py` can test 10+ cases in milliseconds, with exact dates like "Oct 31 to Nov 1".
`get_streak()` is the thin layer that reads the database and the clock, then calls the pure function. **Keep logic pure, keep I/O thin.**

### Time zones: whose "today"?
The server stores times in **UTC**. But a day starts at midnight **for the user**.
A quiz passed at 22:30 UTC on Oct 19 was passed at **01:30 on Oct 20** in Athens (UTC+3). Without the time zone, a late-evening learner in Athens could lose their streak.
- The browser knows the user's zone: `Intl.DateTimeFormat().resolvedOptions().timeZone` returns `"Europe/Athens"`.
- It sends it as a **query parameter**: `/api/streak?tz=Europe/Athens`.
- Python's `zoneinfo.ZoneInfo("Europe/Athens")` knows the rules, including summer time. `moment.astimezone(zone).date()` gives the local day.
- An unknown zone name returns **400 Bad Request**.

### `tzdata` on Windows
`zoneinfo` reads time zone rules from the operating system. Linux and macOS have them; **Windows does not**. The `tzdata` package (added to `requirements.txt`) supplies them. Without it, `ZoneInfo("Europe/Athens")` fails on Windows.

### Faking the clock in tests
"Today" changes every day, so a test using the real clock could pass today and fail tomorrow.
The code asks `streak.utc_now()` for the time. Tests replace that function:
```python
monkeypatch.setattr(streak, "utc_now", lambda: datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc))
```
Now the test controls time: "pass a quiz on Oct 17, then look at the streak on Oct 19".
`check_quiz` uses the **same** `now` for the completion and the pass, so both rows agree.

### Query parameters vs path parameters
- **Path** parameter: part of *which* thing you want: `/api/lessons/{lesson_id}`.
- **Query** parameter: an *option* for the request: `/api/streak?tz=Europe/Athens`.
In FastAPI, a function argument that is not in the path (`tz: str = "UTC"`) becomes a query parameter. The `= "UTC"` makes it optional.

## Note
Your existing passes from Step 7 are in `completions` but not in the new `quiz_passes` log, so your streak starts at 0 after this update. Pass a quiz today to start it.

## Tests added (68 in total)
- `calculate_streak`: no activity, today only, 3 days, alive since yesterday, broken by a missed day, latest run vs best run, month boundary, `longest_run` cases.
- Time zones: the same UTC moment is a different day in UTC and Athens; unknown zone raises.
- API with a fake clock: 3 days in a row, 2 passes on one day count once, a failed quiz does not count, a missed day breaks the streak, the time zone changes "today", bad zone returns 400, reset clears the streak.

## Try it yourself
1. Pass a quiz and watch the home page streak card change.
2. Open http://localhost:8000/api/streak?tz=America/New_York and then `?tz=Asia/Tokyo`. Is "today" the same?
3. In DB Browser, insert a fake pass for yesterday into `quiz_passes` (`passed_at` like `2026-10-18T10:00:00+00:00`). Reload: did the streak grow?
4. Write a test: passes on Oct 1, 2, 3 and Oct 10, 11. On Oct 11, what are `current` and `best`?
5. Idea for later: a **streak freeze** (one missed day per week is forgiven). Where would you change the code? (Hint: only `calculate_streak`.)
