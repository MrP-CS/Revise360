"""Does the written-answer marker mark meaning, or does it match words?

Section 68 names nine things every automatically marked written question has to
be tested against. This builds all nine for every one of them and marks them
with js/revmark.js itself, through tools/revmark_cli.js, so the thing being
tested is the thing that ships.

  model answer          the authored full-mark answer         full marks
  paraphrase            the same answer in other words        full marks
  every listed wording  each accepted way, on its own         earns its own point
  spelling              the model answer, misspelt            full marks
  incomplete            one mark point's sentence alone       exactly that point
  irrelevant            an answer about something else        no marks
  keyword dump          the expected words, no sentence       at most one mark
  negated               the model answer, negated             fewer than full marks
  contradictory         the right words, the wrong claim      fewer than full marks

Four of the nine are authored (`example`, `paraphrase`, and optionally `synonym`
and `contradiction`); the rest are derived from the question, which is
deliberate: a derived probe cannot be quietly tuned to pass. The spelling probe
really does misspell words, the keyword dump really is built out of the
question's own accept patterns, and the negation really is inserted into the
author's own sentence.

What "every listed wording" does and does not prove: it checks that each way an
author listed can be matched at all, which catches a pattern with a typo in it or
a stem that nothing will ever hit. It builds its probe from the patterns, so it
says nothing about whether a learner would write that sentence. The paraphrase is
the probe that tests real alternative wording, and it is authored for that
reason.

  python3 tools/revwritten.py
  python3 tools/revwritten.py --topic 1.1
  python3 tools/revwritten.py --show rq-1.1-the-registers-0017
  python3 tools/revwritten.py --naive     # prove the probes fail a word matcher
"""
import json
import re
import subprocess
import sys
import pathlib

import revkit
import revschema as S

HERE = pathlib.Path(__file__).resolve().parent
CLI = HERE / "revmark_cli.js"

# Answers about something else entirely. Rotated through so a question is not
# always probed with the same one.
IRRELEVANT = [
    "A bubble sort compares each pair of adjacent items and swaps them if they are in "
    "the wrong order, repeating until no swaps are needed.",
    "Phishing is when an attacker sends an email pretending to be a trusted company so "
    "the victim gives away their password.",
    "A compiler translates the whole program into machine code before it is run, and "
    "produces an executable file.",
    "I think this topic is quite interesting and I revised it last night for about half "
    "an hour before the test.",
    "An IDE provides an editor, a translator, a debugger and an error diagnostics "
    "window, all in one program, so a developer does not need separate tools.",
]

# Deliberate reversals, used to build the contradiction probe where the author
# has not written one. Applied to the model answer, each turning a true claim
# into its opposite without changing a single technical term.
REVERSALS = [
    (r"\bslower\b", "faster"), (r"\bfaster\b", "slower"),
    (r"\bmore\b", "less"), (r"\bless\b", "more"),
    (r"\bhigher\b", "lower"), (r"\blower\b", "higher"),
    (r"\bincrease(s|d)?\b", "decrease"), (r"\bdecrease(s|d)?\b", "increase"),
    (r"\bvolatile\b", "non-volatile"), (r"\bnon-volatile\b", "volatile"),
    (r"\bcannot\b", "can"), (r"\bcan\b", "cannot"),
    (r"\bbefore\b", "after"), (r"\bafter\b", "before"),
    (r"\blonger\b", "shorter"), (r"\bshorter\b", "longer"),
    (r"\bbigger\b", "smaller"), (r"\bsmaller\b", "bigger"),
    (r"\blarger\b", "smaller"),
]

NEGATORS = ("not", "never", "no", "none", "without", "nor", "neither", "cannot",
            "lacks", "lacking", "fails", "unable")


def misspell(text):
    """Introduce ordinary typos: every third long word loses a letter from the
    middle. Section 19 says that must not cost a mark."""
    out, n = [], 0
    for w in text.split(" "):
        core = re.sub(r"[^A-Za-z]", "", w)
        if len(core) >= 6:
            n += 1
            if n % 3 == 1:
                i = w.index(core[3]) if core[3] in w else -1
                if i > 0:
                    w = w[:i] + w[i + 1:]
        out.append(w)
    return " ".join(out)


