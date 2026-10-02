"""Check every code question is answerable, and that its tests are worth having.

A question whose tests a correct program fails is broken. A question whose
tests a *wrong* program passes is worse, because it tells a pupil they are
right when they are not. This checks both, with real Python.

Four checks per question that is marked by tests:

1. the model solution passes every test;
2. a program that just prints the first test's expected answer fails at least
   one other test - otherwise the question can be guessed;
3. an empty program fails every test;
4. the brief says what to print, and every test's expected output is reachable.

And a fifth for the kinds that hand out part-written code: a Change it, Complete
it or Fix it starter must fail at least one test, or there is nothing to do.

The two kinds that are not marked by tests get their own checks. A Predict
activity's program is run, and the answer the bank calls right must be what
Python actually displays - an option list is never taken on trust, because a
wrong one teaches a pupil something false with a green tick beside it. A Try it
activity's program must run without an error.

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
        # Naming one lesson reads only that lesson's file. It is quicker, and it
        # means a half-written bank elsewhere in the folder cannot stop a check
        # of the one being worked on.
        if only and f != only + ".json":
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


def check_predict(q):
    """A predict activity: the answer the bank calls right has to be what real
    Python displays.

    This is the check that matters most of the three new ones. An ordinary
    question with a wrong expected output tells a pupil their working program is
    broken, which is bad enough. A predict activity with a wrong answer teaches
    them, with complete confidence and a green tick, that Python does something
    it does not do. So the option is never trusted: the program is run."""
    bad = []
    code = q.get("code")
    opts = q.get("a") or []
    if not code:
        return ["a predict activity needs the program in 'code'"]
    if len(opts) < 3:
        bad.append("fewer than three options - two is a coin toss")
    rc, out, err = run("\n".join(code), q.get("in") or [])
    if rc != 0:
        return bad + ["the program crashes: %s" % (err.strip().splitlines()[-1] if err.strip() else "?")]
    real = norm(out)
    if not opts:
        return bad
    if norm(opts[0]) != real:
        bad.append("the answer given is %r but Python displays %r" % (norm(opts[0]), real))
    # Two options that normalise alike would mark a right answer wrong.
    seen = {}
    for o in opts:
        k = norm(o)
        if k in seen:
            bad.append("two options are the same once spacing and capitals are ignored: %r" % k)
        seen[k] = True
    return bad


def check_try(q):
    """A try-it activity: there is nothing to mark, so the one thing that can be
    wrong is a program that does not run."""
    code = q.get("starter")
    if not code or not code.strip():
        return ["a try-it activity needs the working program in 'starter'"]
    rc, _, err = run(code, q.get("in") or [])
    if rc != 0:
        return ["the program the pupil is asked to run crashes: %s"
                % (err.strip().splitlines()[-1] if err.strip() else "?")]
    return []


def check(q):
    """Returns a list of problems with this question."""
    kind = q.get("kind") or "build"
    if kind == "predict":
        return check_predict(q)
    if kind == "try":
        return check_try(q)
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

    # 4. a forbidden pattern must not appear in the model solution, and a
    #    required one must. A question demanding something its own answer does
    #    not do is unanswerable, which is the worse of the two to ship.
    for f in q.get("forbid") or []:
        if f[0] in q["solution"]:
            bad.append(f"the model solution uses {f[0]!r}, which the question forbids")
    for f in q.get("require") or []:
        if f[0] not in q["solution"]:
            bad.append(f"the question requires {f[0]!r} and its own model solution does not use it")

    # 5. a starter that is handed out part-written must not already pass
    #
    # Change it, Complete it and Fix it all put something in the editor and ask
    # for one thing to be done to it. If that something already passes the tests,
    # the activity is a button press: the pupil presses Check, is told they are
    # right, and has learnt nothing. This is the easiest of all these faults to
    # introduce by accident - fixing a typo in a starter can do it.
    if kind in ("change", "complete", "debug") and tests and not bad:
        starter = q.get("starter") or ""
        passed = 0
        for t in tests:
            rc, out, _ = run(starter, t.get("in") or [], t.get("files"))
            if rc == 0 and norm(out) == norm("\n".join(t.get("out") or [])):
                passed += 1
        if passed == len(tests):
            bad.append("the starter already passes every test, so there is nothing to %s"
                       % {"change": "change", "complete": "fill in", "debug": "fix"}[kind])
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
