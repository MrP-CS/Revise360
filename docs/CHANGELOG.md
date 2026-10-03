# Revision 360 — October 2026

A continuous revision mode covering all eleven topics of OCR J277, usable by a
Year 11 on their own, on a laptop, a tablet or a Quest. It is a 360° experience
rather than a web form, it reports marks rather than questions, and it does not
give anybody a predicted grade.

Read `docs/REVISION-360.md` for what it does, `docs/REVISION-QUESTION-BANK.md` for
how the questions are written, `docs/REVISION-QUIZ-COVERAGE.md` for what they
cover, and `docs/REVISION-QUIZ-QA.md` for what has been checked and what has not.

## What it is

| | |
|---|---|
| questions | 629, across all eleven topics |
| marks available | 1,203 |
| modes | ten — endless, three question counts, two mark targets, mistakes, recover, weakest topics, exam practice |
| families | computed 29%, recognition 40%, written 31%; exam-style 28% — all inside the ranges the spec sets |
| teaching lessons covered | all of them |
| lesson outcomes with a question against them | 181 of 231 |
| predicted grades | none, anywhere |

## Marks, not words

Written answers are marked on meaning. `js/revmark.js` is the only place marking
happens — the page and the headset both call it — and it handles synonyms,
inflections, negation, contradiction, spelling and British English, with no exact
string matching anywhere in it.

That is a claim, so it is tested. `tools/revwritten.py` builds nine kinds of probe
for every mark point and marks each one with the site's own marker: 2,193 probes
over 346 mark points. **430 of those probes fail against a word matcher**, which is
the only evidence the suite can tell concept marking from matching words.

The suite found twenty-three faults in the marker and about forty in the questions.
The one worth repeating: a negator was denying the consequence of a causal link, so
"a file that is not there causes an error" lost its mark. Shortening the negator's
reach was the obvious fix and the suite immediately showed it letting a negated
answer earn a mark somewhere else. The distance was never what told the two apart;
a new predicate is.

## Every answer that can be derived, is

No conversion, truth table, binary addition, shift, calculation or trace table has
its answer typed in. `tools/revkit.py` computes them from the inputs and
`tools/revverify.py` computes them again with its own code: 181 of 181 agreed.
That is the only reason a bank with 181 computed questions can be trusted —
nobody has read 181 binary patterns to check them.

## The headset

One engine, two renderers. In a headset there is one question screen, a row of six
controls that never moves, and clear air between every pair of surfaces.
`tools/tests/smokeviserbounds.py` checks that through the geometry `js/vr.js`
reports rather than a screenshot, and its first run found two defects nothing had
been looking at: the menu button placed underneath the keyboard, and the keyboard
left out of what a controller can point at.

Nobody is made to write an essay on a virtual keyboard. A four or six-mark written
question offers VR, paper, or saving it for a desktop.

## The question count, honestly

The spec asks for at least 1,500 meaningful questions unless a documented quality
decision justifies a different number. There are 629.

The families that can be generated honestly are already at the top of the range the
spec allows them, so more drill would push the balance outside its own spec.
Reaching 1,500 within those ranges needs roughly 270 more recognition questions and
270 more written ones, each written answer carrying its own mark points and nine
probes. That is weeks of authoring rather than hours, and padding it with reworded
questions would make the bank worse while making the number better. The position
taken here is 629 questions that each do something, every teaching lesson covered,
and this note saying exactly what the remainder would cost.

## Nothing was replaced

No lesson, deck, worksheet, image or record changed. Revision 360 is additive: it
reads the course's own station records to decide where each question sends a
learner, and writes nothing back. Answer sheets remain outside the repository.

---

# Pedagogical gap-closing pass — October 2026

A quality pass, not a redesign. The visual system, the lesson structure and the
course's own words are unchanged; what changed is that pupils are now asked to
produce something in every teaching lesson, that every curriculum relationship a
person has checked says so, and that the classroom deck stops the class on one
question before independent work starts.

**Read the measurement corrections before the numbers.** Four faults in the
audit, not in the course, moved the headline figure from 57 lessons to 10 before
a single activity was added. `docs/COVERAGE.md` separates the two in its
before-and-after table and so does this section.

## Pedagogical change

