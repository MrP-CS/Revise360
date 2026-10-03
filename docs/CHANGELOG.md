# Checkpoint — October 2026

Baseline `2cac7e4`. Seven commits, 345 files, +13,498 / −1,638 lines.

## Counts, before and after

| | before | after |
|---|---|---|
| units | 12 | 12 |
| lessons | 115 | 115 |
| activities | 1,819 | 1,819 |
| lesson PowerPoints | 98 | 98 |
| worksheets | 110 (.docx) | 110 (.docx) + 110 print-ready .pdf |
| **lesson plans** | 0 | **115** |
| **unit teacher documents** | 0 | **37** (3 per unit + the course map) |
| **unit download packs** | 0 | **24** (2 per unit) |
| **canonical lesson records** | 0 | **115**, + 115 teacher-only records |
| **prescribed values marked in Python tasks** | 0 | **1,148** across 325 of 614 questions |
| copies of the Python token table | 3 | 1 |
| copies of the activity-marks rule | 3 | 2 (Python and JavaScript, checked against each other) |
| checks in the suite | 9 | 16 |

## What changed

**The Python course now has to be worked through.** The skip buttons are gone and
every activity counts towards its station again. A question that is not right
offers "Try this one again" and "I need help"; the help panel says to ask the
teacher and that the question still has to be completed, and claims nobody has
been notified. Later stations and lessons show "Not yet" with a link back to the
question the pupil is on — from the next button, the station badges, the topic
page and a typed address — and the locked window has no close cross and ignores
Escape and a click beside it. `ef35f47`

**A task's prescribed data is shown in the editor's own colours.** 1,148 values
across 325 questions. The marking was derived from the model solutions, starters,
tests and `CREATE TABLE` lines — never from reading the prose — so "Display
**both** when both are above 0" boxes the first "both" and leaves the second
alone. One lexer (`js/pytok.js`) and one colour table (`css/pytok.css`) now serve
the editor, the worked examples, the instructions, the hint ladder, the syntax
reference, the headset, the Exam Reference Language boards, the worksheets and the
slides. `4e5e89c`

**Every lesson has a canonical record**, and every outcome is traced through the
station that teaches it, the activities that practise it and the exam question
that assesses it. `bd62690`

**Every lesson has a plan**, built from those records, with an explicit
lesson-ID-to-plan index. `166c08b`

**Every unit has two downloads** — resources and teacher guide — plus a pedagogy
PDF, a big picture with a coverage matrix, a delivery guide and a course-wide map.
On the teacher dashboard, with sizes and single-document links. `89881b1`

**What is published is audited**, and what is not protected is said plainly, on
the page and in the docs. `7f3791b`

**The homepage gives Python a section of its own**, and four false public claims
were corrected. `a8e3399`

## What it found, and what was fixed

| found | fixed |
|---|---|
| two learning outcomes belonged to another course — a clock-speed lesson listed "begin learning how to program" | replaced with what each lesson's own confidence checklist names; worksheet and deck rebuilt |
| three copies of the activity-marks rule; the JavaScript gave an `arena` activity nothing and the Python crashed on it | one Python rule, and a test that runs both languages over all 1,819 activities |
| `js/algo.js` held a second copy of the whole token table | it reads the one table |
| the worksheet printed the authors' markup in its exam section | routed through the renderer |
| four false claims on the public pages | corrected, with a checker that fails if one returns |
| two stale "coming soon" notices | removed; all eleven specification topics are present |
| three answer files in the repository's git history | **not fixed — see below** |

## Verified

All sixteen checks pass. `docs/RESOURCE-QA.md` has the commands and the recorded
results. Every check was validated by breaking the thing it watches first; three
of them were wrong the first time and only the injected fault showed it.

Four pilot lessons were built and read at page size before anything was scaled:
`sa-l01` (theory), `ms-l07` (procedural), `pr-l01` (early Python) and
`sa-l05-test` (assessment). Each caught a wrong assumption — the test-lesson plan
was telling teachers to print login cards for a paper test. Unit 1.1 was the pilot
pack, and its exclusion rules were tested by smuggling a scene JSON, a renamed
panorama, the player script, a panorama inside a slide deck and a `../` path
escape into it. All five were caught.

