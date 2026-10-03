#!/usr/bin/env python3
"""The marker's own edges, tested without the question bank.

tools/revwritten.py proves the bank's mark points behave, which is the claim
that matters to a learner. It cannot prove the marker's rules behave, because a
rule can be wrong in a way no question in the bank happens to exercise - and
then an author quietly works around it, the probes go green, and the next topic
walks into the same hole.

Every case below is a rule that was wrong once. Each one is written so that it
FAILS if the rule is removed: that is the only reason to keep a test.

    python3 tests/smokemark.py
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
CLI = HERE.parent / "revmark_cli.js"


def mark(points, answer, marks=None):
    q = {"type": "written", "marks": marks or len(points),
         "markPoints": [{"concept": "c%d" % i, "accept": [list(w) for w in ways]}
                        for i, ways in enumerate(points)]}
    p = subprocess.run(["node", str(CLI)],
                       input=json.dumps({"jobs": [{"question": q, "answer": answer}]}),
                       capture_output=True, text=True)
    if p.returncode:
        print(p.stderr[-2000:])
        raise SystemExit("the marker would not run")
    return json.loads(p.stdout)["results"][0]


def one(group):
    """One mark point, one way, one group."""
    return [[[group]]]


CASES = [
    # ---------------------------------------------------------------- negation
    ("a negator denies what follows it",
     one("volatile"), "RAM is not volatile.", 0),
    ("a negator does not reach past its own clause",
     one("lose contents"),
     "A disk does not lose its contents, unlike RAM, which loses its contents.", 1),
    ("a negator sitting in a phrase's gap still denies it",
     one("respond in time"), "It cannot respond in real time.", 0),
    ("a negator does not deny the consequence of a causal link",
     one("error"), "A file that is not there causes an error.", 1),
    ("a negator still denies the verb it governs",
     one("cause a problem"), "Opening it does not cause a problem.", 0),
    ("a pattern carrying its own negation is not denied by it",
     one("cannot be split"), "A character cannot be split into smaller units.", 1),
    ("four words is as far as a denial reaches",
     one("moving parts"), "An SSD does not have any moving parts.", 0),

    # ------------------------------------------------------------ false friends
    ("sorting is not shortness",
     one("shorter"), "A bubble sort compares each pair and swaps them.", 0),
    ("entering is not entirety",
     one("entire"), "Validation checks that the data entered is sensible.", 0),
    ("code is not core",
     one("core"), "The source code is written by the programmer.", 0),
    ("serial is not aerial",
     one("aerial"), "A serial cable sends one bit at a time.", 0),
    ("a typo in a long word is still the word",
     one("waiting"), "The process spends its time waiing for the disk.", 1),
    ("a comparative is the same word as its adverb",
     one("closer"), "The recording follows the original wave more closely.", 1),
    ("a short pattern is matched whole, not inside a longer word",
     one("bit"), "A bitmap stores the colour of every pixel.", 0),

    # ------------------------------------------------------------- word lists
    ("a list of the scheme's own words is not an explanation",
     [[["write"]], [["append"]]], "write append", 1),
    ("a connective does not excuse a word list",
     [[["one processor"]], [["turn"]], [["so fast"]]],
     "one processor turn so fast", 1),
    ("a one-mark answer is never a word list",
     one("central processing unit"), "Central processing unit", 1),

    # --------------------------------------------------------------- tidying
    ("a hyphenated word is one word",
     one("volatile"), "ROM is non-volatile.", 0),
    ("a pattern may contain and, because the answer is split on it too",
     one("on and off"), "A bit can be on and off.", 1),
    ("cannot is the same as can not",
     one("cannot be read"), "The file can not be read without the key.", 1),
    ("a pattern written cannot is not found by a word matcher looking for it",
     one("cannot be split"), "A single character can not be split up.", 1),
    ("the American spelling is not a mistake",
     one("organisation"), "The organization keeps a backup.", 1),
]


def main():
    bad = 0
    for name, points, answer, want in CASES:
        r = mark(points, answer)
        got = r["got"]
        if got != want:
            bad += 1
            print("  FAIL %-58s wanted %s, got %s" % (name, want, got))
            print("        %s" % answer)
    print()
    print("%d checks of the marker's own rules" % len(CASES))
    if bad:
        raise SystemExit("%d of the marker's rules are not holding" % bad)
    print("every rule the marker claims to follow, it follows")


if __name__ == "__main__":
    main()
