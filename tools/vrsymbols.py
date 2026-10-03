"""Work out which symbol keys each Python question needs, and store the list.

A headset keyboard with every Python symbol on it is a wall of punctuation, and
most of it is irrelevant to the question in front of the pupil. This works out,
for each question, the non-letter characters that question could reasonably
need, and writes them onto the public task as `vrKeys`. js/vr.js draws those and
nothing else.

WHAT IT MAY AND MAY NOT SHIP
----------------------------
The model solutions are teacher-only and live in answers/, which is not in the
repository. They are read here, at build time, and what leaves is a sorted set
of characters. A set of characters is not a solution: knowing that a question
needs ( ) and " does not tell you print("Hello"), in what order, or with what
inside it. Nothing else from answers/ is written into the public file, and
tools/audit_exposure.py is what keeps that true.

WHY IT ERRS LARGE
-----------------
A question is marked by running it, so any Python that produces the right output
is accepted - not only the solution the course happens to store. A pupil who
writes 'Line two' with single quotes where the solution used double ones is
right, and a keyboard that cannot type their answer is a broken question, not a
tidy one. So on top of what is observed:

  * quotes travel together - one implies the other;
  * a bracket implies its partner;
  * any comparison brings the whole family, so >= and != are typable even where
    the solution only used >;
  * a string literal brings + and , , because joining and listing are ordinary
    alternatives to writing a second line;
  * the technique the question is about brings its own symbols, whether or not
    the stored solution happened to use them.

And the keyboard keeps a way to reach the rest regardless, so no derivation
fault here can make a question impossible to answer.

  python3 tools/vrsymbols.py             # report what each question would get
  python3 tools/vrsymbols.py --write     # write vrKeys into experiences/
"""
import os, re, sys, json, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE, ANSWERS, EXPERIENCES

# Characters the keyboard always has, so they are never listed per question.
ALWAYS = set("abcdefghijklmnopqrstuvwxyz")

# What a technique needs, whatever the stored solution used. Section 9 of the
# brief: associate a question with what it is teaching rather than
# reverse-engineering one answer every time.
TECHNIQUE = {
    "print":      '()"\'',
    "input":      '()"\'',
    "assignment": '=',
    "arithmetic": '+-*/()',
    "intdiv":     '/%',
    "comparison": '<>=!',
    "selection":  ':<>=!',
    "loop":       ':()',
    "range":      '(),',
    "list":       '[],',
    "index":      '[]:',
    "string":     '"\'',
    "function":   '():,',
    "dict":       '{}:,',
    "comment":    '#',
    "file":       '.()"\'',
    "import":     '.',
}

# How a technique is recognised in the question's own material. Deliberately
# generous: a question that mentions a technique anywhere in its starter, its
# worked example, its hint or its rules is treated as being about it.
DETECT = [
    ("print",      r"\bprint\s*\("),
    ("input",      r"\binput\s*\("),
    ("assignment", r"[A-Za-z_]\w*\s*=(?!=)"),
    ("arithmetic", r"[-+*/]\s*\d|\d\s*[-+*/]|\b(?:int|float)\s*\("),
    ("intdiv",     r"//|%"),
    ("comparison", r"[<>]|[=!]=|\bif\b|\bwhile\b"),
    ("selection",  r"\bif\b|\belif\b|\belse\b"),
    ("loop",       r"\bfor\b|\bwhile\b"),
    ("range",      r"\brange\s*\("),
    ("list",       r"\[.*\]|\.append\s*\(|\blist\s*\("),
    ("index",      r"\w\s*\[|\[\s*\d|\[\s*:"),
    ("string",     r"[\"']"),
    ("function",   r"\bdef\b|\breturn\b"),
    ("dict",       r"\{.*:.*\}"),
    ("comment",    r"#"),
    ("file",       r"\bopen\s*\(|\.read\s*\(|\.write\s*\(|\.close\s*\("),
    ("import",     r"\bimport\b"),
]

# Characters that cannot sensibly appear alone.
PAIRS = {"(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{",
         '"': "'", "'": '"'}
COMPARISON = set("<>=!")


