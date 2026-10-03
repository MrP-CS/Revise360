# The revision question bank

629 questions, 1,203 marks, eleven topics. Authored as Python in
`tools/revbank/`, built into `revision/` by `tools/mkrevision.py`, and never
edited in its built form.

## Why it is authored in code

Because the answers are worked out rather than typed. A conversion question is
written as the value and the two bases; `tools/revkit.py` computes the answer, and
`tools/revverify.py` computes it again with its own code and compares. Nobody has
read 181 binary patterns to check them, and nobody needs to.

The same applies to truth tables, binary addition, shifts, numeric calculations
and trace tables. Where a question's answer can be derived, the author gives the
inputs and never the answer.

## Building

```bash
cd tools
python3 mkrevision.py --write      # revbank/*.py -> revision/
python3 revcoverage.py --write     # -> docs/REVISION-QUIZ-COVERAGE.md
```

`mkrevision.py` writes `revision/manifest.json`, one file per lesson under
`revision/<topic>/`, and updates `revision/ids.json`. It refuses to build when two
questions share a stem, across every module and not only within one.

The build prints the balance of question families, which section 8 of the spec
puts ranges on. It is a report, not a gate: `tools/revqa.py` is where a band
outside its range is called out.

## The files

| file | what it holds |
|---|---|
| `tools/revbank/t<topic>.py` | the questions for one topic, hand written |
| `tools/revbank/t<topic>_more.py` | more of the same topic, where one file got long |
| `tools/revbank/t12_drill.py` | the generated drill — conversions, addition, shifts, file sizes |
| `tools/revkit.py` | the constructors every question is built with |
| `tools/revschema.py` | the types, the families, the balance ranges, and loading the bank |
| `tools/mkrevision.py` | the build |
| `revision/ids.json` | the number every question was first given, so ids never move |

A module is any `t*.py` in `tools/revbank/` with a `TOPIC` and a `BANK`. Several
modules may share a topic; their questions land in the same per-lesson files.

## Writing a question

A question belongs to a subtopic, and the subtopic — not the question — says which
station of which lesson taught it:

```python
sub("Binary shifts", "ms-l10-s1", ["ms-l10-o1", "ms-l10-o2"], [
    binshift("Shift 00001011 two places to the left. Give your answer in 8 bits.",
             "00001011", 2, "left",
             fb="Every bit moves two places left and zeros fill in behind. "
                "A left shift of 2 multiplies the number by 4.",
             bits=8, diff="apply"),
])
```

The station id is checked against `revision/stations.json` and a station in the
wrong unit is a build error. `tools/revschema.py` fills in the lesson, the scene
and the station number from that file, so a question's "revisit this" link is
derived from the course's own records rather than written twice.

### The constructors

| family | constructors |
|---|---|
| recognition | `mcq`, `tf`, `multi`, `match`, `order`, `sort` |
| written | `short` (1 mark), `written` (2 to 4), `extended` (self-reviewed) |
| computed | `num`, `convert`, `binadd`, `binshift`, `truth`, `trace`, `codeout` |

`order`, `sort` and `match` cap at six items, because a nine-item ordering is a
nine-mark question by accident.

`num` requires `working` — the arithmetic as an expression — and evaluates it. A
calculation whose stated answer disagrees with its own working will not build.

### Mark points

A written question is a list of mark points, each one a concept and the ways a
learner might express it:

```python
written("Explain why validation cannot guarantee that the data entered is correct.", 2,
        [mp("validation only checks that the data is possible or sensible",
            ["sensible|possible|reasonable|allowable|valid|within range"],
            exemplar="Validation only checks that the data is possible."),
         mp("a user can still enter something possible but untrue",
            ["still|could|can|might",
             "wrong|untrue|not true|false|lie|not their|made up"],
            developed=True,
            exemplar="So a user can still type a date of birth that is possible "
                     "but not theirs.")],
        example="...", paraphrase="...", fb="...")
```

Read the arguments carefully, because the shape is easy to get wrong:

- **Each positional argument after the concept is a WAY**, and a way is a list of
  groups. `mp(c, [a], [b])` means "either a or b". `mp(c, [a, b])` means "both".
  Writing the first where the second was meant is the commonest authoring fault in
  this bank — it has been found seven times, always by a probe marking an
  unrelated sentence as correct.
- **Within a group, `|` separates alternatives**, and one of them is enough.
- **A pattern is a phrase, not a regex.** Up to two words may sit between its
  words, so "lose contents" matches "loses its contents".
- **A pattern may not be made of the words the marker splits an answer on**
  (`and`, `or`, `but`, `that`, `which`, `then`, `while`…), and may not be one of
  those words qualifying a single word: "which line" silently becomes "line", and
  `revkit` refuses it with that explanation.
- **`developed=True`** means the answer has to show a chain — a connective
  somewhere in it. The exemplar for such a point needs one too, or the point can
  never be earned by the exemplar alone, which the probes will say.
- **`exemplar`** is one sentence that earns this point and nothing else. It is not
  decoration: the probe suite marks it on its own, and that is what makes the
  partial-credit claim real. An exemplar that states its concept twice, in two
  ways the point accepts, cannot be tested under negation — negating one half
  leaves the other standing. Nine of them did; all nine were found and rewritten.
- **`example`** is the full-mark model answer, and `paraphrase` is the same answer
  in different words. Both are marked by the probe suite and both must earn full
  marks.

### What the patterns must not be

A group that is loose enough to match an unrelated sentence will be found by the
irrelevant probes, which mark every written question against two sentences that
correctly answer questions in other topics. Ten mark points in this bank have been
tightened because of them. The recurring shapes:

- a single very common word — `control`, `structure`, `data`, `error`, `half`,
  `send`, `removes` — standing alone as a group;
- a word that stems to something else: `entire` and `entered`, `tested` and `the
  test`, `sort` and `short`;
- a comparison word with nothing to anchor it: `permanent` matched "permanently
  removes data".

The fix is almost always a second group rather than a shorter list.

## Generated questions

`tools/revbank/t12_drill.py` generates the families where generating is honest: a
conversion, a binary addition, a shift and a file-size calculation are one skill
applied to different numbers, and fluency comes from doing a lot of them. 181 of
the bank's questions are computed, and every one of their answers is derived and
independently recomputed.

Deliberately not generated: anything asking why. There is no honest way to produce
two hundred different "explain why virtual memory slows a computer down"
questions, and a bank padded with reworded ones would be worse than a smaller one.
Section 82's count is a target, not a licence — see the note on the final count at
the end of `docs/REVISION-QUIZ-QA.md`.

`tools/revdupes.py` separates deliberate parameterised drill from real
repetition. It groups questions by shape — same wording, different numbers — and
reports them for a person to look at rather than failing. The report is read every
time the bank changes; it has caught a drill value that happened to repeat a hand
written question exactly, and four row-counting questions of one shape spread
across two subtopics.

## Ids

A question's id is `rq-<topic>-<subtopic slug>-<number>`, and the number comes
from `revision/ids.json`, keyed by the hash of topic, type and stem. Editing a
question's options, its feedback or its subtopic keeps its id; changing its stem
gives it a new one. Numbers are never reused, so a learner's stored progress never
points at a different question than the one it was earned on.

## Adding a topic

1. Write `tools/revbank/t<topic>.py` with `TOPIC` and `BANK`.
2. `python3 mkrevision.py` until it builds.
3. `python3 revqa.py` until the bank is sound.
4. `python3 revwritten.py --topic <topic>` until every probe passes. Expect to be
   told that your patterns are wrong; that is what it is for.
5. `python3 revverify.py` to recompute every derived answer.
6. `python3 revdupes.py` and read what it reports.
7. `python3 revcoverage.py --write` and look at what it says nothing asks about.
8. `python3 mkrevision.py --write`.

Step 4 takes the longest and finds the most. The first run of a new topic has
reported between four and seventeen problems every time, and every one of them has
been a real fault in the question rather than in the probe.
