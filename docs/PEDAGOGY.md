# The teaching model, and where it shows up

Every unit has its own pedagogy PDF built from its own lessons. This is the model
underneath all of them, and what it looks like in a classroom.

## The sequence

**Retrieve → Explain → Model → Practise → Check → Apply → Review**

Used flexibly. A lesson may run a short explain-model-practise cycle twice. What
is not flexible is that checking happens before, during and after practice rather
than only at the end.

| phase | where a pupil meets it | where a teacher sees it |
|---|---|---|
| **Retrieve** | the starter on the worksheet, about the lesson before | written on paper, corrected before anything else starts |
| **Explain** | the slides at the front, and the same words on the station walls | questions asked while you teach it |
| **Model** | the worked example on a station's early activities | whether a pupil can say *why* the line is there, not just copy it |
| **Practise** | run it, predict it, change one thing, fill the gap, fix the error | the station badges filling in; the editor showing their own program |
| **Check** | the hinge question, hands down | the split across the options, before any reteach |
| **Apply** | the last activity on each station, and the worksheet's exam practice | work produced without the example in front of them |
| **Review** | the exit question; review mode next lesson | one written sentence, not a show of hands |

## What each phase actually is here

**Retrieve.** Every worksheet opens with a starter about the previous lesson,
answered on paper before a device is opened. A first lesson uses a labelled
baseline check instead, because pretending to retrieve something never taught is
worse than admitting it. Later, review mode reopens exactly the questions a pupil
got wrong — not the lesson again.

**Explain.** One new idea per station, with the vocabulary introduced at the point
it is needed. The slides and the walls carry the same explanation on purpose: you
teach the first two or three stations from the front, and the walls are there so a
pupil can re-read what you said, not so you say it twice.

**Model.** The worked example sits on a station's early activities and not on its
late ones. It uses different data from the task deliberately, so copying it does
not finish the task. The lesson plan tells you which decisions to say out loud —
why that name, why that order, what you would try first if it failed — because the
finished answer is the least useful part of a demonstration.

**Practise, with the support coming away.** In the Python course this is explicit
and the same on every station:

> **Learn → See → Predict → Change → Complete → Fix → Build → Apply**

Run a working program. Say what the next one will display before running it —
which is where a misreading surfaces while it is still cheap. Change one thing.
Fill a gap. Find a real error with a real traceback. Then write one from nothing.
In the theory units the same fade happens between the guided stations and the
exam practice on the worksheet.

**Check.** Every multiple-choice and Predict activity offers wrong answers that
are real misconceptions, not filler. Each lesson plan nominates one as the hinge
question, with its wrong options listed, so you can take the split hands-down
before anyone starts independent work. If more than a few of the class are on one
wrong option, that option is what to teach against — go back to its station and
work the example again, aloud.

**Apply.** The hardest activity on each station comes last and is not optional.
The exam practice on the worksheet is answered away from the screen, from memory.

**Review.** One written sentence answering the lesson's big question. The
confidence columns supplement that; they do not replace it. A pupil who rates
themselves confident and cannot answer the exit question has told you nothing.

## Spacing and mixing

The order of lessons *is* the retrieval schedule: each starter asks about the one
before. The end-of-unit tests are placed so the reflection sheet still has lessons
left to send a pupil back to. Review mode is the spaced return — it reopens a
pupil's own wrong answers weeks later, which is a different thing from re-reading
the topic.

Mixing is used where it earns its place, not as a label on every starter: the
revision lessons draw across the unit, and the Python course's later lessons
require techniques from the earlier ones in the same program.

## In the classroom

**A full lesson.** Starter on paper and corrected (8 minutes). Teach the first two
stations and model the example (10). Settle, sign in, and say what to write before
anyone taps (3). The stations in order, you circulating and reading over
shoulders (22). Hinge question, hands down (5). Exam practice in silence (8). Exit
question (4).

**Homework.** The question they stopped at, on the website. Where a class has no
devices at home, the exam practice on the worksheet instead.

**Intervention.** Open the pupil's score screen: it breaks down by station, not
into one number. Reteach that station's example, then set the same station in
review mode.

**A shorter lesson.** Protect the starter, the explanation and the model —
shortening those is what makes the online work fail. Take the time out of the
online block. A pupil stops where they are; progress saves after every answer and
reopens at their earliest unfinished question.

## Where support is, and how it comes away

- The worked example fades across a station, by design.
- The hint is a ladder climbed a rung at a time: name the idea, show the shape,
  show how it starts, animate the technique. The top rung is still the technique
  on different data, never the answer.
- "I need help" says to ask the teacher, and says the question still has to be
  completed. It notifies nobody and unlocks nothing.
- Read aloud is on every task, and reads prescribed values as values.
- Prescribed data is boxed and monospace as well as coloured.
- Pace is not fixed: a pupil may finish a station next lesson.
- A headset is never required — and a pupil who uses one gets the same support,
  not less: the same worked example, the same hint ladder, the same read-aloud,
  the same syntax reference, the same "I need help". They can start a program on
  a computer, finish it in a headset and come back, and find their own work.

## What the Python course does differently, and why

A pupil works through its questions **in order and completes every one**. Each
teaches what the next needs: a pupil who skips Predict arrives at Build without
having found out they read the program wrongly. When they are stuck they get the
hint ladder, then they ask you. A shorter lesson, homework or a slow worker does
not authorise skipping, and there is no teacher bypass.

