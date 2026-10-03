# The same Python course, on a screen and in a headset

Measured at commit `734f845` on 3 October 2026, **before any change**. Nothing
here is read off the source: each row is what the two renderers actually put in
front of a pupil when the same activity was opened twice.

**What it is now is at the bottom**, measured the same way.

## How it was measured

```bash
export R360_THREE=.../three.min.js R360_IWER=.../iwer.js
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
python3 tools/tests/parityprobe.py pr-l01     # the same activity, both ways
python3 tools/tests/pytrace.py                # the runtime, link by link
```

`parityprobe.py` opens `pr-l01` station 1, activity 4 — a *Complete it* with a
hint ladder — on the page and again inside an immersive session, and records
what each one shows. It writes `build/parity/screen-pr-l01.png`,
`vr-pr-l01.png` and `parity-pr-l01.json`.

The headset side runs against IWER's emulated Meta Quest 3 in Chromium on a
build machine. **That is not a headset.** Everything below about what is drawn
holds; nothing below is evidence about Quest performance, memory or download
time.

## The table

Same activity, same pupil, same moment.

| | screen | headset | |
|---|---|---|---|
| **question introduction** | modal header: station number and name | nothing — the code panel has no title | ✗ |
| **activity stage** | chip **Complete it**, and "Part of the program is missing. Fill in the gap." | nothing | ✗ |
| **teaching explanation** | *Learn* panel: "One print() makes one line. A second print() under it makes a second line." | nothing | ✗ |
| **worked example** | two-line `<pre>`, coloured, plus **shows** First / Second | one line, `e.g. print("First")    print("Second")`, newlines flattened to spaces, cut at 74 characters | ✗ |
| **line-by-line notes** | fold-away list, numbered to the example | nothing | ✗ |
| **question instructions** | three numbered steps, one sentence each | one run-on paragraph | ✗ |
| **supplied data** | `"Line one"` and `"Line two"` boxed, monospace, in the string colour | ``` `"Line one"` ``` — the authors' backticks printed as characters | ✗ |
| **starter code** | in the editor | in the editor, identical | ✓ |
| **editor** | textarea, line numbers, Tab indents, Esc leaves, Ctrl+Enter runs | canvas, 11 lines visible, caret, trigger keyboard | ≈ |
| **syntax highlighting** | `R360Tok` via `R360Py.paint` | `R360Tok` via `R360Py.tokens` — already one lexer | ✓ |
| **Run** | button between the program and its output | key on the keyboard panel, below six rows of keys | ≈ |
| **program input** | *One run of your program*: **You type** nothing · **It displays** Line one / Line two | nothing — the pupil cannot see what the program is given or must print | ✗ |
| **output** | *Program output* panel, scrolls, full tracebacks with the three-part explanation | four lines, each cut at 92 characters — a `friendly()` traceback is seven | ✗ |
| **Check** | button, with per-test rows: input → expected, and what yours printed | key; one line of result text, three lines maximum | ✗ |
| **automated tests** | same tests, same `sameOutput`, same `forbid`/`require` | same tests — but the `forbid`/`require` rule is a second copy of the code | ≈ |
| **hints** | ladder: Step 1 of 3 Think, Step 2 The Python you need, Step 3 Watch the technique | same three rungs, in the console line, as one truncated sentence | ≈ |
| **progressive help** | attempt 1 "change one thing"; attempt 2 names the Hint button; attempt 3 puts the hint in the feedback | the same sentence, "Press Hint: it gives you one step at a time.", from attempt 2 onwards and never anything more | ✗ |
| **teacher-help prompt** | **I need help** button, always; opens the panel that says to ask, that nobody is notified, and that the question still has to be finished | **not present at all** | ✗ |
| **successful completion** | ✓ Nice work, the technique named, the way on | one line of result text | ≈ |
| **unsuccessful attempt** | which test failed, with what it printed instead | the first failure only, inside the same three lines | ≈ |
| **progress indicator** | bubbles, one per activity, and "Activity 1 of 1" | nothing on the code panel | ✗ |
| **question navigation** | **Next question** / **Finish**, released only when the activity is complete | **nothing — Close is the only way out** | ✗✗ |
| **save/resume** | `core.awardBest` → `Store` | `core.awardBest` → `Store`, the same call | ✓ |
| **the program itself** | lost on close; always reopens at `task.starter` | lost on close; always reopens at `task.starter` | = |
| **read aloud** | on every task | not present | ✗ |
| **syntax reminder** | **Syntax reminder** opens `R360Ref` | not present | ✗ |
| **question image** | `task.img` shown above the question | ignored by the code panel | ✗ |

`✓` the same · `≈` different presentation, same substance · `✗` missing in the
headset · `=` the same failing on both.

### The one that stops the course

**A Python question in the headset has no way on.** `openCodeVR` is handed the
question list and the position in it, and uses them only to record the mark.
Nothing advances. A pupil finishes question 4, and the only button is Close,
which drops them back into the room to find the badge again. The screen releases
**Next question** the moment the activity is complete, and refuses it before.

