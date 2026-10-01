"""Check our written content against a reference we must not copy from.

Everything on this platform is written for it. Reference books and other
people's resources are read for what a specification requires, never for
wording, tasks or test data. This proves that mechanically.

It looks for runs of six words shared between the reference and our content.
Five words or fewer is ordinary English - "write a program that reads a" - and
matches constantly. Six in a row is the point where a match usually means the
sentence came from somewhere.

    python3 qcorig.py <reference.pdf|reference.txt> [more references ...]

Give it the PDF or text of whatever is being checked against. Nothing it reads
is copied into the repository. A clean run prints the one line; anything shared
is printed with the file it is in, to be judged by eye - a generic phrase such
as "at the end of a line" is not an infringement, a whole sentence is.
"""
import os, sys, re, json, glob, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RUN = 6


def text_of(path):
    if path.lower().endswith(".pdf"):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "t.txt")
            subprocess.run(["pdftotext", "-layout", path, out], capture_output=True)
            if not os.path.isfile(out):
                sys.exit("pdftotext could not read " + path)
            return open(out, encoding="utf-8", errors="ignore").read()
    return open(path, encoding="utf-8", errors="ignore").read()


def words(s):
    return re.findall(r"[a-z0-9_']+", s.lower())


def runs(ws, n=RUN):
    return {" ".join(ws[i:i + n]) for i in range(len(ws) - n + 1)}


def ours():
    """Every piece of writing a pupil or teacher reads, plus the question bank
    and its model solutions - which live outside the repository, so they are
    only checked on a machine that has them."""
    out = []
    for pat in ("experiences/*.json", "tools/codebank/*.json", "answers/codebank/*.json"):
        for f in sorted(glob.glob(os.path.join(ROOT, pat))):
            if f.endswith("registry.json"):
                continue
            out.append((os.path.relpath(f, ROOT), json.dumps(json.load(open(f, encoding="utf-8")))))
    for pat in ("tools/specs*.py", "tools/js/*.js", "js/diag-*.js"):
        for f in sorted(glob.glob(os.path.join(ROOT, pat))):
            out.append((os.path.relpath(f, ROOT), open(f, encoding="utf-8").read()))
    return out


def main(paths):
    if not paths:
        print(__doc__.strip().split("\n\n")[-1])
        return 1
    ref = set()
    for p in paths:
        ref |= runs(words(text_of(p)))
    mine = ours()
    shared, total = {}, 0
    for name, body in mine:
        hit = sorted(r for r in runs(words(body)) if r in ref)
        total += len(hit)
        if hit:
            shared[name] = hit
    print(f"{len(ref):,} {RUN}-word runs in the reference, {len(mine)} of our files checked")
    for name in sorted(shared):
        print(f"\n{name}")
        for h in shared[name]:
            print(f"    {h!r}")
    if not total:
        print(f"Nothing in our content repeats {RUN} words of the reference in a row.")
    else:
        print(f"\n{total} shared run(s) to judge by eye.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
