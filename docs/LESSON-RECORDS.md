# The canonical lesson record

Everything about a lesson was already somewhere: the spec module that renders its
room, the bank its questions come from, the worksheet, the deck, the answer key.
Four sources, no single place to look, and nothing to stop one of them drifting
from another — which is how a Systems Architecture lesson came to list "begin
learning how to program" as a learning outcome, printed on a worksheet, for who
knows how long.

`tools/record.py` gathers what exists into one record per lesson. It invents no
content. What it adds is a place to look and a check that the pieces line up.

```
python3 tools/record.py                 # build everything
python3 tools/record.py --check         # build nothing, print the findings
python3 tools/record.py pr-l01 sa-l01   # just these
```

## What it writes

| path | what it is | committed |
|---|---|---|
| `build/records/<id>.json` | one lesson: outcomes, stations, activities, the exact references, what is student-facing | no — regenerate it |
| `answers/records/<id>.json` | the teacher half: model solutions, success criteria, how each activity is marked | **never** — `answers/` is gitignored and this repository is public |
| `build/coverage.json` | every outcome traced through teaching, practice and assessment, with the words each match was made on | no |
| `docs/COVERAGE.md` | the same matrix, to read and review | yes |

115 records, 270 learning outcomes, 1,819 activities.

## What a record holds

A stable id for the lesson, every station and every activity; a content version
(a hash of the authored content only, so moving a panel on a wall does not
change it); the prerequisite lessons; the outcomes as the lesson states them; the
vocabulary; the key question; the starter; per station the explanation, the
challenge, the key-fact prompt, the activities with their prescribed data and
worked examples, the misconceptions and the diagnostic checks; the assessment
items; the confidence review; and the exact path to the scene, the image, the
deck, the worksheet, the code bank and the lesson plan.

Activity ids are positional — `pr-l01-s1-a2` is station 1, activity 2 — because
that is also how stored progress is keyed. An id that disagreed with the store
would be worse than no id: a teacher would read a pupil's score against the wrong
task. When an activity changes substantially the lesson's `version` changes, and
an old score should not be read as evidence for the new task.

## Three honest limits

Each is stated in the record rather than hidden.

**A third of the library's teaching text is only pixels.** A lesson's wall panels
are painted into the 360 image at render time. For the 79 lessons with a spec
module the bullets are in the module too; for the rest they exist only in the
picture, and the record says so against each station rather than showing the
lesson as having no explanation. `tools/reconstruct.py` reads back what the
worksheet still holds — objectives, key terms, the challenges, the exam practice
— and the record uses it. The bullets it cannot recover.

**The outcome-to-station trace is derived, not authored.** An outcome is matched
to a station or an exam question by the content words they share: two in common,
or one that is distinctive across the whole course, or one where either side is
only a few words long. A word in capitals is always kept, because AND, OR, NOT,
LAN, WAN, CPU and RAM are the content of this subject and an English stopword
list throws them away. Every match carries the words it was made on. Read them
before relying on a row. The matrix exists to show a teacher where to look, not
to certify that the alignment is right — and a row with no gap has not been
checked by a human either.

**A diagnostic's teaching response is whatever the author wrote.** Where a
question offers four wrong options and one note covers all of them, the record
says exactly that:

> one response covers every wrong option; it does not say what to revisit for
> each one

It does not manufacture a per-distractor response. The gap is visible instead.

## Assessment is traced across the unit, not the lesson

A lesson has three or four outcomes and three exam questions, so some of its
outcomes are meant to be assessed by the end-of-unit test rather than on its own
worksheet. Tracing within the lesson reported 117 outcomes as unassessed; tracing
across the unit reports 17, and those are worth looking at.

An end-of-topic test lesson has no outcomes of its own, which is correct for what
it is, and the record says so rather than flagging it as empty. Its assessment
items come from the topic list on its reflection sheet — the authored record of
what the paper test covers. An outcome about the pupil's own progress ("know
which lessons I am secure on") is marked housekeeping and is not expected to have
a station or an exam question.

## What it found

Three defects were fixed as a result, and one near-miss is worth recording.

1. **Two learning outcomes belonged to another course.** `sa-l03` Speed lab, a
   lesson about clock speed, cache and cores, listed "begin learning how to
   program". `sa-l04` Smart home listed "understand how to program". Neither is
   taught or assessed anywhere in 1.1. Both were replaced with the outcome the
   lesson's own confidence checklist already names, and the worksheet and deck
   were rebuilt.

2. **Three copies of the marks rule, two of them wrong.** What an activity is
   worth was decided in `js/store.js`, in `tools/kit.py` and again in
   `tools/buildws.py`. The JavaScript gave an `arena` activity nothing; the Python
   fell through and crashed on it. `kit.task_marks` is now the one Python rule,
   `buildws.py` imports it, and `tools/tests/smokemarks.py` runs both the Python
   and the JavaScript over all 1,819 activities and fails on any disagreement. It
   was validated by changing one rule and confirming the test said so.

3. **The worksheet printed the authors' markup.** Adding marked data to the exam
   questions put raw backticks into the printed sheet, because the exam section
   of `wsgen.js` did not go through the token renderer. Caught by diffing a
   rebuilt worksheet against the live one.

4. **`sa-l02` was a false positive.** "understand what a keyword is" looked like
   more boilerplate on a Von Neumann lesson, and it is not: station 6 is called
   Keywords and teaches exactly that. The trace missed it on a one-word overlap,
   which is what led to the distinctive-word rule. Worth stating because the next
   row that looks obvious may be the same.

## Findings still open

From `docs/COVERAGE.md`, across 115 lessons:

| finding | lessons |
|---|---|
| every activity is guided; nothing is practised independently | 57 |
| no optional challenge activity | 85 |
| an outcome nothing in its unit assesses | 17 |
| an outcome no station's text matches | 10 |
| an outcome that cannot be traced, because the station text is only in the image | 9 |
| an exam question matching no outcome stated anywhere in its unit | 57 |

The first two are the substantial ones. The theory experiences are almost
entirely multiple-choice: a pupil chooses between options at every station and
never produces anything of their own. That is a pedagogy finding, not a bug, and
it is the gap between what the Python course now does — run, predict, change,
complete, fix, build — and what the other eleven units do.