So the headset cannot be used to work a Python station through, which is what
the course is. Everything else in the table is a difference; this one is a stop.

## What is shared already, and what is a second copy

Shared through `core`, and already right: `marks`, `award`, `awardBest`,
`sameOutput`, `taskList`, `stationState`, `completeStation`, `gated`,
`isComplete`, `lockedStation`. The two renderers cannot disagree about what a
question is worth, whether it is finished, or whether the next station opens.

Written twice, in `js/player.js` and `js/vr.js`:

| | screen | headset |
|---|---|---|
| the hint ladder (think / syntax / start / walk / diagram) | `openHint` | `hintCodeVR` |
| `forbid` and `require` | `#pycheck` handler | `checkCodeVR` |
| the marking loop and best-mark rule | `#pycheck` handler | `checkCodeVR` |
| "a Try it is finished by running it" | `#pyrun` handler | `runCodeVR` |
| the attempt-escalation wording | three lines | one line |
| the brand colours | `css/style.css` `:root` | `js/vr.js` `COL`, hand-copied |

The colours are the same values today. They are a second copy, which is the
fault `tools/tests/smoketok.py` was built to catch for the token palette and
does not yet catch for the brand palette.

Not written anywhere the headset can reach: the stage labels (`KINDS`),
`stageOf`, `splitSteps`, `rich`/`pytok`/`flat`, the *One run of your program*
model, and `askTeacher`.

## The runtime

`tools/tests/pytrace.py` walks `experience.html → pyide.js → Worker →
pyworker.js → vendor/pyodide/pyodide.mjs → WASM → R360Py.ready()` and times each
link, on the page and again inside an immersive session.

| link | screen | in an immersive session |
|---|---|---|
| `WebAssembly` present | ok | ok |
| module worker supported | ok | ok |
| `js/pyworker.js` | 200 `text/javascript` | 200 `text/javascript` |
| `vendor/pyodide/pyodide.mjs` | 200 `text/javascript` | 200 `text/javascript` |
| `vendor/pyodide/pyodide.asm.wasm` | 200 `application/wasm`, 9,598,218 bytes | the same |
| `WebAssembly.compileStreaming` | 217 ms, 8,560 exports | 311 ms |
| the real worker answers `init` | 2,667 ms | 2,686 ms |
| `R360Py.ready()` | 2,235 ms | 2,100 ms |
| `R360Py.run("print(2+2)")` | `"4\n"` | `"4\n"` |
| **total** | **5,619 ms** | **5,615 ms** |

Every link holds, and being inside an immersive session changes nothing. So
nothing in the chain is structurally broken, and **the actual Quest error has
not been recorded** — there is no headset reachable from this machine, and the
production origin could not be fetched from here either.

What that run does establish is how the failure would look. Four things are true
of the code regardless of device:

1. **`ready()` has no timeout.** `post({ kind: "init" })` is called with no
   `timeoutMs`, so if Pyodide never arrives the promise never settles. The
   headset panel says *Starting Python…*, Run shows `…`, and it stays that way
   for ever. No error, no retry, nothing said.
2. **There is no progress.** 12 MB of runtime over a school WiFi on a Quest is
   not 5 seconds. A pupil is given one unchanging line and no reason to believe
   anything is happening.
3. **`readyOnce` is cached whatever happens.** A first attempt that fails
   resolves it, and every later question skips straight past the loading state
   into a runtime that is not there.
4. **`RUN.say("error")` goes nowhere in the headset.** `js/vr.js` never
   subscribes to `R360Py.on`, so the one place the runtime says it has fallen
   over is not listened to.

Those four are what make a slow or failed load indistinguishable from a hang,
and they are fixed without knowing the Quest error. Finding the Quest error
needs an instrument on the device, which is the next thing to build.

## What this does not say

- Nothing here was run on a headset. A passing emulator run is not evidence that
  Python works on a Quest.
- The production origin was not fetched. MIME types, compression and caching for
  `vendor/pyodide/` on `revise360.co.uk` are unverified; they are correct on the
  local server this was measured against.
- Memory was not measured. Pyodide wants a few hundred megabytes, and a Quest
  browser holding a 360 scene as well is the obvious place to look next.
- Only `pr-l01` was probed, and only one activity in it. The *Try it*, *Predict*
  and *Build it* stages differ from *Complete it* on the screen and were not
  compared row by row.

---

# After

The headset's Python activity is now one large screen showing the normal
Revise 360 interface, with the VR keyboard directly underneath it.
`docs/VR-DESIGN-SYSTEM.md` has the design; this is what it fixed.

Measured the same way, at `d10bffe`.

## The table, again

