# One screen in the room

The Python experience in a headset is one sentence:

> The normal Revise 360 Python programming screen appears as a large virtual
> monitor inside the 360 room, with a VR keyboard directly underneath it.

There is no VR brand, no VR information architecture and no VR-only wording.
Everything below is the existing design system — `docs/RESOURCE-DESIGN-SYSTEM.md`,
`BRAND.md`, `css/style.css`, `css/pytok.css` — put on a surface that happens to
be hanging in a room.

## The onscreen version is the authority

`tools/tests/measurescreen.py` opens a real Python activity in a browser and
reports the box of every region. `js/pyscreen.js` draws from those numbers. The
layout space is **1397 × 864**, which is what the window occupies at 1440 × 900,
and every position below is a measurement rather than a choice.

If the page's layout changes, re-run `measurescreen.py` and move these numbers
to match. The page is right and this file is a copy of it.

| region | x | y | w | h |
|---|---|---|---|---|
| the title bar | 3 | 3 | 1391 | 64 |
| the left column | 19 | 81 | 725 | to 843 |
| the right column | 760 | 81 | 618 | to 843 |
| the editor | 760 | 81 | 618 | 270 |
| the bar under it (Run, Syntax reminder, status) | 760 | 361 | 618 | 78 |
| *One run of your program* | 760 | 449 | 618 | to content, capped at 210 |
| *Program output* | 760 | below that | 618 | the rest, to 787 |
| Hint · Check my answer · I need help · the way on | 760 | 797 | 618 | 46 |

The left column scrolls; the marking sits below it and does not. The editor
scrolls. The output scrolls. The window itself never grows: long content gets a
scrolling region, not another panel.

## Nothing is a second copy

| what | the one place | how the headset gets it |
|---|---|---|
| the brand palette | `css/style.css` `:root` | `getComputedStyle` at draw time |
| Python token colours | `css/pytok.css` | `R360Tok.colours`, through `R360Py.tokens` |
| how Python splits into tokens | `js/pytok.js` | the same function the editor uses |
| what an activity is, and every sentence said about one | `js/pyactivity.js` | `R360PyAct.model(task)` |
| what it is worth, and whether it is finished | `Store.marks`, `core.gated/isComplete` | the same calls as the page |
| a pupil's half-written program | the experience's own progress | `core.getDraft` / `core.setDraft` |
| the layout above | `js/pyscreen.js`, from `measurescreen.py` | it *is* the renderer |

Change `--panel` in `css/style.css` and the screen in the headset changes with
it.

## Colours

The nine from `:root`: `--panel` (the window), `--bg2` (the editor surface, a
button face), `--line` (every border), `--fg`, `--soft`, `--edge` (headings, the
caret, a primary button), `--ok` (a pass, the window's border and title bar on a
code question — the page hard-codes `#50dc96` there), `--bad` (a fail),
`--info` (*Learn*). The surfaces the stylesheet names directly are carried over
as they are: `#13203a` for *Your task*, `#122a3d` for *Learn*, `#0b1322` for the
editor, `#0a1120` for the gutter and the output, `#101c31` for the two strips.

The seven Python token colours are the screen palette, unchanged.

**Colour is never the only signal.** Prescribed data in a sentence is boxed and
monospace as well as coloured, as on paper. A passed test carries ✓ and a failed
one ✗ as well as a border colour. A stage is named in words.

`tools/tests/smokevrcomfort.py` measures each colour against the surface behind
it. Everything clears 4.5:1 except a comment at 3.67:1, which is dimmed on
purpose and is the page's own value.

## Where the two surfaces hang

One anchor is taken from the pupil's gaze when a question opens. Nothing follows
the head afterwards. **✛ Recentre**, in the title bar, retakes it and moves the
screen and the keyboard together.

| | distance | pitch | size | across |
|---|---|---|---|---|
| **the screen** | 2.05 m | +4° | 2.90 m wide, 1.79 m tall | 70.5° wide, −20° to +28° |
| **the keyboard** | 1.80 m | −33° | 2.50 m wide | −44° to −22° |

Nothing is to the side, nothing is nearer than 1.8 m, nothing is above +28° or
below −44°. A pupil mostly moves their eyes.

