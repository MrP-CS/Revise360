"""Work out the answers again, independently, and see whether they agree.

Section 67: do not trust a generated answer. So for every question whose answer
can be computed, this computes it here - from the question's own inputs, with
code that has nothing to do with the code that wrote the bank - and compares.

  python3 tools/revverify.py
  python3 tools/revverify.py --topic 1.2

  calculation   `working` is an arithmetic expression in the question. It is
                evaluated here, from the numbers in it, and must equal `answer`.
  conversion    `verify` gives the value and the bases. The conversion is done
                here by repeated division and lookup, not by the language's own
                formatter, so a formatting mistake in the builder cannot agree
                with itself.
  addition      the two binary strings are added as integers and re-rendered.
  shift         the shift is done by moving characters, and the arithmetic
                meaning is checked separately.
  truth table   the Boolean expression is evaluated for every row.
  code output   the program is run, and its output compared with the answer.
  trace table   the program is run with a line tracer, and every row of the
                table has to be a state the program really passes through, in
                the order the table gives them.

A question whose answer cannot be recomputed is listed as unverified rather than
passed over, because "0 problems" out of nothing checked is the number this tool
exists to avoid printing.
"""
import ast
import io
import operator
import subprocess
import sys
import tempfile
import pathlib

import revschema as S

DIGITS = "0123456789abcdef"
OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
       ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
       ast.Mod: operator.mod, ast.Pow: operator.pow, ast.USub: operator.neg}


def arith(expr):
    """Evaluate an arithmetic expression of numbers and operators, and nothing
    else. No names, no calls: a `working` field is a sum, not a program."""
    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.operand))
        raise ValueError("working may only contain numbers and + - * / // %% ** : %r"
                         % ast.dump(n))
    return ev(ast.parse(expr, mode="eval"))