| | headset, before | headset, now |
|---|---|---|
| the whole interface | five floating panels at different depths | **one screen**, laid out from the page's own measurements |
| question introduction | nothing | the station's number and name, in the title bar |
| activity stage | nothing | the chip, in the stage's own colour, with what it means |
| progress through the station | nothing | the chip row and one bubble per activity |
| teaching explanation | nothing | the *Learn* box, where the page puts it |
| worked example | one line, flattened, cut at 74 characters | the program as a block, coloured, with its **SHOWS** output |
| line-by-line notes | nothing | each line with its note |
| question instructions | one run-on paragraph | numbered steps, in the *Your task* box |
| supplied data | ``` `"Line one"` ``` with the backticks printed | boxed, monospace, in the string colour |
| starter code | the same | the same, or the pupil's own draft, with the caret in the gap |
| editor | 11 lines on a separate panel | 12 lines in the window, point-to-place caret |
| syntax highlighting | `R360Tok` | `R360Tok` |
| Run | on the keyboard panel | between the program and its output, as on the page |
| program input | nothing | **ONE RUN OF YOUR PROGRAM**, above the output |
| output | 4 lines, cut at 92 characters | the *Program output* box, wrapped and scrolling |
| Check | one line of result | every test, with what it expected and what ran |
| automated tests | a second copy of the rule | `R360PyAct.rules`, the one rule |
| hints | three rungs as one truncated sentence | the screen's ladder, a rung at a time, as a pane over the window |
| progressive help | one sentence from attempt 2 | the screen's three, in order |
| teacher-help prompt | **not present** | the same pane, the same three paragraphs, after the same three attempts |
| syntax reminder | not present | the course's reference, a group at a time |
| read aloud | not present | on the screen, speaking the steps without the backticks |
| successful completion | one line | ✓ Nice work, the technique named, and the way on |
| unsuccessful attempt | the first failure only | every test, and the way on in its place but not available |
| **question navigation** | **nothing — Close only** | **Next question / Finish**, released by the same rule as the screen |
| save/resume | the same store | the same store |
| the program itself | lost on close | kept as it is typed, and found on the computer |
| the 360 room | still there | still there, dimmed only where the screen covers it |

`tools/tests/smokeparity.py` opens all **620** Python activities on both
interfaces and compares the stage, the wording, the steps, the brief, the worked
example, the starter, the required run, the ladder, what is offered — and that
nothing is floating beside the screen.

`tools/tests/sidebyside.py` captures the page and the headset's screen for
lessons 1, 3, 6, 10 and 13 and stacks them, so the question the brief asks can
be answered by looking rather than by argument.

## What reading those captures found

Three faults that only showed up side by side:

- a question whose test types in six lines drew them **out of the run box and
  over the heading below it**;
- the editor opened **scrolled to the end** of the program rather than where the
  work is;
- the unavailable *Try this one again* was drawn **on top of** *I need help*, so
  a press reached the wrong one. `smokevrcode.py` now fails if any two controls
  overlap.

## Deliberately still different

- **✛ Recentre** is in the title bar. The page has no need for it.
- The status line beside Run says what pointing and the keyboard do, where the
  page says what Tab, Escape and Ctrl+Enter do.
- On a *Complete it* the caret lands at the `____` gap, and the editor opens
  showing it. The page opens at the top of the program.
- A question image is not drawn. No code activity in the course carries one —
  0 of 620 — but an author who added one would not see it in there.

## The keyboard

`tools/vrkeys.py` reads every starter, model solution, worked example, hint and
required technique in the course: **87 distinct characters** are needed and
**98** can be typed. Four could not be before — `?`, used in sixty-three
`input()` prompts from lesson 1, `\` for the newline in lesson 10's file
writing, `;` and `^`.

## The runtime

| | screen | headset |
|---|---|---|
| page load → Python ready, pre-warm on | 7,147 ms | 6,906 ms |
| choosing a question → an editor you can type in | **161 ms** | **302 ms** |
| the same, with no pre-warm | 3,139 ms | 3,054 ms |
| page load → ready, throttled to about 1 MB/s | — | 16,056 ms |
| choosing a question → editor, throttled | — | **243 ms** |
| JS heap after opening and closing a question seven times | 10 MB, unchanged | 10 MB, unchanged |

Loopback on a build machine. `performance.memory` sees only the page's
JavaScript heap, not Pyodide's own, which lives in the worker. **Nothing here
was measured on a headset.**

## Comfort, measured

| | |
|---|---|
| the screen | 2.05 m away, 70.5° across, spanning −20° to +28° |
| the keyboard | 1.80 m away, spanning −44° to −22° |
| body text | 0.87°, about 22 of a Quest's pixels |
| the smallest thing drawn | 0.70° |
| the smallest thing to point at | 2.15° |
| anything floating beside them | none |
| the workspace while the head moves | does not move |
| ✛ Recentre | moves the screen and the keyboard together, keeping the program |

## What is still not known, and who can answer it

- **The actual Quest error has still not been recorded.** No headset is
  reachable from this machine. `pydiag.html` is the instrument: open it on the
  headset, press *Run the checks*, then *Enter VR and run them again*.
- **The production origin was not fetched.** How `revise360.co.uk` serves
  `vendor/pyodide/` — MIME types, compression, cache headers — is unverified
  from here. Step 4 of `pydiag.html` answers it from the headset.
- **Whether a paired Bluetooth keyboard reaches an immersive page** in Oculus
  Browser.
- **Quest memory and texture limits** under a 360 panorama plus Pyodide, and
  whether the lettering is comfortable through a lens.
