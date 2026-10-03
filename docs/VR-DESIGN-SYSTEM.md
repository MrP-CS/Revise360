# The same course, hanging in a room

This is not a VR brand. Everything here is the Revise 360 design system
(`docs/RESOURCE-DESIGN-SYSTEM.md`, `BRAND.md`, `css/style.css`, `css/pytok.css`)
placed in three dimensions. Where a value appears below it is the value the site
already uses, read at draw time rather than written down again.

## Nothing is a second copy

| what | the one place | how the headset gets it |
|---|---|---|
| the brand palette | `css/style.css` `:root` | `getComputedStyle(document.documentElement)` at draw time |
| Python token colours | `css/pytok.css` | `R360Tok.colours`, through `R360Py.tokens` |
| how Python splits into tokens | `js/pytok.js` | the same function the editor uses |
| what a Python activity is, and every sentence said about one | `js/pyactivity.js` | `R360PyAct.model(task)` |
| what an activity is worth, and whether it is finished | `Store.marks`, `core.gated/isComplete/lockedStation` | the same calls as the page |
| a pupil's half-written program | the experience's own progress | `core.getDraft` / `core.setDraft` |

Change `--panel` in `css/style.css` and the panels in the headset change with
it. There is no VR colour table to keep in step, and `js/algo.js` is the reason
that rule exists: it once held a second copy of the token table and drifted.

## Colours

The nine the headset uses, all from `:root`:

| token | screen | used for |
|---|---|---|
| `--panel` | `#1c2c4a` | a panel's surface |
| `--bg2` | `#0e1628` | the program surface, a button face, a code block |
| `--line` | `#3c5a87` | every border |
| `--fg` | `#f0f4fa` | text |
| `--soft` | `#b4c4dc` | secondary text, the brief, line notes |
| `--edge` | `#ffd046` | the caret, a heading, a primary button, the way on |
| `--ok` | `#50dc96` | a passed test, a finished activity, a Challenge |
| `--bad` | `#ff5f5f` | a failed test, an error |
| `--info` | `#5ab4ff` | *Learn*, a Try it or Predict stage |

The seven Python token colours are the screen palette from `css/pytok.css`,
unchanged: a string is the same green in the headset's editor as in the page's.

`tools/tests/smokevrcomfort.py` measures each one against the surface it is
drawn on. Everything clears 4.5:1 except a comment at 3.67:1, which is dimmed on
purpose and is the same value the page uses — it is the one thing in the editor
meant to recede, and changing it here would make the headset's editor differ
from the screen's.
**Colour is never the only signal.** Prescribed data in a sentence is boxed and
monospace as well as coloured, exactly as on paper; a passed test carries ✓ and
a failed one ✗ as well as a border colour; a stage is named in words.

## Where things hang

One anchor is taken when a question opens, from where the pupil is looking, and
every surface is placed against it. Nothing follows the head afterwards. The
anchor is retaken only when the pupil presses **✛ Recentre**.

| surface | distance | pitch | yaw | width |
|---|---|---|---|---|
| **what to do** — stage, steps, brief | 1.95 m | +28° | 0° | 1.50 m |
| **your program** — editor, required run, output | 1.75 m | −3° | 0° | 1.55 m |
| **the example and the marking** | 1.95 m | 0° | +32° (left) | 0.95 m |
| **the keys** — and Run, Check, Hint, the reference, Read aloud, Help, the way on | 1.55 m | −30° | 0° | 1.70 m |
| **a hint or the help panel** | 1.40 m | 0° | 0° | 1.25 m |

The reason for each: a pupil looks **up** to read the task, **ahead** to write,
**left** for the worked example and how the marking went — which is the column
the screen keeps them in — and **down** for the keys. The hint and the help open
in front of the program, as they do over the editor on the page, and the program
is still behind them with every character in it.

Nothing is behind anything else, nothing is further than 42° off-centre, and
nothing is nearer than 1.4 m. The source of these values is `SEAT` in
`js/vr.js`; `tools/tests/parityprobe.py` reads back where each one actually
ended up.

## Type

Panel text is specified in canvas pixels against a panel's width in metres, so
what matters is the angle it subtends. On the task panel (1200 px over 1.50 m at
1.95 m) one canvas pixel is about 0.037°.

| what | size | about |
|---|---|---|
| a panel title | 36 px | 1.3° |
| a numbered step | 30 px | 1.1° |
| the stage line | 27 px | 1.0° |
| the brief, the line notes | 25 px | 0.9° |
| the program in the editor | 27 px over 1.55 m at 1.75 m | 1.0° |
| a key's label | 26 px × 0.7 scale | 0.8° |
| a line of console output | 20 px | 0.8° |

The floor is about 0.7°, which is roughly 20 px at arm's length on a phone. The
screen's own rule — *when a question does not fit, the column scrolls, it does
not shrink its type* — holds here: the program pages rather than shrinking, and
says how many lines are below.

## Targets

A key is at least 66 canvas px tall before the 0.7 scale, which on the keyboard
panel (1500 px over 1.70 m at 1.55 m) is about 1.9° — comfortably above the 1°
a controller ray can hold steady.
Hover is drawn as a brighter fill *and* a thicker border, never colour alone,
and every hover pulses the controller for 12 ms so a target can be felt as well
as seen.

## The program surface

1200 × 900 canvas at 1.55 m. Top to bottom: a header naming the stage and the
position in the station; eleven lines of editor with a line-number gutter and
the caret in `--edge`; **ONE RUN OF YOUR PROGRAM** with what is typed in and
what must come out; **PROGRAM OUTPUT**, wrapped rather than truncated, because a
Python traceback is said in three parts and cutting it throws away the part that
teaches; and a status line for what the runtime is doing.

## The keyboard

Seven rows of characters, then a row of controls (Shift, Space, Tab, the four
arrows, line start, line end, clear line, Back, Enter), then the actions (Run,
Check my answer, Hint, Syntax reminder, Read aloud, I need help), then the way
on, then one line saying where everything is. Which characters it must carry is not a judgement: `tools/vrkeys.py`
reads every starter, model solution, worked example, hint and required technique
in the course and fails if one of them cannot be typed.

No autocomplete, and nothing block-based. A pupil writes Python.

## Feedback states

The same states as the page, in the same colours.

| state | how it reads |
|---|---|
| waiting for Python | the status line says what it is downloading and how long it has been; Run and Check are held back; **the hint, the example and the help are not** |
| Python failed | what has *not* happened, the thing to check, a code to report, and Try again / Ask your teacher / Close |
| running | `Running…` on the status line |
| a test passed | ✓ and `--ok` on that row |
| a test failed | ✗ and `--bad`, with what it expected and what ran |
| finished | ✓ Nice work, the technique named, and the way on appears |
| not finished | the escalating line, and the way on in its place but not available |

## Comfort

- One anchor per question; nothing follows the head. **✛ Recentre** is the only
  thing that moves the workspace, and it keeps the program.
- Nothing nearer than 1.4 m, nothing above +42° or below −50°.
- Turning is snap, 30° a press, never continuous.
- A toast raised while a workspace is open goes *below* the keys, because a
  message that covers the thing it is about is worse than no message.
- The menu button drops to −74° while a workspace is open; it used to sit on top
  of the keys, covering Tab, the arrows and Check.
- Seated use is the assumption throughout. Nothing requires standing, reaching
  or turning round.

## What this document does not establish

No separate VR typography scale, no VR-only colour, no VR-only wording, and no
flat replacement for the 360 experience. If something here disagrees with
`docs/RESOURCE-DESIGN-SYSTEM.md`, that document is right and this one is a bug.
