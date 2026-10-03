# One identity across five formats

A pupil meets this course as a 360° room, a worksheet, a slide on a board, a PDF
guide and a printed lesson plan. Those are made by five different generators in
three languages. The thing that has to hold is that they look and read like one
course — and, where they show the same value, that they show it the same way.

## Where each thing is decided, once

| what | the one place | read by |
|---|---|---|
| Python token colours | `css/pytok.css` | the editor, the worked examples, the inline data, the headset, the Exam Reference Language boards, `wsgen.js`, `deckgen.js`, `pdfkit.py` |
| how Python splits into tokens | `js/pytok.js` | the same, in the browser and in node |
| what an activity is worth | `kit.task_marks` and `Store.marks` | the scene builder, the worksheets, the records, the player — and `smokemarks.py` fails if the two disagree |
| the A4 page: fonts, type scale, colours, margins | `tools/pdfkit.py` | the printed guides, the lesson plans, the unit documents |
| the brand palette and type | `css/style.css`, `css/rebrand.css`, `BRAND.md` | every page |
| what the course contains | `build/inventory.json` | everything downstream |
| what a lesson is | `build/records/<id>.json` | the plans, the unit documents, the packs |

`tools/tests/smoketok.py` fails if a second copy of the token table appears
anywhere in the repository. It has caught this twice: once in `js/algo.js`, which
had the whole table, and once in the homepage CSS, which had four of the seven.

## The seven token kinds

| kind | means | screen | paper |
|---|---|---|---|
| `k` | keyword | `#c792ea` | `#6b21a8` |
| `b` | built-in | `#7fb2ff` | `#1d4ed8` |
| `s` | string | `#9fe6a0` | `#15803d` |
| `n` | number | `#ffcb6b` | `#9a3412` |
| `c` | comment | `#5d7290` | `#52525b` |
| `o` | operator | `#b4c4dc` | `#3f3f46` |
| `t` | a name, or ordinary text | `#f0f4fa` | `#18181b` |

Two sets of values, one set of meanings. The screen palette is for a dark editor;
the paper palette is for anything printed and for a light page of the site, which
opts in with `class="on-light"`. `#9fe6a0` on white is unreadable, and a projector
is a sheet of paper that glows, so the slides use the paper palette too.

## Required data in an instruction

The rule: when a task tells a pupil to use a specific value, that value is shown
as what they will type, in the colour they will see it in.

```json
"q": "Change the program so it remembers `25` instead of `10`."
```

Backticks in the authored content; the renderer turns them into
`<code class="pytok">` with one `<span>` per token. `docs/PRESCRIBED-DATA.md` has
the full rules, including the four kinds of value that are deliberately left
unmarked and why.

**Identifiers, values, examples and placeholders are told apart like this:**

| what | how it is written | how it looks |
|---|---|---|
| a value to use | `` `25` ``, `` `"Alex"` `` | boxed, monospace, in its token colour |
| a name to create | `` `total` `` after "called" or "named" | boxed, in the plain-name colour |
| a placeholder | `[the count]`, `[word]` | square brackets, left as prose, never boxed |
| a worked example | the `teach` block | a `<pre>` block, never inline, with different data from the task on purpose |
| required output | the "One run of your program" panel | its own labelled panel, not boxed in the sentence |

Colour is never the only signal. Inline data is boxed and monospace as well as
coloured, which is what carries it on a black-and-white printout, in a
high-contrast mode, and to a pupil who does not separate green from amber. The
markup never reaches a pupil: a screen reader hears the value in its place, and
the read-aloud voice speaks the sentence without it.

## Format-specific rules

**The 360 scene.** Station names, wall bullets and the intro are **painted into
the image** at render time. Changing one means re-rendering (about 18 seconds a
face). Nothing with markup in it may go there, and the build checks that no
painted string in any `experiences/*.json` contains a backtick. Information
markers (`info`) are runtime JSON and can be changed freely.

**The task window.** Half and half: everything to read on the left, the editor and
its output on the right, so a long task never squeezes the program and a long
program never hides the task. Text is 16px or larger throughout. When a question
does not fit, the column scrolls — it does not shrink its type. That trade was
made deliberately: readability beats fitting.

**The worksheet (.docx).** A4, Arial, built by `tools/wsgen.js` with the `docx`
package. Marked data becomes a monospace run in the paper ink with a light
shading box. Everything a pupil writes has ruled space; nothing is printed that
the editor does the job of.

**The slide deck (.pptx).** 13.33 × 7.5 inches, IBM Plex, built by
`tools/deckgen.js` with pptxgenjs, from a spec derived from the same lesson source
as the scene. Light background: it is for a projector. Teaching notes under each
slide; no answers on the slides a class is looking at.

**The PDFs.** A4 with 14/13 mm margins, IBM Plex embedded, built as HTML and
printed by the same browser that renders the site. Selectable text, real headings,
page numbers, and the same legal line at the foot of every document.

## The house voice

Plain words, short sentences, and nothing a teacher would have to decode. A
limitation is stated where it matters rather than in a footnote: the lesson plan
says progress is kept on the device, the unit guide says the same, the dashboard
says it on the page. Where a resource cannot do something, it says so in the place
the thing would have been — "Not in the lesson record: key vocabulary" — rather
than filling the space with a sentence that would be true of any lesson.

Nothing claims an outcome the product has not been shown to produce. The pedagogy
documents cite the teaching research and then say, in as many words, that no trial
of Revise 360 has been run and that immersion is not claimed to improve learning
by itself.