The panorama directly behind the screen is dimmed by a plane 22% wider than it,
at 62% opacity — the page blurs and darkens the scene behind an open question
for the same reason. The room is visible around every edge, and is not replaced.

## Type, and how big it ends up

The screen is drawn in the page's own pixels, so a size here is the size on the
page. What matters is the angle it subtends: at 2.90 m wide over 1397 px at
2.05 m, **one layout pixel is 0.058°**.

| what | on the page | in the headset | about |
|---|---|---|---|
| a numbered step | 17 px | 0.99° | ~25 Quest pixels |
| body text, the brief, *Learn* | 15–16 px | 0.87–0.93° | ~22 |
| the program in the editor | 15 px | 0.87° | ~22 |
| a heading (YOUR TASK, PROGRAM OUTPUT) | 13–14 px | 0.75–0.81° | ~19 |
| the smallest thing drawn | 12 px | 0.70° | ~18 |

`smokevrcomfort.py` fails below 0.55°, and reports the body-text figure on every
run.

## Targets

Every control on the screen is painted at the page's size and given a hit area
**14 layout px larger on each side**, so the picture matches the page and the
target does not have to. A keyboard key is at least 2.15° across. Hover is drawn
as a ring around the control, never colour alone, and pulses the controller for
12 ms.

A disabled control is still a hit area, marked disabled: Run while Python
downloads, the way on before an activity is finished. Leaving it out of the list
would say the control does not exist.

**Pointing anywhere in the editor puts the caret there.** When a screen opens on
a *Complete it*, the caret lands just past the `____` gap, where a Backspace
takes the gap out.

## The keyboard, and nothing else on it

Seven rows of characters, then one row of controls: Shift, Space, Tab, the four
arrows, Line start, Line end, Clear line, Back, Enter.

Which characters it must carry is not a judgement. `tools/vrkeys.py` reads every
starter, model solution, worked example, hint and required technique in the
course and fails if one of them cannot be typed. 87 are needed; 98 are there.

**Run, Check my answer, Hint, Syntax reminder, Read aloud and I need help are
not on the keyboard.** They are on the screen, in the places the page puts them.
The keyboard is for typing.

A paired physical keyboard types into the editor as well, where the browser
delivers the events. Nothing requires one, and whether Oculus Browser delivers
them to an immersive page is **not known** — `docs/VR-HEADSET-QA.md` asks for it
rather than claiming it.

## Panes, not panels

The hint, the help and the syntax reference open **over the window**, filling it,
the way the page lays `.hintpane` over `#box`. The program is behind, exactly as
it was left. They are not separate floating panels and must not become any.

## Feedback states

| state | how it reads |
|---|---|
| Python loading | the status line beside Run says what it is downloading and how long it has been; Run and Check are held back; **the hint, the example and the help are not** |
| Python failed | inside the window: what has *not* happened, the thing to check, a code to report, and Try again · I need help |
| running | `Running…` in the same place |
| a test passed | ✓ and `--ok` on that row, in the left column under the reading |
| a test failed | ✗ and `--bad`, with what it expected and what ran |
| finished | ✓ Nice work, the technique named, and the way on appears |
| not finished | the escalating line, and the way on in its place, visible and not available |

## Comfort

- One anchor per question. Nothing follows the head. **✛ Recentre** is the only
  thing that moves the workspace, and it moves both surfaces together.
- Nothing nearer than 1.8 m.
- Turning is snap, 30° a press, never continuous.
- A toast raised while the screen is open goes *below* the keys.
- The menu button drops to −74° while the screen is open, clear of the keys.
- Seated use throughout. Nothing requires standing, reaching or turning round.

## What this replaced, and must not come back

An earlier version broke the interface into five floating panels at different
depths: the task above, the worked example and the marking to one side, the
program ahead, the controls on the keyboard. It contained the same information
and it was the wrong design — it read as a VR utility rather than as Revise 360.

`tools/tests/smokevrcomfort.py` and `tools/tests/smokeparity.py` both fail if any
other panel is open beside the screen and the keyboard, and
`tools/tests/sidebyside.py` exists so the question "does this obviously look like
the same interface?" can be answered by looking.
