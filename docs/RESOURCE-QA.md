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
```

## Checking

Sixteen checks. Run them all; each prints a single sentence at the end and exits
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
| `tools/tests/smokemarks.py` | `kit.py` and `js/store.js` agree what every activity is worth | 1,819 activities, 0 disagreements |
| `tools/tests/smokeplans.py` | a real, current plan for every lesson, none leaking an answer | 115 plans, pass |
| `tools/tests/smokepacks.py` | the packs hold what they say and nothing else | 24 packs, pass |
| `tools/tests/smokeguides.py` | the printed guides are real and quote the course's own figures | pass |
| `tools/tests/smokecode.js` | every code question marked in a real browser | pass |
| `tools/tests/smokevrcode.py` | a pupil can write and run a program in a headset | pass |
| `renderall.js` | all 614 activities render the parts their kind calls for | pass |
| `fit.js` | no question window needs scrolling at six widths | pass |
| `a11y.js` | everything named, reachable and readable | pass |

```bash
for t in verifycode verifyref checkws audit_claims audit_exposure; do python3 tools/$t.py; done
for t in smoketok smokegate smokemarks smokeplans smokepacks smokeguides smokevrcode; do
  python3 tools/tests/$t.py; done
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
  wiring and the text it is given; nobody has listened to it in this environment.