| | |
|---|---|
| lessons reviewed | 115, all of them, through the regenerated record |
| lessons changed | 11 gained an activity; 8 more had their wall text recovered into the source, which changes nothing a pupil meets |
| activities added | 15, across 11 lessons (1,819 to 1,834) |
| activities altered | 0 — nothing existing was replaced, reworded or renumbered |
| outcomes newly assessed | 1 (`sa-l02-o3`, by an activity) |
| mappings explicitly authored | 73 of 270 outcomes, 34 of them with a reason written down; 56 alignment files |
| decks with a new check moment | 63 |
| decks with a new model | 4 |

**The four pilots, and what each needed.**

| pilot | what was wrong | what it got |
|---|---|---|
| `ms-l07` Capacity calculator | a lesson entirely about calculating, with fifteen multiple-choice activities and station walls posing sums with nowhere to answer them | four working-out tables, one per formula station |
| `sa-l02` Von Neumann HQ | three outcomes, two assessed; nothing anywhere asked whether a pupil knew what a keyword is | two sorting activities, one of them the assessment for that outcome |
| `nw-l06` Star and mesh | the teaching existed only as pixels in the 360 image, so two outcomes could not be traced | the wall text recovered into the source, and a choose-the-topology activity |
| `el-l01` Impact desk | the deck gave the structure of an eight-mark answer and the arguments, but never carried one out | a MODEL slide and a CHECK slide |

**The ten lessons that practised nothing independently**, and what each one
got. `ms-l07` fills in four working-out tables; `sa-l02` sorts keywords from
chosen names, and says which register is doing the work; `ns-l09` sorts a
weakness into the technology or the people; `nw-l02` asks whether a proposed fix
would help, do nothing or make it worse; `nw-l12` picks the protocol for a job;
`nw-l14` decides which answers earn the mark; `pf-l02` fills in DIV and MOD on
the same number; `pf-l04` builds a query from its clauses; `pl-l04` orders the
IDE cycle; `rp-l06` finds the line in a validation check that lets 13 through.

`nw-l06` is the eleventh lesson to gain one. It already had a single sorting
activity, so it was never in the list above; what it lacked was the step from
sorting descriptions of a topology to choosing one for a place it has not seen,
which is what its four-mark exam question asks for.

Every one was appended rather than inserted, because a pupil's stored progress
is keyed by station and activity index. Every one uses numbers and scenarios
checked against the walls, the worked examples, the worksheet and the exam
practice of its own lesson. None is a box to type prose into: that work belongs
on paper, where it can be marked, and the worksheets changed by exactly one
number each — the mark total.

**The decks.** A CHECK slide is derived from the lesson record, by the same rule
the lesson plan uses, so a deck can never stop the class on a different question
from its own plan. It shows the question and the options and does not mark the
right one; the answer, the counting routine and which station to go back to are
in the speaker notes. Where the course has one response covering every wrong
option, the notes say so rather than inventing a diagnosis per distractor.

Four MODEL slides, where there is a process worth modelling: writing pseudocode,
filling a trace table, building a truth table, structuring an eight-mark
discussion. Each uses data that appears nowhere else in its lesson.

## Cosmetic change

- A sorted item longer than a phrase now takes the row above its buttons instead
  of sitting beside them, where a whole scenario wrapped to one word a line. Four
  categories already did this and the headset always has.
- A working-out table starts at the left margin when there is no program beside
  it, and its columns grow to the widest heading they carry. Both were needed by
  the new activities; both improve the five that existed.
- The model slide divides its height between the working and the finished answer
  in proportion to what each needs, because a pseudocode answer and a prose one
  are different shapes.

Nothing else moved. No colour, type, worksheet layout, slide layout, icon or
page structure was changed.

## Measurement corrections, which are not improvements

Four faults in the audit, each found by injecting the fault the check was
supposed to catch:

- Bonus arcade games counted as recognition, and sorting, ordering and
  table-filling counted as guided when nothing is offered and the pupil has to
  classify, sequence or work something out.
- `record.py` read only the first scene of a lesson. Two lessons are built in
  parts, so 15 stations had never been audited and unit 1.3's teacher guide said
  175 activities and zero independent ones where it has 203 and fourteen.
- A find-the-bug activity carries both `t` and `kind`, and its `kind` is the kind
  of error. Reading `kind` first classified every one in the course by whether it
  held a syntax or a logic error, so none counted as anything.
- An end-of-topic test's reflection sheet writes its empty Marks cell as a dash,
  and the reader took each dash for another topic row: nine questions reported
  where that test has none.

