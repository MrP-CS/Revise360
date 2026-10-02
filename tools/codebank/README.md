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

## Model solutions live outside the repository

A worked program is answer-sheet material and this repository is public, so the
bank holds no solutions. Each lesson has a matching file in `answers/codebank/`,
which git ignores — the same place the teacher answer sheets are built into:

```json
{ "lesson": "pr-l03", "solutions": { "pr-l03-q1": "n = int(input())\n..." } }
```

A solution is required for every question — it is what proves the question can
be answered — and the checks below name any that is missing. Keep that folder
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

## Checking

```
python3 verifycode.py            # all of them
python3 verifycode.py pr-l03     # one lesson
```

It runs the model solution against every test, then checks a constant-output
program and an empty program both fail. A question that passes all four checks
is answerable and cannot be guessed.

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
