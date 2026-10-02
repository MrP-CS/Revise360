"""Run every example in the Python syntax reference and check what it prints.

js/pyref.js is a reference pupils read while they are coding, so an example
that does not do what it says is worse than no example at all. This loads the
module the way the page does, runs every `eg` under real Python 3, and compares
what it printed with the `egOut` written beside it.

Three kinds of example, each run the way the platform itself would:

  Python   run as a program. input() is answered from the "# the user types x"
           and "# then x" comments in the example, and the prompt is not echoed,
           exactly as the marker does it (see js/pyworker.js).
  SQL      a bare SELECT, run against the table pet the SQL group describes.
           Each row is printed as its values with single spaces between them.
  db       Python using db.execute(), run with that same table connected as db.

Files: the examples that open notes.txt get a fresh one holding "red\\nblue\\n"
before every run, so one example can never leave a mess for the next.

It also checks no example is a model answer, twice over. No `eg` may appear
inside a model solution in answers/codebank/. And no `eg` may be a program that
satisfies a question's brief, which is checked the way the marker checks a
pupil: every example is run against every question's tests, with that question's
input, and must fail at least one of them.

  python3 verifyref.py
"""
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REF = os.path.join(ROOT, "js", "pyref.js")
BANK = os.path.join(HERE, "codebank")
SOLS = os.path.join(ROOT, "answers", "codebank")

NOTES = "red\nblue\n"
PET = [("rex", "dog", 5), ("mitts", "cat", 2), ("sooty", "cat", 7)]

# input() is answered from the comments, the way the taught examples write them.
# One comment may name more than one value - a loop reads several times from the
# same line of code - so "types blue, then red" is two lines of input, in order.
TYPED = re.compile(r"#\s*(?:the user types|then)\s+(.+?)\s*$")
AGAIN = re.compile(r",\s*then\s+")


def groups():
    """Load js/pyref.js the way the page does and dump upTo(13) as JSON."""
    js = (
        "global.window = {};"
        "require(%s);"
        "process.stdout.write(JSON.stringify(window.R360Ref.upTo(13)));"
        % json.dumps(REF)
    )
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit("could not load js/pyref.js:\n" + out.stderr)
    return json.loads(out.stdout)


def stdin_lines(eg):
    lines = []
    for line in eg:
        m = TYPED.search(line)
        if m:
            lines.extend(AGAIN.split(m.group(1)))
    return lines


def run_python(eg, db=False):
    """Run an example and return its output lines, or raise on a Python error."""
    code = "\n".join(eg)
    head = [
        "import builtins",
        "__lines = %r" % stdin_lines(eg),
        "def __input(prompt=''):",
        "    if not __lines:",
        "        raise EOFError('the example asked for more input than it describes')",
        "    return __lines.pop(0)",
        "builtins.input = __input",
    ]
    if db:
        head += [
            "import sqlite3",
            "db = sqlite3.connect(':memory:')",
            "db.execute('CREATE TABLE pet (name TEXT, kind TEXT, age INTEGER)')",
            "db.executemany('INSERT INTO pet VALUES (?,?,?)', %r)" % (PET,),
        ]
    with tempfile.TemporaryDirectory() as box:
        with open(os.path.join(box, "notes.txt"), "w") as f:
            f.write(NOTES)
        prog = os.path.join(box, "eg.py")
        with open(prog, "w") as f:
            f.write("\n".join(head) + "\n" + code + "\n")
        out = subprocess.run([sys.executable, prog], cwd=box,
                             capture_output=True, text=True, timeout=20)
    if out.returncode != 0:
        raise RuntimeError(out.stderr.strip().splitlines()[-1] if out.stderr else "failed")
    text = out.stdout
    if text.endswith("\n"):
        text = text[:-1]
    return text.split("\n") if text else []


def run_sql(query):
    db = sqlite3.connect(":memory:")
    db.execute("CREATE TABLE pet (name TEXT, kind TEXT, age INTEGER)")
    db.executemany("INSERT INTO pet VALUES (?,?,?)", PET)
    return [" ".join(str(v) for v in row) for row in db.execute(query)]