## Open, and whose decision it is

**Yours:**

- **Three answer files remain in the git history** — `TeachingAnswers.md` and two
  2.1 mark schemes. Removing them needs a history rewrite and a force push, which
  changes every commit id and breaks every clone. `docs/EXPERIENCE-PROTECTION.md`
  has the command and the consequence.
- **The specification mapping is topic-level only.** The qualification, both
  components and OCR's own wording were verified on 3 October 2026; the
  specification document itself could not be retrieved, so no sub-point number is
  claimed anywhere. Check it before using the Big Picture for a scheme of work.

**Needs a backend, and is a publication blocker until it exists:**

- The Python question order is enforced in the browser only
  (`docs/PYTHON-PROGRESSION.md`).
- Teacher downloads are private, not protected: a client-side gate is not access
  control (`docs/EXPERIENCE-PROTECTION.md`).
- Progress is stored on the device a pupil used. Every lesson plan and unit guide
  says so, and so does the dashboard.

**Content work the records surfaced:**

- 57 lessons practise nothing independently — the theory experiences are almost
  entirely multiple-choice. This is the largest pedagogical gap in the library and
  the clearest difference between the Python course and the other eleven units.
- 85 lessons have no optional challenge activity.
- 17 outcomes are not assessed anywhere in their own unit; 10 match no station's
  text; 9 cannot be traced at all.
- 26 lesson plans say something is missing from the lesson record — 37 real gaps
  in authored content, now visible on the page rather than hidden.
- A third of the library's teaching text exists only as pixels in the rendered 360
  images. `tools/reconstruct.py` recovers what the worksheets still hold; the wall
  bullets it cannot.
- 63 of the 98 decks have no answers slide. The public pages no longer claim
  otherwise, but a teacher opening one of those decks still has no answers in it.

## Not done

- Pedagogical rework of the 57 multiple-choice-only lessons.
- Answer slides or teacher notes carrying answers for the 63 decks without them.
- Any backend work.
- Listening to the read-aloud voice: it is checked for presence, wiring and the
  text it is given, but nobody has heard it in this environment.

---

# Checkpoint — the headset, October 2026

Baseline `734f845`. Seven commits.

The owner tested the Python course on a Quest and reported two things: the course
looked substantially different in there, and the Python runtime never became
usable. Both were real.

## What was measured first

`docs/VR-PARITY.md` has the before-table. The same activity was opened twice —
on the page and inside an immersive session — and what each renderer actually
put in front of a pupil was recorded. Thirteen of twenty-six rows were missing
in the headset.

**The one that stopped the course:** a Python question in there had no way on.
`openCodeVR` was handed the question list and the position in it and used them
only to record the mark. Close was the only button. A Python station could not
be worked through in a headset at all.

## What changed

| | before | after |
|---|---|---|
| copies of the Python activity model | 2 (`player.js`, `vr.js`) | 1 (`js/pyactivity.js`) |
| copies of the brand palette | 2 | 1 (`:root`, read at draw time) |
| rows of the parity table missing in the headset | 13 | 0 |
| characters the course needs that could not be typed in there | 4 | 0 |
| ways on from a finished Python question in there | 0 | 1, under the screen's rule |
| checks in the suite | 16 | 21 |

**One activity model.** The stage and its wording, the steps, the worked
example, the one real run, the hint ladder, the forbid and require rule, the
best-mark rule, the escalating line between attempts, the words of the
teacher-help panel: one definition, read by both. `f133441`

**The headset's workspace rebuilt on it**, as panels placed where a pupil can
turn to them rather than as the web page on a billboard. `f133441`

**A runtime that cannot fail silently.** `ready()` had no timeout, said nothing
while twelve megabytes downloaded, cached a failure as a success, and the
headset never listened to the one event that says it fell over. All four fixed,
and Python now starts loading while a pupil is reading the first wall — never
awaited, so it cannot spend the gesture a WebXR session has to start on.
`f133441`