def alternatives(p):
    """Every single-word alternative the point matches on, lowercased."""
    out = set()
    for way in p["accept"]:
        for group in way:
            for alt in group.split("|"):
                alt = alt.strip()
                if alt and " " not in alt and alt not in NEGATORS:
                    out.add(alt)
    return out


def matches_word(alts, word):
    """Would any of those alternatives match this word? Stem prefix, the way the
    marker does it, so "fast" counts as matching "faster"."""
    w = word.lower()
    return any(w == a or w.startswith(a) or a.startswith(w[:4]) and len(a) >= 4 and
               w[:4] == a[:4] for a in alts)


def negate(p):
    """Deny one mark point, in its own exemplar sentence.

    Two earlier versions of this probe were wrong, and both were wrong the same
    way: they negated a long model answer at one arbitrary place. "It carries out
    not logical comparisons, such as deciding whether one value is greater than
    another" is garbled rather than denied, and a marker that still gives the
    mark is behaving reasonably - so the probe was failing the marker for
    something the marker was right about.

    A negation probe only means something on a sentence that makes one claim.
    Every mark point carries an exemplar, which is exactly that, so this negates
    the exemplar and asks whether that one point is still awarded.

    EVERY occurrence is negated, not the first. Negating one of them left the
    others standing, and a point with two accepted wordings was still earned off
    the wording that had not been touched - so the probe passed a marker that had
    not noticed the denial at all.

    None when the exemplar already contains a negation: the point is itself a
    denial, and `affirm` is the probe for those."""
    text = p.get("exemplar")
    if not text or any(w.strip(",.;:").lower() in NEGATORS for w in text.split()):
        return None
    low = text.lower()
    alts = sorted(alternatives(p) | {a.strip() for way in p["accept"] for g in way
                                     for a in g.split("|") if " " in a.strip()},
                  key=len, reverse=True)
    spots = []
    for alt in alts:
        if not alt or alt.split()[0] in NEGATORS:
            continue
        # On a word boundary: searching for "most" inside "almost" produced
        # "alnot most", which is not a negation of anything.
        for m in re.finditer(r"\b" + re.escape(alt), low):
            if not any(s <= m.start() < e for s, e in spots):
                spots.append((m.start(), m.start() + len(alt)))
    if not spots:
        return None
    for s, _ in sorted(spots, reverse=True):
        text = text[:s] + "not " + text[s:]
    return text


def affirm(p):
    """The other half of the negation test, for a point whose concept IS a denial:
    take the negation out of its exemplar and the point must be lost. "The CPU
    does not have to wait" earns the mark; "the CPU does have to wait" must not,
    and a marker that matched on "wait" alone would give both.

    Only for a point whose own patterns carry the negation. An exemplar can
    happen to contain a "not" that the point does not depend on - "if it is not
    cooled well enough the CPU can be damaged" is about the damage - and taking
    that one out denies nothing."""
    text = p.get("exemplar")
    if not text:
        return None
    owns = any(t in NEGATORS for way in p["accept"] for g in way
               for alt in g.split("|") for t in alt.strip().split())
    if not owns:
        return None
    out, found = [], False
    for w in text.split():
        bare = w.strip(",.;:").lower()
        if bare in NEGATORS:
            found = True
            if bare == "cannot":
                out.append("can" + w[len("cannot"):])
            continue
        out.append(w)
    return " ".join(out) if found else None


def comparative_group(p, word):
    """Is `word` matched by a group of this point that is ENTIRELY comparative?

    That is the only case where turning the word round contradicts the point. A
    group reading "faster or less memory" matches "faster", but reversing it to
    "slower" leaves the memory advantage standing and the mark properly earned -
    so demanding that the marker refuse it was demanding that it be wrong."""
    w = word.lower()
    for way in p["accept"]:
        for g in way:
            alts = {a.strip() for a in g.split("|")}
            singles = {a for a in alts if " " not in a}
            if not singles or not matches_word(singles, w):
                continue
            for side, _ in revkit.AXES:
                if singles <= set(side):
                    return True
    return False


