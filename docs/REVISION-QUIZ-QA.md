# Checking Revision 360

Every number here came from a run. Where a check does not exist, it says so.

The discipline this file depends on: **a check is not trusted until it has failed
on purpose.** Each one below was validated by breaking the thing it checks and
confirming it said so. Where that was done, it says what was broken and what the
check reported.

## Environment

```bash
export R360_THREE=/path/to/three.min.js
export R360_IWER=/path/to/iwer/build/iwer.js
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
```

## The checks

| check | what it holds | last run |
|---|---|---|
| `tools/mkrevision.py` | the bank builds; no two questions share a stem; every station exists and is in the right unit | 629 questions, 1,203 marks, 11 topics |
| `tools/revqa.py` | section 65's checks: marks in range, required fields present, no answer given away by its own stem, the manifest agrees with what is on disk, the family balance inside section 8's ranges | the bank is sound |
| `tools/revwritten.py` | every written question marks meaning, not words — nine kinds of probe against every mark point | 2,193 probes, 0 problems |
| `tools/revwritten.py --naive` | how many of those probes a word matcher gets wrong | 430 of 2,193 |
| `tools/revverify.py` | every derived answer recomputed with independent code | 181 of 181 agreed |
| `tools/revdupes.py` | six kinds of repetition, separating parameterised drill from real duplication | 39 groups, all read, all deliberate |
| `tools/revcoverage.py` | every teaching lesson has a question; which outcomes nothing asks about | 0 teaching lessons uncovered, 181 of 231 outcomes asked |
| `tools/tests/smokemark.py` | the marker's own rules, without the bank | 22 rules, pass |
| `tools/tests/smokerevise.py` | a learner can revise end to end, in a real browser | pass |
| `tools/tests/smokeviserbounds.py` | one question, fixed controls, no overlap, in a real headset runtime | pass |
| `tools/revindex.py` | every station a question points at opens in an experience | 702 of 702 openable |

## Marking meaning, not words

This is the claim the whole mode rests on, so it gets the most testing.
`tools/revwritten.py` builds nine kinds of probe for every written question and
marks each one with `js/revmark.js` itself — not with a second implementation in
Python, because a checker that marks its own way can agree with itself while the
site disagrees with both.

| probe | what it sends | what must happen |
|---|---|---|
| model | the full-mark example answer | full marks |
| paraphrase | the same answer in different words | full marks |
| way | each listed wording, on its own | that mark point, earned |
| point | each mark point's exemplar, alone | that point and no other |
| spelling | the model answer with letters dropped | full marks still |
| incomplete | one mark point's worth | fewer than full marks |
| irrelevant | two sentences that correctly answer questions in other topics | nothing |
| keyword | the mark scheme's own words as a list | at most one mark |
| negated / affirmed / reversed | each point's idea denied, un-denied, or turned round | that point not earned |

189 written questions, 346 mark points, 2,193 probes. Of those mark points, 298
state something that can be denied and 5 state a comparison that can be reversed;
the rest state something with nothing in it to turn round, and the suite says so
rather than pretending to test it.

**What makes the suite worth running:** `--naive` marks the same probes with a
word matcher — does the answer contain the mark scheme's words — and 430 of the
2,193 probes fail against it. That number is the only evidence the suite can tell
concept marking from word matching. If it dropped to nearly zero, the suite would
be passing for the wrong reason.

### What it has found

Twenty-three faults in `js/revmark.js`. Twenty-one were found by a probe; the
other two by `tools/tests/smokemark.py`, which exists because a marker rule can be
wrong in a way no question in the bank happens to exercise — and then an author
quietly works around it, the probes go green, and the next topic walks into the
same hole. The most recent four, each now held by a check in that file which fails
if the rule is taken out again:

| fault | what it did |
|---|---|
| a negator denying a consequence | "a file that is not there causes an error" lost its mark, because "error" sits exactly four words past "not" |
| a denied first occurrence hiding a clean one | "a disk does not lose its contents, unlike RAM, which loses its contents" earned nothing for saying RAM loses its contents |
| `entir` and `enter` one edit apart | a point about checking the ENTIRE program was earned by an answer about the data ENTERED |
| the comparative stemmer | "closer" and "closely" were only held together by an edit-distance rule loose enough to join "entire" and "entered" |

Shortening the negator's reach from four words to three was the obvious answer to
the first and the wrong one: the suite immediately showed it letting a negated
answer about a disk head earn its mark. The distance was never what told the two
apart; a new predicate is. That exchange is the reason the suite exists.

Also found, in questions rather than in the marker, and all of them in questions
that had already passed every other check:

- **eleven mark points that needed a second group.** Four had been written as
  alternatives where both halves were meant — `mp(c, [a], [b])` where
  `mp(c, [a, b])` was intended — and seven were simply too loose with one. Every
  one was found by an irrelevant probe earning a mark it should not have.
- **groups earned by a sentence about an entirely different topic**, because one
  very common word was standing alone in them: `control` (earned by the control
  unit), `structure` (by a data structure), `error` (by an IDE's error window),
  `half` (by "half an hour"), `permanent` (by "permanently removes"), `send`,
  `removes`, `data`, `wrongly`, `tested` (by "the test") and `entire` (by
  "entered").
- **five exemplars that stated their one idea twice**, in two wordings the point
  accepted, so negating one half left the other standing and the negation probe
  could not test the point at all.
- **four exemplars and one paraphrase for a developed mark point with no
  connective in them**, so the point could never be earned by that answer alone.
- **patterns that silently lost a word to the clause splitter**, in seven of the
  eleven topics. `revkit` now refuses them at build time, naming the sentence that
  went wrong.

## Validating the checks

| check | what was broken on purpose | what it said |
|---|---|---|
| `revwritten.py` | a pattern's reject list; a negation scope; a dump threshold | the exact probe that should fail, failed |
| `revwritten.py --naive` | nothing — it is the control | 430 probes behave differently under a word matcher |
| `revverify.py` | a stated conversion answer; a trace table row; two rows swapped | each one reported |
| `revqa.py` | eight injected faults, one per check | all eight reported |
| `revdupes.py` | four kinds of copied question | all four reported |
| `revindex.py` | two stations reversed | reported |
| `smokerevise.py` | four faults, including a missing mark badge | reported — and the fifth attempt exposed the check crashing instead of reporting, which was then fixed |
| `smokemark.py` | each of the four marker rules above, one at a time | the matching rule failed each time, nothing else |
| `smokeviserbounds.py` | the menu's placement beside a workspace; the keyboard's place in the targets | the overlap check and the reachability check respectively |

## The headset

`tools/tests/smokeviserbounds.py` reads the geometry `js/vr.js` reports —
`boundsFor()`, measured off the meshes rather than off the seating constants —
because a layout that looks right from where a test stands can still be
unreachable from where a pupil sits, and because a check that reads the intention
cannot catch the code failing to carry it out.

It holds, in a real WebXR runtime:

- one question screen, with its controls below it and nothing on top of either;
- at least 2° of clear air between every pair of surfaces, including with every
  keyboard symbol showing, which is the tallest the keyboard gets;
- the controls staying put while the head moves, and moving with the question when
  it is recentred;
- the menu reachable at all times, including while typing;
- a four or six-mark written question offering VR, paper and a desktop, and never
  only a headset keyboard.

Its first run found two defects that nothing had been looking at. The menu button
was being placed where it goes in an empty room, straight ahead at -42°, which is
underneath the borrowed keyboard: it could be looked at and not pressed. And the
keyboard was left out of `targets()` while an extension's panels were open, so a
pupil answering a written question could see the keys and not press one of them —
"modal" read as "only this panel" for the second time in that function, in the one
branch an earlier fix had not touched.

## What is not checked

- **Nothing has been run on a real headset.** Every headset result here comes from
  IWER's simulated Quest 3 in Chromium. Comfort, legibility at real IPD and
  controller precision are untested.
- **No learner has used it.** The modes, the spacing and the difficulty weighting
  are reasoned from the spec, not observed.
- **The marker's tolerance has not been calibrated against real answers.** It is
  tested against probes written by the same author as the questions. Real Year 11
  wording will find mark points that are too tight, and the probe suite cannot
  predict which.
- **Self-reviewed marks are not verified at all,** by design. A learner's own
  judgement on a six-mark answer is stored as their judgement.
- **The question count.** The spec asks for at least 1,500 meaningful questions
  unless a documented quality decision justifies a different number. The bank has
  629. The gap is deliberate and worth stating plainly: the families that can be
  generated honestly — conversions, binary arithmetic, shifts, file sizes — are
  already at 29% of the bank, which is the top of the range section 8 allows for
  them, so more drill would push the balance outside its own spec. Reaching 1,500
  inside those ranges needs roughly 270 more recognition questions and 270 more
  written ones, each written answer carrying its own mark points and nine probes.
  That is achievable and it is weeks of authoring, not hours; padding it with
  reworded questions would make the bank worse while making the number better. The
  honest position is 629 questions that each do something, every teaching lesson
  covered, and a note saying exactly what the remainder would cost.