**A failure a teacher can act on**, with a code that carries no name, no
program, no path and no traceback. `pydiag.html` walks the whole chain on the
device in front of you. `3d2c500`

**A program that is never lost.** Kept as it is typed, in the progress the
experience already saves, against the version of the question it was written
for. Type in a headset, take it off, open a computer: it is there. `4db3cc5`

## What it found

| found | fixed |
|---|---|
| a Python question in the headset had no way on | the screen's rule, same wording |
| prescribed data was painted with the authors' backticks still in it | boxed, monospace, in its token colour |
| four characters the course needs could not be typed — `?` in 63 `input()` prompts from lesson 1 | a seventh row of keys, and a check that reads the whole course |
| `js/vr.js` held a second copy of the brand palette | it reads `:root` |
| a traceback was cut to four lines of ninety characters | wrapped whole |
| "I need help" did not exist in the headset | the same panel, the same words |
| the menu button sat on top of the keys, covering Tab, the arrows and Check | it drops out of the way |
| a WebXR emulator reports itself as a Quest 3 | detected and labelled, on the page and in the code |

## Verified

All 21 checks pass. Five are new and each was validated by breaking the thing it
watches: the runtime blocked at the network, three ways of breaking the draft
store, three ways of breaking parity, a key taken off the keyboard, and three
ways of making the workspace uncomfortable. Two of the new checks were wrong the
first time and only the injected fault showed it.

620 Python activities were compared on both interfaces. 620 agreed.

## Still open, and only a headset can close it

- **The actual Quest error has not been recorded.** No headset is reachable from
  this machine, and nothing in the suite is evidence about one.
  `docs/VR-HEADSET-QA.md` is the sheet; `pydiag.html` is the instrument.
- **How `revise360.co.uk` serves `vendor/pyodide/`** — MIME types, compression,
  cache headers — is unverified from here.
- **Whether a paired Bluetooth keyboard reaches an immersive page** in Oculus
  Browser. The code takes the events if they arrive; nothing claims they do.
- **Quest memory and texture limits** under a 360 panorama plus Pyodide.

---

# Correction — the headset, October 2026

The first attempt at the headset's Python course broke the interface into five
floating panels at different depths: the task above, the worked example and the
marking to one side, the program ahead, the controls on the keyboard. It carried
the same information as the page and it was the wrong design. It read as a VR
utility rather than as Revise 360.

It is now **one screen**: the normal Revise 360 Python window, as a large
virtual monitor in the 360 room, with the VR keyboard directly underneath it.

| | the five panels | one screen |
|---|---|---|
| surfaces a pupil looks at | 5 | 2 |
| where the layout comes from | judgement | `measurescreen.py`, the page's own boxes |
| where Run, Check, Hint, Help live | on the keyboard | on the screen, where the page puts them |
| the hint and the help | panels of their own | panes over the window, as on the page |
| the 360 room | visible | visible, dimmed only where the screen covers it |

`js/pyscreen.js` draws the interface from the measured layout — 1397 × 864, the
same two columns in the same proportions, the same boxes in the same order, the
same buttons in the same places, the colours read from `:root` at draw time.

`tools/tests/sidebyside.py` captures the page and the headset's screen for
lessons 1, 3, 6, 10 and 13 and stacks them, which is how the brief's question —
*does this obviously look like the same interface?* — gets answered by looking.
Reading those captures found three faults nothing else had: a run example that
drew six input lines out of its box and over the heading below, an editor that
opened scrolled to the end of the program rather than where the work is, and an
unavailable *Try this one again* drawn on top of *I need help* so that a press
reached the wrong one.

Everything from the previous checkpoint is kept: the shared activity model, the
runtime that cannot fail silently, the diagnostic code, the shared drafts, the
keyboard that carries every character the course needs, and the rule that a
Python question cannot be skipped.
