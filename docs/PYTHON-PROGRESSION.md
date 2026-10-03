# The Python course is worked in order

Every question in the Python course is compulsory and is taken in the order it
is written. A pupil who is stuck is given more help and told to ask their
teacher; there is no way round an unfinished question, for pupils or for
teachers.

## What counts as finished

Full marks, and nothing else.

| Activity | Finished when |
|---|---|
| Try it | the program runs without an error |
| Predict | the right option is chosen |
| Change it, Complete it, Fix it, Build it | every test passes |
| the final challenge | every item is right |

Partial credit is recorded and shown, because it is an honest record of where a
pupil got to, but it does not finish the activity. A pupil may check as often as
they like and the best attempt is the mark that is kept.

**None of these finishes anything:** opening a hint, walking the whole hint
ladder, reading the worked example, opening the help panel, time spent on the
page, any number of attempts, or reporting a fault in the question.

## Where the rule is applied

One rule, `isComplete()` in `js/player.js`, exported on `core` and used by the
headset as well:

- **the way on** — the Next question button is only built once the activity is
  finished (`nextBtn(k, list, n, done)`); otherwise the pupil is offered *Try
  this one again* and *I need help*
- **within a station** — `taskList()` starts at the first unfinished activity and
  offers every one from there
- **between stations** — `lockedStation()`; a badge the pupil has not reached
  reads *Later* and is dimmed, and tapping it explains and offers *Return to
  your current question*
- **between lessons** — `guardLesson()` runs on load, including on a typed or
  bookmarked URL, and puts up a window with no close cross and no Escape
- **on the topic page** — `js/hub.js` marks later lessons locked and shows
  *Continue where you left off*
- **in the headset** — `js/vr.js` uses the same `core.lockedStation` and
  `core.isComplete`

Earlier finished work stays open for revision, and review mode is unaffected.

## Asking for help

**I need help** is on every Python question from the first attempt. It costs no
marks. It offers a hint, the worked example, or *Keep trying*, and says:

> Not sure what to do next? That is OK. You can use a hint or ask your teacher
> for help. Show them this question and your code. Complete this question before
> moving on.

After three unsuccessful checks on the same question the same panel is offered
once, unprompted, and not again.

There is no teacher messaging in this product, so the panel never claims anyone
has been told. It says to put a hand up or use the school's usual channel.
Reporting a fault in a question does not finish it; a pupil is told to tell
their teacher so it can be looked at.

## What this does not do, and why that matters

**Enforcement is in the browser only.** All of it — the completion record, the
station lock, the lesson lock — is computed from `localStorage` in the pupil's
own browser. It stops a pupil wandering ahead, following an old link or being
sent one. It does not stop a pupil who edits their own storage or calls the
`window.NVR` test hook from the developer console.

Making this real needs the backend to hold progress and refuse a completion or a
prerequisite it has not seen earned. `backend/` has the pieces (progress is
already synced when a pupil is signed in) but no prerequisite check. **Until that
is written, treat the sequence as a strong default rather than a control**, and
do not describe it as enforced in any public claim.

There is deliberately no teacher override. A teacher helps a pupil finish the
work; nothing in the product skips it for them.

## Migrating existing progress

Nothing is erased and nothing is invented. A pupil's stored answers are read as
they stand, and the course resumes at the earliest activity that does not meet
the criterion above. A pupil who had partial credit on an activity under the old
rules will find that activity waiting for them, with their mark intact.

## The tests

`tools/tests/smokegate.py` drives every route: the next button, the station
badges, a typed lesson URL, Escape, a click beside the window, the topic page,
a reload and a second tab. It also checks that the word *Skip* appears nowhere
in the course.