def solutions():
    out = {}
    if not os.path.isdir(SOLS):
        return out
    for name in sorted(os.listdir(SOLS)):
        if name.endswith(".json"):
            with open(os.path.join(SOLS, name)) as f:
                out.update(json.load(f).get("solutions", {}))
    return out


def squash(text):
    return re.sub(r"\s+", " ", text).strip()


def questions():
    out = []
    if not os.path.isdir(BANK):
        return out
    for name in sorted(os.listdir(BANK)):
        if name.endswith(".json"):
            with open(os.path.join(BANK, name)) as f:
                out.extend(json.load(f)["questions"])
    return out


def marker_norm(s):
    """Output compared the way the marker compares it: case and spacing ignored."""
    lines = [l.strip() for l in str(s).replace("\r", "").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(" ".join(l.split()) for l in lines).lower()


def answers_question(eg, q):
    """True when this example, run as a program, passes every test of q."""
    code = ("import builtins as _b\n_real = _b.input\n"
            "_b.input = lambda prompt='': _real()\n") + "\n".join(eg)
    for t in q.get("tests") or []:
        with tempfile.TemporaryDirectory() as box:
            for name, body in (t.get("files") or {}).items():
                with open(os.path.join(box, name), "w") as fh:
                    fh.write(body)
            try:
                p = subprocess.run([sys.executable, "-I", "-c", code],
                                   input="\n".join(t.get("in") or []) + "\n",
                                   capture_output=True, text=True, timeout=10, cwd=box)
            except subprocess.TimeoutExpired:
                return False
        if p.returncode != 0:
            return False
        if marker_norm(p.stdout) != marker_norm("\n".join(t.get("out") or [])):
            return False
    return True


def main():
    data = groups()
    ran = failed = 0
    problems = []
    entries = 0

    print("Groups, in the order upTo() returns them:")
    for g in data:
        print("  lesson %-2d  %-32s %2d entries" % (g["lesson"], g["name"], len(g["items"])))
        entries += len(g["items"])
    print("  %d groups, %d entries\n" % (len(data), entries))

    for g in data:
        for it in g["items"]:
            eg = it.get("eg")
            if not eg:
                continue
            want = it.get("egOut", [])
            ran += 1
            first = next((l for l in eg if l.strip() and not l.strip().startswith("#")), "")
            try:
                if first.strip().upper().startswith("SELECT"):
                    got = run_sql("\n".join(eg))
                else:
                    got = run_python(eg, db=any("db.execute" in l for l in eg))
            except Exception as err:          # a broken example is a failure
                got = ["<error: %s>" % err]
            if got != list(want):
                failed += 1
                problems.append((g["name"], it["syntax"], want, got))

    sols = solutions()
    clashes = []
    for g in data:
        for it in g["items"]:
            block = squash("\n".join(it.get("eg") or []))
            if not block:
                continue
            for qid, sol in sols.items():
                if block and block in squash(sol):
                    clashes.append((it["syntax"], qid))

    print("Examples run: %d   disagreeing with egOut: %d" % (ran, failed))
    for name, syntax, want, got in problems:
        print("\n  %s - %s" % (name, syntax))
        print("    egOut: %r" % (want,))
        print("    ran  : %r" % (got,))

    if sols:
        print("\nModel solutions checked: %d   examples found inside one: %d"
              % (len(sols), len(clashes)))
        for syntax, qid in clashes:
            print("  %s appears in %s" % (syntax, qid))
    else:
        print("\nNo answers/codebank/ here, so nothing to compare examples against.")

    qs = questions()
    solves = []
    pairs = 0
    for g in data:
        for it in g["items"]:
            if not it.get("eg"):
                continue
            for q in qs:
                pairs += 1
                if answers_question(it["eg"], q):
                    solves.append((g["name"], it["syntax"], q["id"]))
    print("\nExample against question: %d pairs run   examples that answer a question: %d"
          % (pairs, len(solves)))
    for name, syntax, qid in solves:
        print("  %s / %s passes every test of %s" % (name, syntax, qid))

    return 1 if failed or clashes or solves else 0


if __name__ == "__main__":
    sys.exit(main())