def to_base(value, base, bits=None):
    """Repeated division, by hand. Deliberately not the language's own binary
    formatter: if the builder used that and so did this, a bug in it would agree
    with itself and both would be wrong together."""
    if value == 0:
        out = "0"
    else:
        v, out = abs(int(value)), ""
        while v:
            out = DIGITS[v % base] + out
            v //= base
    if bits and base == 2:
        out = out.rjust(bits, "0")
    if bits and base == 16:
        out = out.rjust(bits // 4, "0")
    return out


def from_base(text, base):
    v = 0
    for ch in str(text).strip().lower().replace(" ", ""):
        v = v * base + DIGITS.index(ch)
    return v


def tidy(s):
    return str(s).strip().lower().replace(" ", "")


def check_convert(q):
    v = q.get("verify")
    if not v:
        return None, "no verify block"
    val = v["value"]
    if v.get("from") in ("binary", "hex"):
        val = from_base(val, 2 if v["from"] == "binary" else 16)
    if v["to"] == "denary":
        want = str(val)
    else:
        want = to_base(val, 2 if v["to"] == "binary" else 16, v.get("bits"))
    return tidy(want) == tidy(q["answer"]), "computed %s" % want


def check_binadd(q):
    v = q.get("verify")
    if not v:
        return None, "no verify block"
    bits = v.get("bits", 8)
    total = from_base(v["a"], 2) + from_base(v["b"], 2)
    carried = total >= 1 << bits
    want = to_base(total % (1 << bits), 2, bits)
    if carried != bool(q.get("overflow")):
        return False, ("overflows into %d bits but the question does not say so" % bits
                       if carried else "does not overflow but the question says it does")
    return tidy(want) == tidy(q["answer"]), "computed %s" % want


def check_binshift(q):
    v = q.get("verify")
    if not v:
        return None, "no verify block"
    bits, n = v.get("bits", 8), v["places"]
    src = to_base(v["value"], 2, bits) if isinstance(v["value"], int) else tidy(v["value"])
    if v["dir"] == "left":
        want = (src[n:] + "0" * n)[-bits:].rjust(bits, "0")
        meaning = from_base(src, 2) * (2 ** n)
    else:
        want = ("0" * n + src)[:bits]
        meaning = from_base(src, 2) // (2 ** n)
    ok = tidy(want) == tidy(q["answer"])
    # And the arithmetic meaning, which is the point of teaching shifts at all.
    if v["dir"] == "left" and meaning < (1 << bits) and from_base(want, 2) != meaning:
        return False, "the pattern is right but it is not value x %d" % (2 ** n)
    return ok, "computed %s" % want


def check_num(q):
    w = q.get("working")
    if not w:
        return None, "no working to check it against"
    got = arith(w)
    tol = q.get("tolerance") or 0
    return abs(got - q["answer"]) <= tol + 1e-9, "working gives %s" % got


BOOL = {"AND": " and ", "OR": " or ", "NOT": " not ", "XOR": " != "}


def check_truth(q):
    expr = q.get("expr")
    if not expr:
        return None, "no Boolean expression to evaluate"
    names = [c for c in q["cols"] if c != (q.get("out") or "Q")]
    py = expr
    for k, v in BOOL.items():
        py = py.replace(k, v)
    bad = []
    for r, row in enumerate(q["answer"]):
        env = {}
        for i, nm in enumerate(names):
            env[nm] = bool(int(row[i]))
        try:
            got = int(bool(eval(py, {"__builtins__": {}}, env)))
        except Exception as e:                                  # noqa: BLE001
            return False, "the expression would not evaluate: %s" % e
        want = row[len(names)]
        if str(got) != str(want):
            bad.append("row %d: %s gives %d, the table says %s"
                       % (r + 1, " ".join("%s=%s" % (n, row[i]) for i, n in enumerate(names)),
                          got, want))
    return (not bad), ("; ".join(bad[:3]) if bad else "all %d rows agree" % len(q["answer"]))


def run_python(src, stdin=""):
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(src)
        path = f.name
    try:
        p = subprocess.run([sys.executable, path], input=stdin, capture_output=True,
                           text=True, timeout=10)
        return p.stdout, p.stderr
    finally:
        pathlib.Path(path).unlink(missing_ok=True)


def check_codeout(q):
    if q.get("lang") not in (None, "python"):
        return None, "not a Python program"
    out, err = run_python(q["code"], q.get("stdin") or "")
    if err.strip():
        return False, "the program failed: " + err.strip().splitlines()[-1]
    got = out.strip()
    accepted = [q["answer"]] + list(q.get("alsoAccept") or [])
    ok = any(got == str(a).strip() for a in accepted)
    return ok, "the program prints %r" % got


# The program is run inside a function, not at the top level. sys.settrace only
# takes effect for frames entered after it is set, so tracing a module that is
# already running recorded nothing at all - and "nothing recorded" looked exactly
# like "the table does not match", which is the wrong thing to be told.
TRACER = """
import sys, json
_rows = []
_want = %(cols)r
def _tr(frame, event, arg):
    if event in ('call', 'line') and frame.f_code.co_name == '_main':
        st = [str(frame.f_locals.get(c, '')) for c in _want]
        if not _rows or _rows[-1] != st:
            _rows.append(st)
    return _tr

def _main():
%(code)s

sys.settrace(_tr)
try:
    _main()
finally:
    sys.settrace(None)
    sys.stderr.write('@@TRACE@@' + json.dumps(_rows))
"""


def check_trace(q):
    """Every row of the table has to be a state the program really reaches, and
    they have to be reached in the order the table gives.

    This runs the program with a line tracer and collects the states of the
    traced variables. It does not try to decide which states belong on which row
    - a trace table is a teaching convention, not something a program announces -
    so it checks the stronger and simpler thing: that the rows are a subsequence
    of what really happened."""
    if not q.get("code"):
        return None, "no program to run"
    cols = [c for c in q["cols"] if c.lower() not in ("output", "out")]
    body = "\n".join("    " + ln for ln in q["code"].split("\n"))
    src = TRACER % {"cols": cols, "code": body}
    out, err = run_python(src)
    if "@@TRACE@@" not in err:
        return False, "the program failed: " + (err.strip().splitlines() or ["no output"])[-1]
    import json
    states = json.loads(err.split("@@TRACE@@", 1)[1])
    idx = 0
    for r, row in enumerate(q["answer"]):
        want = [str(row[q["cols"].index(c)]) for c in cols]
        while idx < len(states) and states[idx] != want:
            idx += 1
        if idx >= len(states):
            return False, ("row %d (%s) is not a state the program reaches after the rows "
                           "before it" % (r + 1, ", ".join("%s=%s" % (c, v) for c, v in zip(cols, want))))
        idx += 1
    return True, "all %d rows occur in order" % len(q["answer"])


CHECKS = {"convert": check_convert, "binadd": check_binadd, "binshift": check_binshift,
          "num": check_num, "truth": check_truth, "codeout": check_codeout,
          "trace": check_trace}


def main():
    topics = None
    if "--topic" in sys.argv:
        topics = [sys.argv[sys.argv.index("--topic") + 1]]
    bank = S.load_bank(topics)
    done, skipped, bad = 0, [], []
    for q in bank:
        f = CHECKS.get(q["type"])
        if not f:
            continue
        ok, why = f(q)
        if ok is None:
            skipped.append("%s  %s" % (q["id"], why))
        elif ok:
            done += 1
        else:
            bad.append("%s  %s" % (q["id"], why))
    could = sum(1 for q in bank if q["type"] in CHECKS)
    print("%d of %d computable answers worked out again here and agreed" % (done, could))
    for s in skipped:
        print("  not checked  " + s)
    for b in bad:
        print("  DISAGREES    " + b)
    print()
    print("every answer that can be recomputed was" if not bad and not skipped
          else ("%d disagreement(s)" % len(bad) if bad
                else "%d answer(s) nothing here can check" % len(skipped)))
    return 1 if bad or skipped else 0


if __name__ == "__main__":
    sys.exit(main())
