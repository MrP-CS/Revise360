# Testing this on a real headset

Everything in this repository's automated suite runs in Chromium against an
emulated WebXR device. **None of it is evidence that Python works on a Quest.**
The emulator even spoofs the user agent as a Quest 3 running Oculus Browser,
which is why `R360Py.diagnostic()` reports `device: "emulator"` when it is one
and `pydiag.html` says so on the page in red. A report that could pass for a
real headset test is worse than no report.

This is the part only a headset can answer. It takes about forty minutes.

## Before you start

Write these down; a result without them cannot be acted on.

```
HEADSET MODEL      e.g. Meta Quest 3, 512 GB
BROWSER VERSION    Settings -> About, or go to about:version
DATE
BUILD / COMMIT     the ?v= on the scripts, shown by pydiag.html, and `git rev-parse --short HEAD`
NETWORK            school WiFi / home / hotspot
```

## 1. Python, before anything else

Open **`revise360.co.uk/pydiag.html`** on the headset and press **Run the
checks**. This walks the whole chain a step at a time and keeps the real error
rather than a guess at it.

| | record |
|---|---|
| which step it stopped at, if any | |
| the message under that step, word for word | |
| the code at the bottom (`PY-…`) | |
| how long the 9.6 MB download took, and at what rate | |
| the total | |

Then press **Enter VR and run them again**, which runs the same checks from
inside an immersive session — the brief asks specifically whether the worker
behaves differently while immersive.

| | record |
|---|---|
| did entering VR work from the button press | |
| which step it stopped at, if any | |
| the message | |
| the total, against the flat run | |

Press **Copy the report** and send it on. It carries no pupil name, no program
and no path.

**If anything fails here, stop and report it.** Nothing below will work and the
step that failed is the answer.

## 2. The five lessons

For **Python lessons 1, 3, 6, 10 and 13**, sign in as a test pupil and work
through at least the first station of each. Mark each line pass or fail, and
write what you saw when it is not a pass.

```
L1  L3  L6  L10 L13
[ ] [ ] [ ] [ ] [ ]  Enter VR from the button, first press
[ ] [ ] [ ] [ ] [ ]  The panorama loads and is sharp enough to read the walls
[ ] [ ] [ ] [ ] [ ]  Python is already ready, or says what it is doing, by the first code question
[ ] [ ] [ ] [ ] [ ]  A code question opens from its badge
[ ] [ ] [ ] [ ] [ ]  The starter code is there, and is what the computer shows
[ ] [ ] [ ] [ ] [ ]  Keywords, strings, numbers and comments are the colours they are on the computer
[ ] [ ] [ ] [ ] [ ]  The task reads as numbered steps, with the values boxed - no backticks anywhere
[ ] [ ] [ ] [ ] [ ]  Look up: the stage, the steps and the brief. Look left: the example. Look down: the keys
[ ] [ ] [ ] [ ] [ ]  Every key types what it shows, including ? \ : " and _
[ ] [ ] [ ] [ ] [ ]  Enter keeps the indentation, and adds one after a colon
[ ] [ ] [ ] [ ] [ ]  Run works, and the output is readable without leaning in
[ ] [ ] [ ] [ ] [ ]  A program that asks for input gets what ONE RUN OF YOUR PROGRAM says it gets
[ ] [ ] [ ] [ ] [ ]  Check works, and lists every test with what it expected
[ ] [ ] [ ] [ ] [ ]  A wrong answer does NOT offer the next question
[ ] [ ] [ ] [ ] [ ]  The hint gives one rung at a time, and the last one plays the diagram
[ ] [ ] [ ] [ ] [ ]  I need help says to ask the teacher and that the question still has to be done
[ ] [ ] [ ] [ ] [ ]  Correct code finishes it, and the next question appears
[ ] [ ] [ ] [ ] [ ]  Close, reopen: the program is still there
[ ] [ ] [ ] [ ] [ ]  ✛ Recentre moves the whole workspace and keeps the program
[ ] [ ] [ ] [ ] [ ]  Exit VR: the same program and the same marks are on the screen
[ ] [ ] [ ] [ ] [ ]  Re-enter VR: it resumes where it was
```

Lesson 10 writes to a file and lesson 13 uses SQL, so those two are where a
missing character or a long traceback would show up.

## 3. When things go wrong

| | record |
|---|---|
| Turn the WiFi off, then open a code question. Does it say Python could not start, give a code, and offer Try again? | |
| Turn the WiFi back on and press Try again. Does it come up without leaving VR? | |
| Half-type a program, pull the WiFi, close and reopen the question. Is the program still there? | |
| Reload the page mid-question. Is the program still there? | |
| Put the headset down for five minutes, pick it up. Does the session resume or end cleanly? | |
| Leave immersive mode and re-enter twice. Does Python still work? | |
| Open and close a code question ten times. Does it get slower? | |

## 4. Comfort and reading

Not a tick box: write a sentence each.

- Is anything too close to your face?
- Is anything at a neck angle you would not hold for a lesson?
- Can you read the console output without leaning forward?
- Do the keys hit where you point?
- Does anything follow your head when it should stay put?
- Seated for twenty minutes: anything that would stop a class doing it?

## 5. Performance, on the device

In the headset browser, with the lesson open, note:

| | record |
|---|---|
| seconds from opening the lesson to Python being ready | |
| seconds from choosing a code question to being able to type | |
| whether the 360 scene stutters while Python downloads | |
| whether it stutters while a program runs | |

`tools/tests/pyperf.py` gives the same two numbers on a build machine over
loopback, which is the floor, not the expectation.

## 6. Physical keyboard, if you have one

Pair a Bluetooth keyboard and open a code question in VR.

| | record |
|---|---|
| Do key presses reach the editor while immersive? | |
| If not, does the drawn keyboard still work normally? | |

**Nothing in the course requires one.** If the browser does not deliver key
events to an immersive page, say so here and the claim comes out of
`docs/VR-DESIGN-SYSTEM.md` — it is written as untested, not as working.

## What to send back

The filled-in header, this sheet, and the JSON from **Copy the report** for both
`pydiag.html` runs. For anything that failed: which lesson, which question, what
you did, what happened.

## The automated suite, and what it does not cover

| check | what it is |
|---|---|
| `tools/tests/smokeparity.py` | every Python activity, opened on both interfaces, compared |
| `tools/tests/smokevrcode.py` | writing, running, marking and the hint ladder in a session |
| `tools/tests/smokepyfail.py` | the runtime blocked at the network, and the way back |
| `tools/tests/smokedraft.py` | a program typed on one and found on the other |
| `tools/tests/smokegate.py` | no route past an unfinished question |
| `tools/vrkeys.py` | every character the course needs is on the keyboard |
| `tools/tests/pyperf.py` | the two waits, on a build machine |

All of them run against an emulator in Chromium on x86. They catch regressions.
They say nothing about Quest CPU, Quest memory, Quest texture limits, Oculus
Browser's own behaviour, school network filtering, or whether the lettering is
legible through a lens. That is what this sheet is for.

## Results

Record each run here, newest first.

| date | headset | browser | build | result |
|---|---|---|---|---|
| | | | | *no real-headset run has been recorded yet* |
