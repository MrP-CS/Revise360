# The code question bank

One file per lesson. Each is:

```json
{
  "lesson": "pr-l03",
  "title": "Making decisions",
  "stations": ["Comparing two values", "if and else", ...],
  "questions": [
    {
      "id": "pr-l03-q1",
      "station": 0,
      "marks": 2,
      "q": "One sentence saying what to write.",
      "brief": ["Read one whole number.", "Print: big - if it is over 100.", "Otherwise print: small"],
      "starter": "# Read a number and decide\n",
      "tests": [
        { "in": ["150"], "out": ["big"], "why": "Over 100." },
        { "in": ["100"], "out": ["small"], "why": "Exactly 100 is not over 100 - check < against <=." }
      ],
      "fb": "One sentence of teaching, shown after marking."
    }
  ]
}
```

## Kinds of activity

A technique is not taught by one question. It is released in stages, and `kind`
says which stage an activity is. The pupil is shown the stage in words, so a
task to be run is not read as a task to be judged. `kind` defaults to `build`,
which is what every question in the bank was before this field existed.

| `kind` | Shown as | What the pupil does | Marked by |
|---|---|---|---|
| `try` | Try it | runs a working program and watches it | pressing Run without an error |
| `predict` | Predict | says what a program will display | choosing from `a`, correct first |
| `change` | Change it | alters one thing in a working program | the tests |
| `complete` | Complete it | fills a gap in a part-written program | the tests |
| `debug` | Fix it | finds and fixes a mistake | the tests |
| `build` | Build it | writes the program | the tests |

`try` carries no `tests`: the code to run is the `starter`, and `in` holds any
lines typed in. `predict` carries no `starter` or `tests` either - it has `code`
(the program, as lines), optional `in`, and `a` (the options, the right one
first; the player shuffles them). Everything else is an ordinary code question
whose `starter` differs: working code for `change`, a gap for `complete`, a
mistake for `debug`, a comment or nothing for `build`.

The stage names never say how able a pupil is. There is no easy, medium or hard
in this course, in the data or on the screen.

## Core and stretch

`"opt": true` marks an optional challenge. It is offered at the end of a
station, it can be skipped without finishing the station, and until a pupil
attempts it, it counts towards neither their mark nor their total. A challenge
should need deeper thinking, not merely more typing.

## Hints are a ladder

`hint` is either the name of a diagram, as it has always been, or a ladder of
rungs revealed one press at a time:

```json
"hint": {
  "think":  "You need the same two lines to happen five times.",
  "syntax": "for i in range(...):",
  "start":  ["for i in range(5):", "    # the line to repeat goes here"],
  "walk":   ["Count how many times it must happen.", "Put that number in range()."],
  "diagram": "pyloop"
}
```

Every rung is optional. No rung is ever the answer to the question it sits on:
`start` shows the shape with the question's own values left out, and `diagram`
animates the technique on different data.

## Line-by-line explanations

`lines` is one plain-English sentence per line of `teach.code`, in order, with
`""` for a line not worth explaining. The player folds it away behind "What each
line does", so the example is not buried under prose about it.

## Model solutions live outside the repository

A worked program is answer-sheet material and this repository is public, so the
bank holds no solutions. Each lesson has a matching file in `answers/codebank/`,
which git ignores — the same place the teacher answer sheets are built into:

```json
{ "lesson": "pr-l03", "solutions": { "pr-l03-q1": "n = int(input())\n..." } }
```

A solution is required for every question that is marked by tests — it is what
proves the question can be answered — and the checks below name any that is
missing. A `try` or `predict` activity needs none: its code is in the bank
already, and what proves it is that real Python agrees with it. Keep that folder
with the teacher keys, not in a clone.

## How a question is worded

One to three flowing imperative sentences, in this order:

1. what to **ask** for, in the order it is typed in;
2. what to **work out**;
3. what to **display**, stated as a template with the varying parts in square
   brackets — "display the answer as `Total is [total]`".

Separate lines of output must be named as separate lines ("on the next line",
"one on each line"): the marker distinguishes them, and not saying so was the
commonest defect found when this pattern was applied. Where a value is fixed in
the program rather than typed in, the sentence says so.

`brief` carries only what the sentence cannot: tie-breaks, boundary cases, a
forbidden method, a file that must already exist, exact spacing. One to three
bullets, and never none.

Four output shapes cannot be a bracketed template, and are written out instead:
a list printed as itself (the brackets are literal output), "display the whole
of the file", the rows a SQL query returns, and repeated snapshots of one list
during a sort.

## Rules

- **Two tests minimum**, and they must not all expect the same output, or a
  program that prints one constant answer scores full marks.
- **`brief` says exactly what to print.** Output is compared with leading and
  trailing space, repeated spaces and capitals ignored, and nothing else.
- **`why` on a failing test is the teaching.** Say what the pupil probably did,
  not just what was wanted.
- At least one test should catch the usual mistake for that technique - the
  boundary, the empty case, the off-by-one.
- `forbid` only where running the code cannot tell: "write the sort yourself"
  looks identical to `sorted()` from outside. Never for style.
- `require` is its opposite, and has the same one use: a technique the output
  cannot show. A program told to pick a random number between 4 and 4 is
  indistinguishable from one that prints 4, so that question requires
  `random.randint`. Same shape as `forbid` — `[["random.randint", "This one has
  to use random.randint."]]` — and the message is what the pupil is shown.
  verifycode refuses a question whose own model solution lacks what it requires.

## Checking

```
python3 verifycode.py            # all of them
python3 verifycode.py pr-l03     # one lesson
```

It runs the model solution against every test, then checks a constant-output
program and an empty program both fail. A question that passes all four checks
is answerable and cannot be guessed.

The newer kinds get checks of their own, for the faults only they can have:

- a `predict` option list is run through real Python, and the answer the bank
  claims is right has to be what Python actually displays — a wrong answer here
  would teach the wrong thing with total confidence;
- no two options may normalise to the same text, or a pupil can be right and be
  marked wrong;
- a `try` program must run without an error;
- a `change`, `complete` or `debug` starter must **fail** at least one test. A
  starter that already passes means there is nothing to change, nothing to fill
  in or nothing to fix, and the pupil gets the mark for pressing Check.

## Originality

Every question here is written for this platform. Tasks are built from the OCR
J277 specification's list of programming techniques, not from any textbook, and
the contexts, wording and test data are our own.

`tools/qcorig.py` proves it against a reference rather than asserting it:

```
python3 ../qcorig.py ~/somebody-elses-book.pdf
```

It prints any run of six words our content shares with that reference. Judge
each by eye — "at the end of a line" is ordinary English, a whole sentence is
not.
