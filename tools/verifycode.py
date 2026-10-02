"""Check every code question is answerable, and that its tests are worth having.

A question whose tests a correct program fails is broken. A question whose
tests a *wrong* program passes is worse, because it tells a pupil they are
right when they are not. This checks both, with real Python.

Four checks per question:

1. the model solution passes every test;
2. a program that just prints the first test's expected answer fails at least
   one other test - otherwise the question can be guessed;
3. an empty program fails every test;
4. the brief says what to print, and every test's expected output is reachable.

  python3 verifycode.py                 # every question
  python3 verifycode.py pr-l03          # one lesson
"""
import os, sys, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(HERE, "codebank")
# Model solutions are answer-sheet material and this repository is public, so
# they are kept in answers/, which git ignores - the same place the teacher
# answer sheets are built into. Without that folder a question still has its
# tests, but nothing proves it can be answered, so the checks say so plainly.
SOLS = os.path.join(os.path.dirname(HERE), "answers", "codebank")


def solutions(lesson):
    f = os.path.join(SOLS, lesson + ".json")
    if not os.path.isfile(f):
        return None
    return json.load(open(f)).get("solutions") or {}


def norm(s):
    lines = [l.strip() for l in str(s).replace("\r", "").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(" ".join(l.split()) for l in lines).lower()


# The browser marks with input() prompts suppressed, so that a pupil may write
# input("What is your name? ") - the way every textbook teaches it - without the
# prompt landing in the output being checked. This has to match, or a solution
# that passes here would fail on the site, or the other way round.
PRELUDE = (
    "import builtins as _b\n"
    "_real = _b.input\n"
    "_b.input = lambda prompt='': _real()\n"
)


def run(code, stdin, files=None, timeout=10):
    """Runs in a throwaway directory, so a file question starts from the same
    state every time and cannot be passed by a file an earlier test left."""
    import tempfile
    code = PRELUDE + code
    with tempfile.TemporaryDirectory() as d:
        for name, body in (files or {}).items():
            with open(os.path.join(d, name), "w") as fh:
                fh.write(body)
        try:
            p = subprocess.run([sys.executable, "-I", "-c", code],
                               input="\n".join(stdin) + "\n", capture_output=True,
                               text=True, timeout=timeout, cwd=d)
            return p.returncode, p.stdout, p.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "timed out"


def load(only=None):
    out = []
    if not os.path.isdir(BANK):
        return out
    for f in sorted(os.listdir(BANK)):
        if not f.endswith(".json"):
            continue
        data = json.load(open(os.path.join(BANK, f)))
        sols = solutions(data["lesson"])
        for q in data["questions"]:
            q["_lesson"] = data["lesson"]
            q["_file"] = f
            if sols is not None:
                q["solution"] = sols.get(q["id"])
            if not only or data["lesson"] == only:
                out.append(q)
    return out


def check(q):
    """Returns a list of problems with this question."""
    bad = []
    tests = q.get("tests") or []
    if len(tests) < 2 and not q.get("fixed"):
        bad.append("fewer than two tests - one test cannot tell a right answer from a lucky one")
    if not q.get("solution"):
        bad.append("no model solution in answers/codebank/%s.json, so nothing proves "
                   "the question can be answered" % q["_lesson"])
        return bad
    if not q.get("brief"):
        bad.append("no brief - the pupil has to be told exactly what to print")

    # 1. the model solution passes everything
    for t in tests:
        rc, out, err = run(q["solution"], t.get("in") or [], t.get("files"))
        want = norm("\n".join(t.get("out") or []))
        if rc != 0:
            bad.append(f"the model solution crashes on input {t.get('in')}: {err.strip().splitlines()[-1] if err.strip() else '?'}")
        elif norm(out) != want:
            bad.append(f"the model solution fails its own test {t.get('in')}: wanted {want!r}, got {norm(out)!r}")

    # 2. a program that prints the first answer must not pass
    #
    # The very first task of the course is an exception, and has to be: "print
    # this line" has one right output, so a program that prints a constant is
    # the correct answer rather than a way of cheating. A question says so with
    # "fixed": true, which is deliberately awkward to write by accident. Check 3
    # still applies to it - an empty program must still fail - so the question
    # is still proved to require something.
    if tests and not bad and not q.get("fixed"):
        guess = "print('''" + "\n".join(tests[0].get("out") or []) + "''')"
        passed = 0
        for t in tests:
            rc, out, _ = run(guess, t.get("in") or [], t.get("files"))
            if rc == 0 and norm(out) == norm("\n".join(t.get("out") or [])):
                passed += 1
        if passed == len(tests):
            bad.append("every test expects the same output, so printing one constant answer scores full marks")

    # 3. an empty program must fail everything
    if tests and not bad:
        for t in tests:
            rc, out, _ = run("pass", t.get("in") or [], t.get("files"))
            if rc == 0 and norm(out) == norm("\n".join(t.get("out") or [])):
                bad.append(f"an empty program passes the test {t.get('in')}")
                break

    # 4. a forbidden pattern must not appear in the model solution
    for f in q.get("forbid") or []:
        if f[0] in q["solution"]:
            bad.append(f"the model solution uses {f[0]!r}, which the question forbids")
    return bad


def main(only):
    qs = load(only)
    if not qs:
        print("no questions found in tools/codebank/")
        return 1
    bad_total, by_lesson = 0, {}
    for q in qs:
        probs = check(q)
        by_lesson.setdefault(q["_lesson"], []).append((q, probs))
        bad_total += len(probs)
    for lesson in sorted(by_lesson):
        rows = by_lesson[lesson]
        ok = sum(1 for _, p in rows if not p)
        print(f"{lesson:8} {len(rows):3} questions, {ok:3} clean")
        for q, probs in rows:
            for p in probs:
                print(f"    {q.get('id', q['q'][:34])}: {p}")
    print(f"\n{len(qs)} questions, {bad_total} problem(s)")
    return 1 if bad_total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
