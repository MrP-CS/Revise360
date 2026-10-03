"""Which revision questions are the same question twice?

Section 66 asks for a duplicate review report and is explicit that it is a
report: nothing here deletes anything, because whether two questions testing the
same idea from two angles is repetition or practice is a judgement, and some of
what this flags is deliberate. Parameterised drill - convert 214, convert 89 -
is flagged under "numbers swapped" and is meant to be there: a learner has to do
the work again each time. Two explanations of volatility in different words are
not.

  python3 tools/revdupes.py
  python3 tools/revdupes.py --topic 1.2
  python3 tools/revdupes.py --write    # also writes build/revision-duplicates.md

  identical          the same stem, word for word
  names swapped      the same stem with the names changed
  numbers swapped    the same stem with the numbers changed
  options reordered  a different stem, the same set of options and answer
  very close         more than 85% of the words in common, in the same order
"""
import collections
import difflib
import re
import sys

import revschema as S
from paths import OUT

NAME = re.compile(r"\b[A-Z][a-z]{2,}\b")
NUM = re.compile(r"\b\d+(?:[.,]\d+)*\b")
WORD = re.compile(r"[a-z0-9]+")


def bare(s):
    return " ".join(WORD.findall(str(s).lower()))


def no_names(s):
    return bare(NAME.sub("NAME", str(s)))


def no_numbers(s):
    return bare(NUM.sub("N", str(s)))


def groups(bank, key):
    out = collections.defaultdict(list)
    for q in bank:
        out[key(q)].append(q)
    return {k: v for k, v in out.items() if len(v) > 1}


def main():
    topics = None
    if "--topic" in sys.argv:
        topics = [sys.argv[sys.argv.index("--topic") + 1]]
    bank = S.load_bank(topics)
    found = collections.OrderedDict()

    found["identical"] = groups(bank, lambda q: bare(q["q"]))
    found["names swapped"] = {k: v for k, v in groups(bank, lambda q: no_names(q["q"])).items()
                              if k not in found["identical"]}
    found["numbers swapped"] = {k: v for k, v in groups(bank, lambda q: no_numbers(q["q"])).items()
                               if k not in found["identical"]}
    # True/false is left out: every one of them has the same two options, so
    # grouping by option set flagged every true answer in the bank as a copy of
    # every other, which is a report nobody would read twice.
    found["options reordered"] = groups(
        [q for q in bank if q["type"] in ("mcq", "multi")],
        lambda q: (q["type"], tuple(sorted(map(str, q.get("options") or []))),
                   str((q.get("options") or [None])[q["correct"]]
                       if isinstance(q.get("correct"), int) else sorted(q.get("correct") or []))))
    found["options reordered"] = {k: v for k, v in found["options reordered"].items()
                                  if bare(v[0]["q"]) != bare(v[1]["q"])}

    # And the slow one: everything else, pair by pair, within a topic.
    close = []
    seen = {q["id"] for g in found.values() for v in g.values() for q in v}
    by_topic = collections.defaultdict(list)
    for q in bank:
        by_topic[q["topic"]].append(q)
    for qs in by_topic.values():
        for i in range(len(qs)):
            for j in range(i + 1, len(qs)):
                a, b = qs[i], qs[j]
                if a["type"] != b["type"]:
                    continue
                if a["id"] in seen and b["id"] in seen:
                    continue
                r = difflib.SequenceMatcher(None, bare(a["q"]), bare(b["q"])).ratio()
                if r >= 0.85:
                    close.append((round(r, 3), a, b))
    close.sort(reverse=True, key=lambda x: x[0])

    lines = []
    total = 0
    for kind, gs in found.items():
        n = sum(len(v) for v in gs.values())
        total += len(gs)
        print("%-18s %d group(s), %d questions" % (kind, len(gs), n))
        for k, v in list(gs.items())[:20]:
            lines.append("### %s\n" % kind)
            lines.append("- " + v[0]["q"])
            for q in v:
                lines.append("  - `%s` %s, %d marks, %s"
                             % (q["id"], q["type"], q["marks"], q["subtopic"]))
    print("%-18s %d pair(s)" % ("very close", len(close)))
    total += len(close)
    for r, a, b in close[:40]:
        lines.append("### very close (%.0f%%)\n" % (100 * r))
        lines.append("- `%s` %s" % (a["id"], a["q"]))
        lines.append("- `%s` %s" % (b["id"], b["q"]))

    print()
    for kind, gs in found.items():
        for k, v in list(gs.items())[:8]:
            print("  %s: %s" % (kind, ", ".join(q["id"] for q in v)))
            print("      " + v[0]["q"][:110])
    for r, a, b in close[:8]:
        print("  very close (%.0f%%): %s / %s" % (100 * r, a["id"], b["id"]))
        print("      " + a["q"][:110])
        print("      " + b["q"][:110])

    if "--write" in sys.argv:
        out = OUT / "revision-duplicates.md"
        head = ("# Revision bank: questions to look at twice\n\n"
                "Written by tools/revdupes.py. Nothing here has been deleted; section 66 of "
                "the specification for this work says a human decides. Parameterised "
                "practice - the same calculation with different numbers - appears under "
                "\"numbers swapped\" and is deliberate.\n\n"
                "%d group(s) or pair(s) flagged out of %d questions.\n\n" % (total, len(bank)))
        out.write_text(head + "\n".join(lines) + "\n", encoding="utf-8")
        print("\nwrote %s" % out)

    print()
    print("nothing looks repeated" if not total
          else "%d group(s) or pair(s) for a human to look at" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
