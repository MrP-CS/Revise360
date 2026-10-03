# Prescribed data in a Python instruction

A task that says

> Change the program so it remembers 25 instead of 10.

is asking for two exact values, and in a sentence they look like any other two
words. A pupil who misreads one writes a program that is nearly right, is marked
wrong, and cannot see why. The same sentence now reads

> Change the program so it remembers `25` instead of `10`.

with the `25` in exactly the amber they are about to see in their own editor. The
point is recognition, not decoration: one value, one colour, wherever it appears.

## Where the colours live

`css/pytok.css` is the only place the seven token colours are written down.

| kind | means | example |
|------|-------|---------|
| `k` | keyword | `if`, `for`, `while`, `def`, `True` |
| `b` | built-in | `print`, `input`, `int`, `len`, `range` |
| `s` | string | `"Alex"`, `'007'` |
| `n` | number | `25`, `3.5` |
| `c` | comment | `# like this` |
| `o` | operator | `=` `+` `(` `)` `:` `,` `[` `]` |
| `t` | a name, or ordinary text | `score`, `total` |

Everything that shows Python to a pupil reads from that file: the highlighter
behind the editor's textarea, the worked examples, the inline data in a task, the
headset's painted panels (through `R360Tok.colours`, which reads the custom
properties), the Exam Reference Language boards in `js/algo.js`, and the print
builders (through `R360Tok.palette("print")`, which reads the `@media print` half
of the same file).

`@media print` holds a second set of values for the same seven kinds, tuned for
dark ink on white paper. The kinds, the classes and the box do not change there;
only the ink does, so a worksheet and the screen still teach the same
distinction. `#9fe6a0` on white is unreadable, and a projector is a sheet of
paper that glows, so the slides use the print palette too.

`tools/tests/smoketok.py` fails if a second copy of the table appears anywhere in
the repository. Four of the seven colours have no counterpart in the site's brand
palette, so any real copy of the table holds some of them; a file holding only
`--fg`, `--soft` or `--line` is using the brand colour, not copying the table.

## One lexer

`js/pytok.js` is the only thing that splits Python into tokens.

```
R360Tok.lex(src)      -> [{ t, k }]    k is one of k b s n c o t
R360Tok.html(src)     -> <span class="k|b|s|n|c|o|t"> …
R360Tok.inline(src)   -> <code class="pytok"> … </code>
R360Tok.rich(text)    -> a sentence with `backticks` turned into inline code
R360Tok.plain(text)   -> the same sentence with the backticks removed
R360Tok.colours       -> { k: "#…", … } read from the stylesheet
```

It runs in the browser (`window.R360Tok`) and in node (`require`), which is how
`tools/wsgen.js` and `tools/deckgen.js` colour a worksheet and a slide with the
same split as the screen. There used to be two lexers — one producing HTML for
the editor and one producing data for the headset — and they had already begun to
disagree: the data one had quietly lost triple-quoted strings.

## How the marking is authored

A value is marked in the bank with backticks, in the form it has in the program:
a string with its quotes, a number bare, a name bare.

```json
"q": "Change the program so it remembers `25` instead of `10`.",
"brief": ["The `100` is written into your program in one place only."]
```

The marked fields are `q`, `brief`, `fb`, `hint.think` and `hint.walk`.
`hint.syntax` and `hint.start` are whole code blocks already and carry no
backticks. Neither does `teach`: the worked example uses different data on
purpose, and a box in the sentence beside it would say the example's values were
the required ones.

Nothing reads the sentence to decide what is data. `tools/markdata.py` did the
one-off marking from the authority — the model solution in `answers/codebank/`,
the starter, the `CREATE TABLE` line a SQL question hands over, and the typed
values of the tests — and only marked a value the program actually contains,
where it appears verbatim. Guessing from the prose gets it wrong in both
directions, and a pupil who cannot trust the boxes stops reading them:

- `Display both when both are above 0` — the first "both" is the word to
  display, the second is the sentence talking about two numbers.
- `A member pays 5 when under 16` — "member" is a value elsewhere in the same
  question and an ordinary noun here.
- `which you met in lesson 2` — a cross-reference, not a value.
- `two whole numbers` in a question that also declares a function called
  `whole`.

`markdata.py` is idempotent: running it again marks nothing new. It is kept in
the repository because it is the record of how the marking was derived, and
because new questions can be run through it.

### Deliberate omissions

Four kinds of value are left unmarked, and each is a decision rather than a gap.

1. **A brief line that states the required output verbatim** — "Display exactly:
   Goodbye". The marked form of a string carries its quotes, and `Display
   exactly: `"Goodbye"`` would teach a beginner that the quotation marks come out
   of `print()`. The sentence in `q` carries the marked form, and the "One run of
   your program" panel above shows the output as the pupil will see it. Both
   forms are on the page, each in its own place and labelled — which is exactly
   the distinction beginners need.
2. **Part of a required output line** — "displays Score: 10" prescribes the whole
   of `Score: 10`, and a box round the `10` alone says the `Score:` part is
   ordinary prose. No box is better than half of one.
3. **A run of three or more numbers where only some are known** — "Display the
   numbers 1, 2, 3, 4, 5 and 6" is a listing of the output, and boxing whichever
   of them the answer happens to contain says the 2 and the 4 are optional. Both
   ends of a range, or neither: a program that counts 1 to 5 is written
   `range(1, 6)`, so the 6 is a known value and the 5 is not.
4. **A `[placeholder]`** — the course already writes a value it is describing
   rather than giving in square brackets, and a box inside one would say the
   opposite of what the brackets mean.

## Colour is never the only signal

Inline data is boxed and monospace as well as coloured, because the box is what
carries "this is the exact data" on a black-and-white printout, in a
high-contrast mode, and to anyone who does not separate green from amber. Most of
these worksheets are handed out in black and white.

The markup never reaches a pupil. A screen reader hears the sentence in order
with the value in its place and no notation in it, because the backticks become
elements rather than text; nothing marked is `aria-hidden`; and the read-aloud
button speaks `R360Tok.plain()`, since a voice reading "store backtick 25
backtick" would be worse than no voice at all.

## What keeps it honest

| check | what it fails on |
|-------|------------------|
| `tools/verifytok.py` | a box that is not valid Python; a box holding something that is nowhere in the answer or the starter; an unclosed or empty box. It also lists sentences where a value is named unboxed beside boxed ones, for a human to look at — there are honest reasons for that, so it does not fail the build unless `--strict` is passed. |
| `tools/tests/smoketok.py` | a second copy of the palette; a value a different colour in the instruction than in the editor; two token kinds sharing a colour; `"007"` read as a number; backticks reaching the page; data that is coloured but not boxed or not monospace; the headset painting from a different table; a worked example left as grey text. |

Both were validated by breaking the thing they watch and confirming they said
so: a wrong value, a box that is not Python, an unclosed box and an empty box for
`verifytok.py`; an instruction given its own number colour and a renderer put
back to plain escaping for `smoketok.py`.

## What this does not cover

The station walls of a 360° experience are **painted into the image**, so their
bullets, names and the intro carry no markup — changing them means a re-render,
and a backtick would appear in the picture as a backtick. Those walls teach the
technique; they do not prescribe data, so there is nothing there to mark. The
build checks it: no painted string in any `experiences/pr-l*.json` contains a
backtick.

The PY slide decks carry teaching bullets and exam practice rather than the
task instructions, so the marked data that reaches a slide today is the Python
quoted inside an exam question (`n = input()`, `for i in range(1, 6)`,
`SELECT Title FROM Game …`). The renderer handles any marked field it is given;
there is simply less marked content on that surface than on the other two.