This costs time and is the right thing to spend it on. What it buys is that a
pupil who reaches lesson 13 has written every program between here and there.

## What is known, and what is not

The structure above is ordinary evidence-informed practice, not something this
product invented. Useful starting points, none of them about Revise 360:

- Rosenshine, *Principles of Instruction* (American Educator, 2012)
- Sweller, van Merriënboer and Paas on cognitive load and the worked-example effect
- Dunlosky et al., *Improving Students' Learning With Effective Learning
  Techniques* (2013)
- Wiliam, *Embedded Formative Assessment*

**No trial of Revise 360 has been run.** Nothing here is evidence that this
product improves outcomes, and immersion is not claimed to improve learning by
itself. What the 360° format does is make the structure of a topic physical and
keep attention on one part at a time; the teaching is in the explanation, the
example and the practice, as it would be anywhere else.

## Where the model is not yet honoured

`docs/COVERAGE.md` records this against every lesson, and the numbers below come
from the most recent run of `tools/record.py`, not from a previous count.

**Every teaching lesson now practises something independently.** The figure was
8 of 98 before October 2026 and is 0; the eight were `ns-l09`, `nw-l02`,
`nw-l12`, `nw-l14`, `pf-l02`, `pf-l04`, `pl-l04` and `rp-l06`, and each gained
exactly one activity, chosen for what that lesson was actually missing rather
than to fill a slot. Read the list in `docs/CHANGELOG.md` before assuming any of
them is now rich: one activity is a floor, not a standard.

**34 lessons still have exactly one activity that asks for an answer rather than
a choice**, which is thin rather than absent, and includes every lesson in the
paragraph above. The independent work in those lessons is still mostly on paper
— the key facts, the station challenges, the exam practice — so plan for it, and
do not read a full online score as evidence that a pupil can do it unaided. Each
unit's pedagogy PDF says this where it is true of that unit.

85 lessons have no optional challenge activity. One outcome is not assessed
anywhere in its own unit, on purpose, and `docs/COVERAGE.md` names it and says
why. Every outcome now traces to a station, and every exam question to an
outcome.

Every lesson states a key question, key vocabulary and a starter. Six of them
state one only because it was written in October 2026: `nw-l01`, `nw-l02`,
`nw-l04`, `nw-l06`, `nw-l07` and `rp-l04` have worksheets that predate the
current build and never carried any, so theirs live in
`alignment/<lesson>.json` and go on the board rather than on the pupils' sheet.
The lesson plan says so where that is true.

**This figure used to read 57, and most of the drop was the count being wrong,
not the course getting better.** Three things were wrong with it. Bonus arcade
games were scored as recognition, and sorting, ordering and table-filling — where
nothing is offered and the pupil has to classify, sequence or work something out —
were scored as guided. `record.py` read only the first scene of a lesson, so two
lessons built in parts had two thirds of their stations treated as absent. And a
"find the broken line" activity was classified by the kind of *error* it contains
rather than by what it asks a pupil to do, because both are called `kind`, so
every one in the course counted as neither recognition nor construction.

57 to 9 was those three corrections. 9 to 0 was the work recorded below. Keep the
two apart when reading any of these numbers.

## The gap-closing pass, and what the pilots taught

Four lessons were rebuilt first, deliberately different from each other, before
anything was changed in bulk.

| pilot | why it was chosen | what it needed |
|---|---|---|
| `ms-l07` Capacity calculator | a calculation lesson with fifteen multiple-choice activities | somewhere to actually do the calculation: a working-out table per formula station |
| `sa-l02` Von Neumann HQ | conceptual, multiple-choice only, and one outcome nothing assessed | an activity *as* the assessment, where an exam question would have been the wrong instrument |
| `nw-l06` Star and mesh | its teaching existed only as pixels in the 360 image | the wall text recovered into the source, and a choose-the-topology activity |
| `el-l01` Impact desk | its deck had no model and no visible check | a MODEL slide and a CHECK slide |

What the pilots settled, and what the rest of the pass follows:

- **Add after, never replace.** A pupil's stored progress is keyed by station and
  activity index. A new activity at a new index is invisible to existing progress;
  renumbering an existing one silently moves somebody's marks.
- **The paper keeps its job.** Nothing was added online that the worksheet
  already does. `ms-l07`'s working-out tables deliberately print nothing on the
  sheet, because the sheet already poses its own scenarios and printing the same
  blank table would ask for the same sum twice.
- **Theory does not become typing.** Every activity added is a classification, an
  ordering or a calculation. None is a box to write prose in; prose belongs on
  paper, where it can be marked.
- **The new activity uses numbers and scenarios of its own.** Checked against the
  walls, the worked examples, the worksheet and the exam practice every time.
- **Where an outcome is genuinely untestable on paper, an activity assesses it.**
  `sa-l02-o3` is "understand what a keyword is", which is not Paper 1 systems
  architecture; writing an exam question for it would have been worse than the
  activity that sorts keywords from chosen names.
- **Measure before judging.** Two of the four pilots turned up a fault in the
  audit rather than in the lesson. Recalculate, state what the correction was
  worth, and do not present it as teaching that improved.

The outcome mappings those pilots checked by hand are in `alignment/<lesson>.json`,
and `docs/COVERAGE.md` marks every lesson as `authored` or `auto` so the difference
between a human judgement and a word match is visible rather than implied.