def task_sources(t, solution):
    """Everything about one question that a pupil might have to type.

    Prose is not here: `q` and `brief` are read, not typed. The exception is a
    value the question prescribes, which it marks in backticks, because a pupil
    has to reproduce that exactly.
    """
    out = []
    out.append(("starter", t.get("starter") or ""))
    for c in t.get("code") or []:
        out.append(("program shown", c))
    teach = t.get("teach") or {}
    for c in teach.get("code") or []:
        out.append(("worked example", c))
    h = t.get("hint")
    if isinstance(h, dict):
        for key in ("syntax", "start"):
            v = h.get(key)
            for c in ([v] if isinstance(v, str) else (v or [])):
                out.append(("hint", c))
    for rule in t.get("require") or []:
        out.append(("required", rule[0] if isinstance(rule, (list, tuple)) else str(rule)))
    for rule in t.get("forbid") or []:
        # a forbidden string is not typed, but a pupil writing round it needs
        # the same alphabet to say the thing that replaces it
        out.append(("forbidden", rule[0] if isinstance(rule, (list, tuple)) else str(rule)))
    # the prescribed values a question marks in backticks, which must be typed
    # exactly as given
    for field in ([t.get("q") or ""] + list(t.get("brief") or [])):
        for v in re.findall(r"`([^`]*)`", str(field)):
            out.append(("prescribed value", v))
    # what the tests type in and expect out: an input a pupil must handle, and
    # an output they must reproduce exactly
    for test in t.get("tests") or []:
        for v in test.get("in") or []:
            out.append(("test input", str(v)))
        for v in test.get("out") or []:
            out.append(("required output", str(v)))
    if solution:
        out.append(("solution", solution))
    return out


def symbols_for(t, solution):
    """The characters this question needs, and why each one is there."""
    why = collections.defaultdict(set)
    text = []
    for source, s in task_sources(t, solution):
        text.append(str(s))
        for ch in str(s):
            if ch in ALWAYS or ch.isspace():
                continue
            why[ch].add(source)
    joined = "\n".join(text)

    techniques = [name for name, pat in DETECT if re.search(pat, joined)]
    for name in techniques:
        for ch in TECHNIQUE[name]:
            why[ch].add("technique: " + name)

    # closure, so one legitimate way of writing the answer is not shut out
    for ch in list(why):
        if ch in PAIRS:
            why[PAIRS[ch]].add("partner of " + ch)
    # A comparison brings its whole family, so a pupil who writes >= where the
    # solution wrote > is not stuck. It is gated on the question actually
    # comparing something, not on seeing an = - every assignment has one of
    # those, and letting = imply < > and ! put the comparison row on 559 of the
    # 620 questions, which is not a simplification of anything.
    if "comparison" in techniques or "selection" in techniques:
        for ch in COMPARISON:
            why[ch].add("comparisons travel together")
    # digits: a question that shows one, asks for one, or does arithmetic
    if any(c.isdigit() for c in why) or "arithmetic" in techniques or "range" in techniques:
        for ch in "0123456789":
            why[ch].add("the question works with numbers")

    # letters are always on the keyboard, and a capital is Shift plus a letter
    out = {ch: sorted(src) for ch, src in why.items()
           if not ch.isalpha() and not ch.isspace()}
    return out, techniques


def code_tasks():
    """Every code question in the course, with its lesson, place and solution."""
    for f in sorted(glob.glob(str(EXPERIENCES / "*.json"))):
        lid = os.path.basename(f)[:-5]
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        if "scenes" not in d:
            continue
        ans = ANSWERS / "codebank" / (lid + ".json")
        sols = json.load(open(ans, encoding="utf-8")).get("solutions", {}) if ans.exists() else {}
        n = 0
        for sc in d.get("scenes", []):
            for k, st in enumerate(sc.get("stations", [])):
                for i, t in enumerate(st.get("tasks", [])):
                    if t.get("t") != "code":
                        continue
                    n += 1
                    yield f, d, lid, k, i, t, sols.get("%s-q%d" % (lid, n))


def main(write=False):
    per, files, counts = {}, {}, collections.Counter()
    for f, d, lid, k, i, t, sol in code_tasks():
        syms, tech = symbols_for(t, sol)
        keys = sorted(syms)
        per[(lid, k, i)] = (keys, syms, tech)
        counts[len(keys)] += 1
        if write:
            t["vrKeys"] = keys
            files[f] = d
    if write:
        for f, d in files.items():
            with open(f, "w", encoding="utf-8") as fh:
                json.dump(d, fh, ensure_ascii=False, indent=1)
    total = len(per)
    sizes = [len(v[0]) for v in per.values()]
    print("%d Python question(s); the symbol row holds %d on average, %d at most, %d at least"
          % (total, round(sum(sizes) / max(1, total)), max(sizes or [0]), min(sizes or [0])))
    if "--list" in sys.argv:
        for (lid, k, i), (keys, syms, tech) in sorted(per.items()):
            print("  %-8s s%d a%d  %-34s %s" % (lid, k + 1, i + 1, " ".join(keys),
                                                ",".join(tech)))
    if "--why" in sys.argv:
        key = sys.argv[sys.argv.index("--why") + 1]
        lid, k, i = key.split(":")
        keys, syms, tech = per[(lid, int(k), int(i))]
        print("%s station %s activity %s - techniques: %s" % (lid, k, i, ", ".join(tech)))
        for ch in keys:
            print("   %-3s %s" % (ch, "; ".join(syms[ch])))
    print()
    print("written into experiences/" if write else "nothing written; pass --write")
    return 0


if __name__ == "__main__":
    sys.exit(main("--write" in sys.argv))