## Faults found and fixed on the way

- **Eight lesson plans named the wrong answer.** For a select-all question the
  record kept only the first option as correct and filed the real answers as
  distractors. `NW_L06`'s plan said the answer was Reception while its own
  teaching response three lines below said Accounts and Conference.
- **The two printed Python guides had not been rebuildable for several
  commits.** `mkguides.py` read the activity names from `player.js` after the
  parity pass moved them to `pyactivity.js`, found none and exited before
  writing. `smokeguides.py` had been reporting it the whole time.
- **The lesson plans committed in the first two pilots were built in the wrong
  fonts**, because `R360_PLEX` was not set. All 115 were rebuilt in IBM Plex.
- **A Python check slide asked what a program displays without showing the
  program.** The record was dropping the listing; the slide and the plan both
  carry it now.
- **An authored model would have been silently dropped** by the next
  regeneration of its deck spec. `mkdeck.py` carries it over.

## A later addition: the starters, key questions and vocabulary

Eight lessons stated no key question, six no key vocabulary and three no
starter, so their lesson plans printed "not in the lesson record" where a
non-specialist most needs one. `nw-l14`, `ms-l11` and `ms-l16` have spec
modules, so theirs are authored there and `nw-l14`'s pupil worksheet gained a
Key terminology and a Key question section with it.

The other six - `nw-l01`, `nw-l02`, `nw-l04`, `nw-l06`, `nw-l07` and `rp-l04` -
have worksheets that predate `tools/wsspecs` and could not be rebuilt, so
theirs live in `alignment/<lesson>.json` under `lesson_fields` and go on the
board. An authored field is used only where the lesson has none of its own:
`nw-l02` and `nw-l04` already print a starter on their sheets and keep it, which
was checked by authoring a decoy starter for `nw-l02` and confirming the
worksheet's own still won.

Each starter retrieves the lesson before it, as section 16 asks. `nw-l01` is the
first lesson of its unit, so its starter is a baseline check that says on the
plan that it is one, rather than pretending the material has been taught.

Also fixed: every one of the 115 lesson plans read "so the 360 image is is
already cached". The placeholder carried the verb and the template carried it
again.

## Remaining gaps

- **197 of 270 outcomes are still matched by words and unchecked.** Authoring one
  is a judgement about a lesson, not a transformation that can be run.
- **34 lessons have exactly one activity that asks for an answer** rather than a
  choice. That is a floor, not a standard.
- **One outcome is assessed by nothing on purpose.** `rp-l03-o1` is a supporting
  objective, and it stays visible rather than being quietly mapped.
- **25 of the 88 PowerPoints have no check slide.** Every MS deck, every NW deck
  and SA_L01 and SA_L02 are from an earlier deck design, and no generator in this
  repository produces it; building them with `deckgen.js` would replace them
  rather than update them. Moving them onto the current design is a decision.
- **Nothing here measures whether a lesson teaches well.**
- **Six lessons' starters are not on the pupils' worksheet**, because those
  sheets predate the current build and cannot be regenerated. They are on the
  plan and the plan says where to put them.

## Files regenerated

115 lesson plans, 37 unit documents, 24 packs, 63 PowerPoints, 5 worksheets,
both printed guides, 13 experience JSONs, every lesson record, and
`docs/COVERAGE.md`.

## Tests run

`verifycode` (614 questions), `smokecode.js`, `smokeparity` (620 activities),
`smokemarks` (1,834 activities), `smokegate`, `smokealgo`, `smokecalc`,
`smoketok`, `smokeplans`, `smokepacks`, `smokeguides`, `smokevrcode`,
`checkws`, `audit_claims`, `audit_exposure`, `recoverwalls`. All pass.

Every new or changed detector was validated by breaking the thing it watches
first: the scene reader against an injected station, the wall recovery against a
corrupted bullet and a deleted station, the guide check against a renamed
activity kind, the deck overflow check against text left too long, and
`mkdeck.py` against an injected model.

## Visual review

Every new activity was opened in a browser at the window it will be used in and
read at full size, and checked for overflow at 390, 768 and 1440 px. All four
model slides and check slides from two topics were rendered at full page size
and read. Pages 1 to 3 of the regenerated `NW_L06` plan were read at full page
size; the rest of the plans were read as extracted text.

Not looked at: the 25 decks that were not rebuilt, and the headset, which has
still never run this course.


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