def contradict(p):
    """The right words, the wrong claim: one mark point's own exemplar with its
    comparatives turned round.

    Only a comparative the POINT ITSELF matches on is reversed. Reversing any
    comparative in the sentence produced probes that were not contradictions of
    the point at all - turning "the controller responds faster" into "responds
    slower" does not deny that two things are fetched at the same time, and
    failing the marker for allowing it was failing it for being right. If the
    reversed word is one the point is looking for, the marker has to notice;
    if it is not, there is nothing here to notice.

    None when the claim has nothing in it to turn round - "the accumulator"
    cannot be contradicted without replacing it. Those counts are reported."""
    t = p.get("exemplar")
    if not t:
        return None
    hit = False
    for pat, to in REVERSALS:
        for m in re.finditer(pat, t, re.I):
            if comparative_group(p, m.group(0)):
                t = t[:m.start()] + to + t[m.end():]
                hit = True
                break
    return t if hit else None


def first_words(group):
    return group.split("|")[0].strip()


def keyword_dump(q):
    """Every word the question is looking for, with no sentence around it. This
    is section 17's example, built from the question rather than guessed."""
    bits = []
    for p in q["markPoints"]:
        for way in p["accept"][:1]:
            for g in way:
                bits.append(first_words(g))
    seen, out = set(), []
    for b in bits:
        if b not in seen:
            seen.add(b)
            out.append(b)
    return " ".join(out)


def way_probe(way, developed):
    """A probe for one accepted way: the first alternative of each of its
    groups. Not a sentence - it is checking the patterns can be hit at all.

    A point that has to be developed is refused unless the answer links its
    ideas, so the probe carries a link word. Without one this probe failed every
    developed point in the bank and said nothing about the patterns, which is
    the fault it was written to find in them."""
    # Comma-separated, so a negation written into one group does not reach the
    # next one. Joined with spaces, the probe for "no moving parts" + "durable"
    # read as a denial of durability and failed a point that was fine.
    body = ", ".join(first_words(g) for g in way)
    return ("this happens because " + body) if developed else body


def probes_for(q, n):
    """Every probe for one question, as (name, answer, rule).

    A rule is either ("==" | "<" | "<=" | ">=", marks), judged on the total, or
    ("point", index, True|False), judged on whether that one mark point was
    awarded - which is what a probe aimed at a single claim needs."""
    marks = q["marks"]
    pts = q["markPoints"]
    out = [("model", q["example"], ("==", marks))]
    if q.get("paraphrase"):
        out.append(("paraphrase", q["paraphrase"], ("==", marks)))
    if q.get("synonym"):
        out.append(("synonym", q["synonym"], ("==", marks)))
    out.append(("spelling", misspell(q["example"]), ("==", marks)))
    if q.get("incomplete"):
        out.append(("incomplete", q["incomplete"], ("<", marks)))
    elif len(pts) > 1 and pts[0].get("exemplar"):
        out.append(("incomplete", pts[0]["exemplar"], ("<", marks)))
    out.append(("irrelevant", IRRELEVANT[n % len(IRRELEVANT)], ("==", 0)))
    if marks > 1:
        out.append(("keyword dump", keyword_dump(q), ("<=", 1)))
    for pi, p in enumerate(pts):
        if p.get("exemplar"):
            # The one sentence that states this point earns this point. That is
            # what makes partial credit real rather than claimed.
            out.append(("point %d alone" % (pi + 1), p["exemplar"], ("point", pi, True)))
            # A point with a denial among its accepted wordings is tested by
            # `affirm`. Negating the others leaves that one standing and says
            # nothing: "RAM can be not written to" still matches the wording
            # that describes ROM as read-only, and rightly so.
            owns_neg = any(t in NEGATORS for way in p["accept"] for g in way
                           for alt in g.split("|") for t in alt.strip().split())
            neg = None if owns_neg else negate(p)
            if neg:
                out.append(("point %d negated" % (pi + 1), neg, ("point", pi, False)))
            # A point with more than one accepted route is not denied by
            # changing one of them: "C runs slower and uses less memory" still
            # states the memory advantage, and a marker that awards it is right.
            # So the two probes that alter one wording are only enforced where
            # there IS only one wording.
            aff = affirm(p) if len(p["accept"]) == 1 or owns_neg else None
            if aff:
                out.append(("point %d affirmed" % (pi + 1), aff, ("point", pi, False)))
            bad = contradict(p) if len(p["accept"]) == 1 else None
            if bad:
                out.append(("point %d reversed" % (pi + 1), bad, ("point", pi, False)))
        for wi, way in enumerate(p["accept"]):
            out.append(("way %d.%d" % (pi + 1, wi + 1),
                        way_probe(way, p.get("developed")), ("point", pi, True)))
    return out


