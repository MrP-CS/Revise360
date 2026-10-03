# Building and checking Revise 360

Every number in this file came from a run, not from a plan. Where a check does not
exist, it says so.

## Environment

```bash
export R360_THREE=/path/to/three.min.js            # the 3D library the tests stub in
export R360_IWER=/path/to/iwer/build/iwer.js       # a fake WebXR device, for headset tests
export R360_PLEX=/path/to/ibm-plex-woff2           # the fonts the PDFs embed
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers   # the browser everything renders in
```

Without `R360_PLEX` the PDFs still build, in the system sans, and say so. Without
the other three the browser tests cannot run and will say which is missing.

## Building, in order

Each step reads what the one above it wrote.

```bash
python3 tools/inventory.py        # what the course contains -> build/inventory.json
python3 tools/record.py           # one record per lesson, the coverage trace
python3 tools/mkplans.py          # 115 lesson plan PDFs + lessonplans/index.json
python3 tools/mkunitdocs.py       # 3 PDFs per unit + the course big picture
python3 tools/mkpacks.py          # 24 ZIPs + packs/index.json (~10 min)
```

Content, when a lesson changes:

```bash
cd tools
python3 buildone.py specspy L1    # re-render one 360 scene (~18s a face, slow)
python3 buildws.py                # the worksheet specs and .docx files
python3 mkdeck.py PY && node deckgen.js deckspecs/deckPY.json PR
python3 markdata.py --write       # mark prescribed data in new questions (idempotent)
python3 mkguides.py               # the two printable Python guides
python3 recoverwalls.py --write   # nw-l01 and nw-l06: wall text from l1.py/l6.py
```

An `alignment/<lesson>.json` may also carry a `lesson_fields` block holding a
starter, a key question or key vocabulary. That is only for the six lessons
whose worksheet predates `tools/wsspecs` and never carried one, so there is
nothing to recover and nothing to rebuild the sheet from. An authored field is
used **only where the lesson has none of its own** — a starter printed on the
worksheet always wins — and the record names which fields came from there, so a
starter the sheet has always carried can be told from one written afterwards.
The lesson plan says on the printout when a starter is not on the pupils' sheet.

`recoverwalls.py` is only for the two lessons built by the oldest scripts, which
pass their wall text straight to the painter. It imports the script, replaces the
painter with one that writes down what it was asked to draw, and stores the
result on the matching station. Run it without `--write` to see what would change;
it exits non-zero if a wall card matches no station.

## Checking

Twenty-four checks. Run them all; each prints a single sentence at the end and exits
non-zero on a failure.

| check | what it holds | last run |
|---|---|---|
| `tools/verifycode.py` | every code question marks a right answer right and a wrong one wrong, no example answers its own question | 614 questions, 0 problems |
| `tools/verifyref.py` | the syntax reference's examples run and agree with their stated output | 99 examples, 0 disagreements; 60,786 example-question pairs, 0 leaks |
| `tools/checkws.py` | no worksheet references another publisher's resource, no answer sheet is among them | 112 worksheets, 0 answer sheets |
| `tools/audit_claims.py` | every checkable public claim is true of what ships | all true |
| `tools/audit_exposure.py` | nothing private is published | 2 findings, both recorded in EXPERIENCE-PROTECTION.md |
| `tools/tests/smoketok.py` | one lexer, one palette, prescribed data the same colour everywhere | pass |
| `tools/tests/smokegate.py` | no route past an unfinished Python question | 25 assertions, pass |
| `tools/tests/smokemarks.py` | `kit.py` and `js/store.js` agree what every activity is worth | 1,834 activities, 0 disagreements |
| `tools/tests/smokeplans.py` | a real, current plan for every lesson, none leaking an answer | 115 plans, pass |
| `tools/tests/smokepacks.py` | the packs hold what they say and nothing else | 24 packs, pass |
| `tools/tests/smokeguides.py` | the printed guides are real and quote the course's own figures | pass |
| `tools/tests/smokecode.js` | every code question marked in a real browser | pass |
| `tools/tests/smokevrcode.py` | a pupil can write and run a program in a headset | pass |
| `tools/tests/smokeparity.py` | every Python activity is the same question on both interfaces | 620 activities, 0 differences |
| `tools/tests/smokedraft.py` | a program typed on one is found on the other, and survives a reload | pass |
| `tools/tests/smokepyfail.py` | a runtime that does not arrive is said, reported and recoverable | pass |
| `tools/vrkeys.py` | every character the course needs can be typed in the headset | 87 needed, 98 typable |
| `tools/recoverwalls.py` | the wall text stored for nw-l01, nw-l04, nw-l06 and topic 2.5 is still what their scripts paint | 35 stations, 0 adrift |
| `tools/tests/smokevrcomfort.py` | the screen and the keyboard are where a seated pupil can read and reach them | pass |
| `tools/tests/sidebyside.py` | the page and the headset's screen, side by side for five lessons | read, not asserted |
| `tools/tests/measurescreen.py` | the page's own layout, which the headset's screen is built from | 1397 x 864 |
| `renderall.js` | all 614 activities render the parts their kind calls for | pass |
| `fit.js` | no question window needs scrolling at six widths | pass |
| `a11y.js` | everything named, reachable and readable | pass |

```bash
for t in verifycode verifyref checkws audit_claims audit_exposure; do python3 tools/$t.py; done
for t in smoketok smokegate smokemarks smokeplans smokepacks smokeguides \
         smokevrcode smokeparity smokedraft smokepyfail smokevrcomfort; do
  python3 tools/tests/$t.py; done
python3 tools/vrkeys.py
python3 tools/recoverwalls.py
node tools/tests/smokecode.js
```

