"""The constructors the revision bank is authored with.

Questions are written as Python in tools/revbank/t*.py rather than typed as
JSON, for three reasons. A mark point is a small structure and repeating its
braces 1,500 times invites the kind of slip nothing catches; a constructor can
refuse a question that is missing something the moment it is written rather than
two tools later; and a subtopic can state its station and its outcomes once
instead of on every question in it, which is what stops a question drifting onto
a station that does not teach it.

tools/mkrevision.py turns these into revision/<topic>/<file>.json.

Ids are not positions. `mkrevision.py` keeps revision/ids.json, which remembers
the number it gave each question the first time it saw it, keyed by the question
itself. Reorder a file, insert one in the middle, move one between subtopics:
every id stays what it was, and a learner's history keeps pointing at the
question they actually answered.
"""
import ast
import operator
import re

DIFFICULTY = ("retrieve", "understand", "apply", "stretch")

_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
        ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod, ast.Pow: operator.pow, ast.USub: operator.neg}


def _arith(expr):
    """A sum, evaluated. Numbers and operators only - a `working` field is
    working out, not a program."""
    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in _OPS:
            return _OPS[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and type(n.op) in _OPS:
            return _OPS[type(n.op)](ev(n.operand))
        raise ValueError("working may only contain numbers and arithmetic: " + expr)
    return ev(ast.parse(expr, mode="eval"))


def _q(kind, stem, **kw):
    out = {"type": kind, "q": stem.strip()}
    for k, v in kw.items():
        if v is not None:
            out[k] = v
    return out


def _common(out, fb, hint, cw, diff, exam, misc, marks):
    out["marks"] = marks
    out["feedback"] = fb
    if hint:
        out["hint"] = hint
    if cw:
        out["commandWord"] = cw
    out["difficulty"] = diff
    if exam:
        out["examStyle"] = True
    if misc:
        out["misconception"] = misc
    return out


# ---------------------------------------------------------------- mark points
# Pairs of opposites. Where a mark point is matched on one side of an axis, `mp`
# adds a rejection for the other side automatically, so a learner who states the
# comparison backwards loses the point rather than earning it on the keyword.
# Section 18 asks for that, and asking every author to remember it for every
# comparative in 1,500 questions is asking for it to be forgotten.
AXES = [
    (("fast", "faster", "quick", "quicker", "quickly", "speed", "speeds", "rapid",
      "sooner", "shorter"),
     "slow|slower|slowly|less quick|not as fast|takes longer|sluggish|longer"),
    (("slow", "slower", "slowly", "sluggish", "longer"),
     "fast|faster|quick|quicker|quickly|more quickly|speeds up|sooner|shorter"),
    (("more", "larger", "bigger", "greater", "higher", "increase", "increases",
      "increased", "twice", "double", "doubles"),
     "less|fewer|smaller|lower|decrease|decreases|decreased|half|halves"),
    (("less", "fewer", "smaller", "lower", "decrease", "decreases", "half"),
     "more|larger|bigger|greater|higher|increase|increases|twice|double"),
    (("volatile",), "non-volatile|nonvolatile|keeps its contents|retains its contents"),
    (("non-volatile", "nonvolatile", "permanent", "permanently"), "volatile|temporary"),
    (("cheap", "cheaper", "inexpensive"), "expensive|dearer|costly|costs more"),
    (("expensive", "dearer", "costly"), "cheap|cheaper|inexpensive|costs less"),
    (("before",), "after|afterwards|later"),
    (("after", "afterwards"), "before|first|beforehand"),
]


def _auto_rejects(ways):
    """For each way, the same way with one comparative group turned round."""
    out = []
    for way in ways:
        for i, group in enumerate(way):
            alts = {a.strip() for a in group.split("|")}
            for side, opposite in AXES:
                if alts & set(side):
                    flipped = list(way)
                    flipped[i] = opposite
                    if flipped not in out:
                        out.append(flipped)
                    break          # one axis a group; a group is on at most one
    return out


def mp(concept, *ways, worth=1, developed=False, reject=None, exemplar=None,
       loose=None, noflip=False):
    """One mark point of a written mark scheme.

    `ways` are the different ways a learner might say it. Each way is one or
    more groups, and every group in a way has to appear for that way to count; a
    group is alternatives separated by `|`. So

        mp("RAM is volatile",
           ["volatile"],
           ["lose|lost|disappear", "power|switched off"])

    accepts the word, or the meaning without the word, which is what section 15
    asks for. Patterns are matched on word stems, so "volatile" also catches
    volatility and "lose" catches loses - and one typo in a long word is
    forgiven. See the header of js/revmark.js for exactly how far that goes.

    `developed` marks a point that has to be joined to another idea rather than
    merely present: it is refused unless the answer actually links its ideas,
    which is how section 17 stops a list of key words earning an explanation
    mark. `reject` is a wording that means the opposite, and costs the point even
    when the right words are in the sentence - section 18's "RAM is volatile
    because it keeps its contents".

    `exemplar` is one sentence that earns this point and nothing else. The
    probes in tools/revwritten.py mark it on its own to prove the point can be
    earned by itself, which is also what makes the partial-credit claim real.
    """
    for w in ways:
        if not isinstance(w, (list, tuple)) or not all(isinstance(g, str) for g in w):
            raise ValueError("a way is a list of pattern groups: %r in %r" % (w, concept))
    out = {"concept": concept.strip(), "accept": [list(w) for w in ways], "worth": worth}
    if developed:
        out["developed"] = True
    rejects = [list(r) for r in (reject or [])]
    if not noflip:
        rejects += [r for r in _auto_rejects(ways) if r not in rejects]
    if rejects:
        out["reject"] = rejects
    if exemplar:
        out["exemplar"] = exemplar.strip()
    if loose:
        out["loose"] = loose
    return out


# ---------------------------------------------------------------- selected response
def mcq(stem, right, wrong, fb, hint=None, cw="identify", diff="retrieve",
        exam=False, misc=None, marks=1):
    if len(wrong) < 2:
        raise ValueError("a multiple choice needs at least two wrong options: " + stem)
    opts = [right] + list(wrong)
    if len(set(opts)) != len(opts):
        raise ValueError("repeated option in: " + stem)
    out = _q("mcq", stem, options=opts, correct=0)
    return _common(out, fb, hint, cw, diff, exam, misc, marks)


def tf(stem, answer, fb, hint=None, cw="tick", diff="retrieve", exam=False, misc=None):
    out = _q("tf", stem, options=["True", "False"], correct=0 if answer else 1)
    return _common(out, fb, hint, cw, diff, exam, misc, 1)


def multi(stem, options, correct, fb, hint=None, cw="tick", diff="understand",
          exam=False, misc=None, marks=None):
    for c in correct:
        if c not in options:
            raise ValueError("%r is marked correct but is not an option in: %s" % (c, stem))
    if len(correct) >= len(options):
        raise ValueError("every option is correct in: " + stem)
    out = _q("multi", stem, options=list(options), correct=list(correct))
    return _common(out, fb, hint, cw, diff, exam, misc, marks or len(correct))


def match(stem, pairs, fb, hint=None, cw="draw", diff="understand", exam=False, misc=None):
    if len({p[1] for p in pairs}) != len(pairs):
        raise ValueError("two items match the same thing, so the answer is not unique: " + stem)
    out = _q("match", stem, pairs=[list(p) for p in pairs])
    return _common(out, fb, hint, cw, diff, exam, misc, len(pairs))


def order(stem, steps, fb, hint=None, cw="complete", diff="understand", exam=False, misc=None):
    if len(set(steps)) != len(steps):
        raise ValueError("a repeated step makes the order ambiguous: " + stem)
    out = _q("order", stem, steps=list(steps))
    return _common(out, fb, hint, cw, diff, exam, misc, len(steps))


def sort(stem, cats, items, fb, hint=None, cw="tick", diff="understand", exam=False, misc=None):
    for it in items:
        if it[1] not in cats:
            raise ValueError("%r is sorted into %r, which is not a category: %s"
                             % (it[0], it[1], stem))
    out = _q("sort", stem, cats=list(cats), items=[list(i) for i in items])
    return _common(out, fb, hint, cw, diff, exam, misc, len(items))


# ---------------------------------------------------------------- written
def _written(kind, stem, marks, points, example, paraphrase, fb, hint, cw, diff,
             exam, misc, synonym, contradiction, incomplete):
    worth = sum(p.get("worth", 1) for p in points)
    if worth != marks:
        raise ValueError("%s is worth %d marks and its mark points add to %d: %s"
                         % (kind, marks, worth, stem))
    # An automatically marked point has to be probeable on its own, which needs a
    # sentence that earns it and nothing else. A self-reviewed point does not: its
    # mark points are a checklist the learner reads, and nothing marks them.
    if kind != "extended":
        for p in points:
            if not p.get("exemplar"):
                raise ValueError("mark point %r in %r has no exemplar, so nothing can "
                                 "check it earns its own mark" % (p["concept"], stem))
    out = _q(kind, stem, markPoints=points, example=example.strip(),
             paraphrase=paraphrase.strip() if paraphrase else None,
             synonym=synonym.strip() if synonym else None,
             contradiction=contradiction.strip() if contradiction else None,
             incomplete=incomplete.strip() if incomplete else None)
    return _common(out, fb, hint, cw, diff, exam, misc, marks)


def short(stem, points, example, fb, paraphrase=None, hint=None, cw="state",
          diff="retrieve", exam=False, misc=None, synonym=None, contradiction=None):
    """A one-mark written answer: state, name, give."""
    return _written("short", stem, 1, points, example, paraphrase, fb, hint, cw,
                    diff, exam, misc, synonym, contradiction, None)


def written(stem, marks, points, example, fb, paraphrase=None, hint=None, cw="explain",
            diff="understand", exam=False, misc=None, synonym=None,
            contradiction=None, incomplete=None):
    """A written answer of two to four marks, marked against its mark points."""
    if not 2 <= marks <= 4:
        raise ValueError("written() is for two to four marks; use short() or extended(): " + stem)
    return _written("written", stem, marks, points, example, paraphrase, fb, hint,
                    cw, diff, exam, misc, synonym, contradiction, incomplete)


def extended(stem, marks, points, example, fb, hint=None, cw="discuss", diff="stretch",
             exam=True, misc=None, bands=None):
    """A long response nobody should pretend to mark automatically.

    The learner writes it, then marks it against the mark points themselves, and
    the mark is stored as SELF-REVIEWED so it never passes for a verified one.
    Section 20 is explicit about that, and section 49 about not pretending every
    long question is assessed against the same five headings - so `bands` is
    optional and only given where the question really is assessed that way.
    """
    out = _q("extended", stem, markPoints=points, example=example.strip(), bands=bands)
    return _common(out, fb, hint, cw, diff, exam, misc, marks)


# ---------------------------------------------------------------- computed
def num(stem, answer, fb, working, marks=1, unit=None, tolerance=None, method=None,
        hint=None, cw="calculate", diff="apply", exam=False, misc=None, answerLabel=None):
    """A calculation. `method` names the intermediate values that earn a mark of
    their own, so a learner who sets it out right and slips at the end is marked
    the way they would be on paper.

    `working` is the sum, written out, and it is not decoration: it is evaluated
    here against the stated answer, and again independently by
    tools/revverify.py. A calculation nobody can recompute is a calculation
    nobody has checked."""
    got = _arith(working)
    if abs(got - answer) > (tolerance or 0) + 1e-9:
        raise ValueError("%r works out to %s, and the answer given is %s: %s"
                         % (working, got, answer, stem))
    out = _q("num", stem, answer=answer, unit=unit, tolerance=tolerance,
             methodMark=method, answerLabel=answerLabel, working=working)
    return _common(out, fb, hint, cw, diff, exam, misc, marks)


def step(label, value, worth=1, tolerance=None):
    out = {"label": label, "value": value, "worth": worth}
    if tolerance is not None:
        out["tolerance"] = tolerance
    return out


def convert(stem, answer, kind, fb, marks=1, also=None, hint=None, cw="convert",
            diff="apply", exam=False, misc=None):
    if kind not in ("binary", "hex", "denary"):
        raise ValueError("convert() kind is binary, hex or denary: " + stem)
    out = _q("convert", stem, answer=str(answer), exact=kind, alsoAccept=also)
    return _common(out, fb, hint, cw, diff, exam, misc, marks)


def binadd(stem, answer, fb, marks=1, hint=None, diff="apply", exam=False, misc=None,
           overflow=False):
    out = _q("binadd", stem, answer=str(answer), exact="binary", overflow=overflow or None)
    return _common(out, fb, hint, "calculate", diff, exam, misc, marks)


def binshift(stem, answer, fb, marks=1, hint=None, diff="apply", exam=False, misc=None):
    out = _q("binshift", stem, answer=str(answer), exact="binary")
    return _common(out, fb, hint, "calculate", diff, exam, misc, marks)


def truth(stem, cols, rows, answer, fb, hint=None, diff="apply", exam=False, misc=None,
          expr=None):
    out = _q("truth", stem, cols=list(cols), rows=[list(r) for r in rows],
             answer=[list(a) for a in answer], expr=expr)
    blanks = sum(1 for r, row in enumerate(answer) for c, _ in enumerate(row) if rows[r][c] == "")
    return _common(out, fb, hint, "complete", diff, exam, misc, blanks)


def trace(stem, cols, rows, answer, fb, hint=None, diff="apply", exam=False, misc=None,
          code=None):
    out = _q("trace", stem, cols=list(cols), rows=[list(r) for r in rows],
             answer=[list(a) for a in answer], code=code)
    blanks = sum(1 for r, row in enumerate(answer) for c, _ in enumerate(row) if rows[r][c] == "")
    return _common(out, fb, hint, "trace", diff, exam, misc, blanks)


def codeout(stem, code, answer, fb, marks=1, also=None, hint=None, diff="apply",
            exam=False, misc=None, lang="python"):
    out = _q("codeout", stem, code=code.strip("\n"), answer=str(answer), exact="text",
             alsoAccept=also, lang=lang)
    return _common(out, fb, hint, "state", diff, exam, misc, marks)


# ---------------------------------------------------------------- subtopics
SLUG = re.compile(r"[^a-z0-9]+")


def sub(name, revisit, outcomes, questions, reason=None):
    """A group of questions about one idea, all pointing at the station that
    teaches it. The station id and the outcomes are stated once here rather than
    on every question, which is the only reason they stay in step."""
    if not re.match(r"^[a-z]{2,3}-(l\d+|bonus)(-test)?-(s\d+)$", revisit):
        raise ValueError("%r is not a station id (like ms-l02-s2)" % revisit)
    if not questions:
        raise ValueError("subtopic %r has no questions" % name)
    return {"subtopic": name, "revisit": revisit, "outcomes": list(outcomes),
            "revisitReason": reason or name,
            "slug": SLUG.sub("-", name.lower()).strip("-"),
            "questions": questions}