def judge(rule, r):
    if rule[0] == "point":
        d = (r.get("detail") or [])
        return bool(d[rule[1]]["met"]) is rule[2] if rule[1] < len(d) else False
    op, want = rule
    got = r["got"]
    return {"==": got == want, "<": got < want, "<=": got <= want,
            ">=": got >= want}[op]


def run(jobs):
    if not jobs:
        return []
    p = subprocess.run(["node", str(CLI)], input=json.dumps({"jobs": jobs}),
                       capture_output=True, text=True)
    if p.returncode:
        print(p.stderr[-2000:])
        raise SystemExit("the marker would not run")
    return json.loads(p.stdout)["results"]


def main():
    topics = None
    if "--topic" in sys.argv:
        topics = [sys.argv[sys.argv.index("--topic") + 1]]
    show = sys.argv[sys.argv.index("--show") + 1] if "--show" in sys.argv else None
    naive = "--naive" in sys.argv

    bank = [q for q in S.load_bank(topics) if q["type"] in ("short", "written")]
    if show:
        bank = [q for q in bank if q["id"] == show]
    jobs, plan = [], []
    for n, q in enumerate(bank):
        for name, ans, rule in probes_for(q, n):
            jobs.append({"question": q, "answer": ans})
            plan.append((q, name, ans, rule))

    results = [naive_mark(q, a) for q, _, a, _ in plan] if naive else run(jobs)

    fails, kinds, missing_para, no_points = [], {}, [], []
    for (q, name, ans, rule), r in zip(plan, results):
        if "error" in r:
            fails.append((q, name, ans, rule, r["error"]))
            continue
        kinds[name.split()[0]] = kinds.get(name.split()[0], 0) + 1
        if not judge(rule, r):
            fails.append((q, name, ans, rule, "%d of %d" % (r["got"], r["max"])))
        if show:
            print("  %-20s %d/%d  %s" % (name, r["got"], r["max"], ans[:88]))
    neg = con = 0
    for q in bank:
        if q["marks"] > 1 and not q.get("paraphrase"):
            missing_para.append(q["id"])
        for p in q["markPoints"]:
            if not p.get("exemplar"):
                no_points.append(q["id"])
            else:
                neg += 1 if (negate(p) or affirm(p)) else 0
                con += 1 if contradict(p) else 0
    n_points = sum(len(q["markPoints"]) for q in bank)

    print()
    print("%d written questions, %d mark points, %d probes" % (len(bank), n_points, len(plan)))
    for k in sorted(kinds):
        print("   %-16s %4d" % (k, kinds[k]))
    print("   of %d mark points, %d could be negated and %d could be reversed; the rest "
          "state something with nothing in it to turn round" % (n_points, neg, con))
    if missing_para:
        print("%d multi-mark questions have no authored paraphrase: %s"
              % (len(missing_para), ", ".join(missing_para[:8])))
    if no_points:
        print("%d mark points have no exemplar, so they cannot be probed on their own: %s"
              % (len(no_points), ", ".join(sorted(set(no_points))[:8])))
    for q, name, ans, rule, got in fails[:45]:
        print("  FAIL %s  %-18s wants %s, got %s"
              % (q["id"], name, " ".join(str(x) for x in rule), got))
        print("        %s" % ans[:150])
    print()
    bad = len(fails) + len(missing_para) + len(no_points)
    if naive:
        print("against a word matcher: %d of %d probes fail" % (len(fails), len(plan)))
        return 0 if fails else 1
    print("every written question marks meaning, not words" if not bad
          else "%d problem(s)" % bad)
    return 1 if bad else 0


def naive_mark(q, answer):
    """The marker this is meant to rule out: one mark for each mark point whose
    expected words appear anywhere, with no regard for negation, contradiction or
    whether the answer is a sentence. Run with --naive, the probes above must
    fail against it - otherwise they are not testing what they claim to."""
    t = " " + answer.lower() + " "
    detail, got = [], 0
    for p in q["markPoints"]:
        met = any(all(any(alt.strip() in t for alt in g.split("|")) for g in way)
                  for way in p["accept"])
        detail.append({"concept": p["concept"], "met": met})
        got += p.get("worth", 1) if met else 0
    return {"got": min(got, q["marks"]), "max": q["marks"], "detail": detail}


if __name__ == "__main__":
    sys.exit(main())