`renderall.js`, `fit.js`, `a11y.js`, `kinds.js`, `retry.js` and `regress.js` are
development harnesses rather than committed tests; they live outside the
repository and are rebuilt when needed.

## The discipline the numbers depend on

**A check is not trusted until it has failed on purpose.** Every one of the
checks above was validated by breaking the thing it watches and confirming it
said so. That is not ceremony: three of them were wrong the first time and only
the injected fault showed it.

- `smokeplans.py` first read PDFs by inflating their streams by hand and got font
  subset codes rather than words, so every phrase check passed on nothing. It now
  uses `pdftotext`.
- `audit_exposure.py` first anchored its answer-file pattern to the start of a
  path segment and **missed** a planted `AL_L01_Answers.md`. Widening it to a word
  boundary turned up two real mark schemes in the git history.
- `smokepacks.py` first accepted a `--no-pdf` build, because "only these file
  kinds" is satisfied by a pack with no printable worksheet in it at all.
- `smokeparity.py` first read the headset keyboard's live hit areas, so a Check
  button disabled while Python downloaded counted as **absent** — and it
  flattened the required output, so the blank line lesson 1 teaches with
  `print()` compared equal to no blank line at all.
- `vrkeys.py` first matched only double-quoted strings in the keyboard table,
  which made the double-quote key itself look missing. Fixing that left four
  characters genuinely missing, `?` among them.
- `smokevrcomfort.py`'s first attempt at "does the workspace follow the head"
  moved the head and re-ran the placement, which is not the fault it is watching
  for. It only caught one once the placement was injected into the frame loop.
- `record.py` read only the first scene of a lesson, so it audited five of
  nw-l06's ten stations and five of nw-l01's fifteen and reported the rest as
  absent. Unit 1.3 was counted at 175 activities when it has 203, and at **zero**
  independent ones when it had fourteen. Injecting a station into a later scene
  is what showed it.
- `recoverwalls.py` was checked both ways round before its clean run was
  believed: a stored bullet corrupted by hand came back as one station to
  rewrite, and a station deleted from the experience left its wall card matching
  nothing, which it reported and exited non-zero on.
- `mkguides.py` read the Python activity names out of `player.js`, where they
  stopped being after the parity pass moved them into `pyactivity.js`. It found
  none, compared the empty set, and exited before writing anything — so the two
  printed guides could not be rebuilt at all for several commits. `smokeguides.py`
  had been saying so the whole time, as "older than player.js".
- `smokeparity.py` and `smokevrcode.py` both passed against the headset's screen
  while a disabled Run button was being left out of the hit list entirely, which
  read as "the screen has no Run control". A disabled control is now a hit area
  marked disabled, which is what it is.

## Visual review

| what | how much was looked at |
|---|---|
| lesson plans | all 7 pages of PR_L01, 3 of SA_L05_TEST, 3 of MS_L07, page 1 of SA_L01 and NW_L01, at full page size; the first two pages of three more by text |
| unit documents | all 3 of unit 1.1 and both pages of the course big picture, at full page size |
| worksheets | the converted PDF of SA_L01 at full page size; the rest by extracted text |
| slides | the embedded media of every deck by size and hash; PL_L01's preview image at full size |
| the homepage | full page at 1280px, the Python section at full size, and the layout at 390, 768 and 1440 |
| the task window | every activity kind in a browser, by `renderall.js` and `kinds.js` |

Contact sheets were not used: every page listed above was read at a size where
the small text, the code and the timings are legible.

## What is not checked

- **25 of the 88 PowerPoints cannot be rebuilt from anything in this
  repository.** Every MS deck, every NW deck and SA_L01 and SA_L02 are from an
  earlier deck design — different chrome, answer slides, sample answers — and no
  generator here produces it. `tools/deckgen.js` builds the other 63 and would
  replace those 25 rather than update them, so it is not run against them and
  they did not gain the CHECK slide the rest did. Rebuilding them means choosing
  to move them onto the current design, which is a decision for the owner, not a
  maintenance step. `tools/deckspecs/` has no deck12 or deck13 for the same
  reason: generating one is easy and installing what it builds would be a
  regression.
- **Nothing checks that a working-out table's stored answer is arithmetically
  true.** `smokecalc.py` checks that the board marks the working against the
  answer the lesson stores, not that the answer is right: the inputs are prose on
  a wall, so there is nothing to recompute from. The five that exist were
  computed by hand in October 2026 and all five agreed. A sixth will need the
  same treatment, and a wrong one would be marked confidently.
- **Nothing checks that a lesson teaches well.** The coverage trace in
  `docs/COVERAGE.md` is derived by matching content words and is a prompt to look,
  not a verdict.
- **Nothing checks the specification mapping against OCR's document**, which could
  not be retrieved from this build. See `tools/specref.py` for what was checked
  and what was not.
- **No check runs against a backend**, because there is not one. The Python
  progression and the teacher downloads are enforced in the browser only; see
  `docs/PYTHON-PROGRESSION.md` and `docs/EXPERIENCE-PROTECTION.md`.
- **The read-aloud button is not verified by ear.** It is checked for presence,
  wiring and the text it is given, on the page and now in the headset; nobody
  has listened to it in this environment.
- **Nothing here has run on a headset.** Every VR check runs against an emulated
  WebXR device in Chromium on x86, which even reports itself as a Quest 3 unless
  it is caught — `R360Py.diagnostic()` labels it `emulator` for that reason.
  They catch regressions and say nothing about Quest CPU, memory, texture
  limits, Oculus Browser or school network filtering. `docs/VR-HEADSET-QA.md` is
  the sheet for that, and `pydiag.html` the instrument.
