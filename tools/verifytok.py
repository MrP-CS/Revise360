"""Is the prescribed data in every Python instruction marked, and marked honestly?

tools/markdata.py did the marking once. This is what keeps it true: it runs over
the bank every time and fails on the four ways the marking can go wrong.

  1. A span that is not valid Python. A box says "this is program text", so
     `print("x"` in a box is a lie about what the pupil should type.
  2. A span that does not match the answer. A task that boxes `30` while the
     model solution holds 25 would send a whole class down the wrong road.
  3. Markup that leaks. A stray backtick means a renderer somewhere is showing
     the author's notation to a pupil.
  4. A value the answer prescribes that is named in the instruction and NOT
     boxed, where its siblings are. This is the one that matters most: a half
     marked sentence is worse than an unmarked one, because the pupil reads the
     absence of a box as "this part is up to you".

Checks 1 to 3 fail the run. Check 4 is reported as a list to look at, because
there are honest reasons for it - a value named in prose that is not the value
being prescribed - and a build must not break on a judgement call.

    python3 tools/verifytok.py          # report
    python3 tools/verifytok.py --strict # also fail on a ragged sentence
"""
import os
import re
import sys
import ast
import json
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import markdata as M                                          # noqa: E402

BANK = os.path.join(HERE, "codebank")
KEYS = os.path.join(os.path.dirname(HERE), "answers", "codebank")
SPAN = re.compile(r"`([^`]*)`")

FIELDS = ("q", "fb")
LISTS = ("brief",)
HINTS = ("think", "walk")


def texts(q):
    """Every string a pupil reads on this question, with where it came from."""
    out = []
    for k in FIELDS:
        if isinstance(q.get(k), str):
            out.append((k, q[k]))
    for k in LISTS:
        for i, v in enumerate(q.get(k) or []):
            out.append(("%s[%d]" % (k, i), v))
    h = q.get("hint")
    if isinstance(h, dict):
        for k in HINTS:
            v = h.get(k)
            if isinstance(v, str):
                out.append(("hint." + k, v))
            elif isinstance(v, list):
                for i, x in enumerate(v):
                    out.append(("hint.%s[%d]" % (k, i), x))
    return out


def parses(src):
    """Is the span something a pupil could type into the editor?

    A whole statement, an expression, a bare name and a bare literal all have to
    pass; a SQL query does not parse as Python, so it is accepted as a string
    when it reads like one. Nothing else is.
    """
    src = src.strip()
    if not src:
        return False
    for attempt in (src, "(" + src + ")", "x = " + src):
        try:
            ast.parse(attempt)
            return True
        except SyntaxError:
            continue
    return bool(re.match(r'^"(SELECT|INSERT|UPDATE|DELETE|CREATE)\b', src, re.I))


def main(argv):
    strict = "--strict" in argv
    fails, ragged = [], []
    spans = 0
    for path in sorted(glob.glob(os.path.join(BANK, "pr-l*.json"))):
        lesson = os.path.basename(path)[:-5]
        bank = json.load(open(path, encoding="utf-8"))
        kp = os.path.join(KEYS, lesson + ".json")
        sols = json.load(open(kp, encoding="utf-8"))["solutions"] if os.path.exists(kp) else {}
        for q in bank["questions"]:
            sol = sols.get(q["id"], "")
            values, _free, _offered = M.values_for(q, sol)
            known = {form for form, bare in values}
            # A box may also hold a fragment of the program itself - "mid + 1" is
            # an expression rather than a literal, and quoting it is honest.
            source = (sol or "") + "\n" + (q.get("starter") or "")
            tight = re.sub(r"\s+", "", source)
            for where, text in texts(q):
                # (3) markup that leaks: an odd number of backticks, or an empty box
                if text.count("`") % 2:
                    fails.append("%s %s has an unclosed span" % (q["id"], where))
                for m in SPAN.finditer(text):
                    spans += 1
                    body = m.group(1)
                    if not body.strip():
                        fails.append("%s %s has an empty span" % (q["id"], where))
                        continue
                    # (1) a box has to hold Python
                    if not parses(body):
                        fails.append("%s %s boxes something that is not Python: %r"
                                     % (q["id"], where, body))
                        continue
                    # (2) and it has to be a value this question actually prescribes
                    if body not in known and re.sub(r"\s+", "", body) not in tight:
                        fails.append("%s %s boxes %r, which is nowhere in the answer "
                                     "or the starter" % (q["id"], where, body))
                # (4) a sentence that boxes some of its values and not others
                plain = M.unmark(text) if hasattr(M, "unmark") else SPAN.sub(r"\1", text)
                for form, bare in values:
                    if form == bare or not M.worth_marking(form, bare):
                        continue            # names and one-character values: too noisy
                    if len(bare) < 3:
                        continue            # "in", "no", "is": a word as often as a value
                    named = re.search(r"(?<![\w`\"'])" + re.escape(bare)
                                      + r"(?![\w`\"'])", plain)
                    if named and ("`" + form + "`") not in text and SPAN.search(text):
                        ragged.append("%s %s names %r but boxes other values"
                                      % (q["id"], where, bare))

    print("%d marked span(s) checked" % spans)
    for f in fails:
        print(" FAIL " + f)
    if ragged:
        print()
        print("%d sentence(s) to look at by eye - a value is named unboxed beside "
              "boxed ones:" % len(ragged))
        for r in ragged[:25]:
            print("   " + r)
        if len(ragged) > 25:
            print("   ... and %d more" % (len(ragged) - 25))
    print()
    if fails or (strict and ragged):
        print("%d problem(s)" % (len(fails) + (len(ragged) if strict else 0)))
        return 1
    print("every marked span is real Python and a value the answer prescribes")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
