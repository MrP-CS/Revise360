# Revision 360

A continuous revision mode that draws on the whole GCSE course, for a Year 11 to
use on their own. It is the eleven topics of OCR J277 in one place, and it is a
360° experience rather than a web form: the same room on a laptop, a tablet or a
Quest.

It does not give anybody a predicted grade. That is a deliberate omission and
`tools/tests/smokerevise.py` checks that nothing on the page offers one.

## What a learner does

Open `revise.html`. They land in the Revision 360 room — a 360° scene whose walls
say what the mode does — choose which topics to include and which mode to work
in, and answer questions until they stop. Every question is marked immediately,
with the mark points it was marked against, and every question says which lesson
and which station taught it.

| | |
|---|---|
| questions | 629 across all eleven topics |
| marks available | 1,203 |
| modes | ten — the nine section 4 lists, plus one for improving answers |
| what it reports | marks, out of marks available |
| what it never reports | a grade, a percentage dressed as a grade, or a prediction |

### The modes

Nine of these are the ones section 4 asks for. The tenth, Recover my marks, is
there because sections 22 to 27 ask for a way back into an answer that scored part
marks, and a mode is the obvious place to put it.

| mode | what it is |
|---|---|
| Endless revision | questions until the learner stops — the default |
| 10 questions | a fixed number |
| 20 questions | a fixed number |
| 30 questions | a fixed number |
| Earn 20 marks | a fixed number of marks, which is not the same thing |
| Earn 40 marks | a fixed number of marks |
| Revise my mistakes | the questions answered wrongly before |
| Recover my marks | the written answers that scored part marks, to be improved |
| Focus on my weakest topics | weighted towards the topics with the lowest mark rate |
| Exam practice only | only the exam-style questions |

Endless revision is the default, and nothing makes a learner choose a target
before they start.

A mark target is not a question target. A 40-mark session may be eight questions
or twenty-five, which is the point: the exam is marked in marks.

### Marks, not questions

Everything the mode reports is in marks. A six-mark question that earned four is
four marks, not "one question wrong". Partial credit is the normal case for a
written answer, and `js/revengine.js` records the first attempt separately from
every attempt after it, so improving an answer never rewrites what was first
earned.

### Improve my answer

A written answer that scored part marks can be rewritten. The second attempt is
marked the same way, the extra marks are reported as **marks recovered**, and the
first attempt stays on the record as what it was. A learner can see both.

### Guided self review

Six-mark questions are not auto-marked, and the mode says so. The learner writes
the answer, is shown the mark points one at a time, and decides for each one
whether they made it. The mark is stored as `SELF-REVIEWED`, never as a verified
mark, and the session summary keeps the two apart.

### Revisit the lesson that taught it

Every question carries the lesson and the station it came from, taken from the
course's own records rather than written out by hand — `revision/stations.json`,
built by `tools/revindex.py` from `experiences/`. The link opens that station
inside the lesson, and comes back to the revision session where it left off:

```
experience.html?id=ms-l08&go=main:3&back=revise.html
```

`tools/revcoverage.py` reads that mapping backwards to show what is covered.
Every teaching lesson in the eleven topics has at least one question pointing at
it; `docs/REVISION-QUIZ-COVERAGE.md` has the table, and the outcomes nothing asks
about yet.

## Marking a written answer

Written answers are marked on meaning, not on words. A mark point lists the ways
a learner might express the idea, and `js/revmark.js` decides whether the answer
expresses it:

- synonyms and inflections, so "scrambled" earns a point written as "encrypted";
- negation, so "it does not lose its contents" does not earn a mark for saying it
  does;
- contradiction, so an answer with the comparison the wrong way round is refused;
- spelling tolerance, so a learner who wrote "volatle" is not marked down for it;
- a word-list test, so a string of remembered terms earns one mark for recall
  rather than full marks for an explanation;
- British English, with American spellings folded onto the same forms.

There is no exact string matching anywhere in it. `docs/REVISION-QUIZ-QA.md`
describes how that claim is tested, including the 2,193-probe suite and the 430
of those probes that a word matcher gets wrong.

## Desktop and headset

One engine, two renderers. `js/revengine.js` chooses the questions and
`js/revmark.js` marks them; `js/revise.js` draws the room and the question window
on a page, and `js/revvr.js` draws them in a headset through `js/vr.js`'s panel
kit. Neither renderer marks anything itself, so the two cannot disagree about a
mark.

In a headset there is one question screen in front of the learner and a row of
six controls below it, always in the same place, never overlapping the question.
`tools/tests/smokeviserbounds.py` checks that through the geometry `js/vr.js`
reports rather than through a screenshot.

Nobody is made to write an essay on a virtual keyboard. A one or two-mark written
answer can be typed on the headset keyboard; a four or six-mark one offers three
ways through — answer in VR anyway, answer on paper and mark it against the mark
points, or save it for a desktop, where it appears under My bookmarks.

## What it remembers

Educational progress and nothing else, under `nvr:v1:` in the browser's own
storage:

- which questions have been seen, and what was earned first and since;
- bookmarks, the revisit queue and chosen targets;
- confidence ratings, which are the learner's own judgement before marking;
- the current session.

No names beyond the one already entered to use the course, nothing about a
learner's behaviour, and nothing that leaves the browser.

## Where it lives

| file | what it is |
|---|---|
| `revise.html` | the page |
| `js/revengine.js` | modes, choosing questions, spacing, progress |
| `js/revmark.js` | the marker — the only place marking happens |
| `js/revbank.js` | the manifest and lazy loading, one file per lesson |
| `js/revise.js` | the desktop 360 room and the question window |
| `js/revvr.js` | the headset renderer |
| `revision/` | the built bank: `manifest.json`, `<topic>/<lesson>.json`, `ids.json` |
| `tools/revbank/` | the authored source, one or more modules per topic |

Building and checking it: `docs/REVISION-QUESTION-BANK.md` and
`docs/REVISION-QUIZ-QA.md`.
