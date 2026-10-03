"""Are the printed guides real, and are they still telling the truth?

A PDF on the site is the one thing nobody notices has gone stale: the course can
be rebuilt underneath it and the file still downloads perfectly. So this checks
three things.

1. Both guides exist, are real PDFs, and are long enough to be the real thing.
2. Neither is older than anything it is built from - the question bank, the
   syntax reference, the lesson specs or the generator itself.
3. The figures printed in the course guide still match the course: the number of
   activities, how many there are of each kind, and the thirteen lesson titles.

    python3 tools/tests/smokeguides.py

If it fails on staleness or figures, rebuild them:

    R360_PLEX=<fonts> python3 tools/mkguides.py
"""
import os
import re
import sys
import json
import glob
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
ROOT = os.path.dirname(TOOLS)
sys.path.insert(0, TOOLS)

GUIDES = {
    "course": os.path.join(ROOT, "guides", "Revise360_Python_Course_Guide.pdf"),
    "syntax": os.path.join(ROOT, "guides", "Revise360_Python_Syntax_Guide.pdf"),
}
SOURCES = (glob.glob(os.path.join(TOOLS, "codebank", "pr-l*.json"))
           + [os.path.join(ROOT, "js", "pyref.js"),
              os.path.join(ROOT, "js", "pyide.js"),
              os.path.join(ROOT, "js", "player.js"),
              os.path.join(TOOLS, "specspy.py"),
              os.path.join(TOOLS, "mkguides.py")])


def text_of(pdf):
    """The words in a PDF, without a library: pdftotext if it is here, and
    otherwise the uncompressed text operators, which is enough for figures."""
    try:
        out = subprocess.run(["pdftotext", "-layout", pdf, "-"],
                             capture_output=True, text=True, timeout=60)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    import zlib
    raw = open(pdf, "rb").read()
    text = []
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", raw, re.S):
        try:
            body = zlib.decompress(m.group(1))
        except zlib.error:
            continue
        for t in re.finditer(rb"\((?:[^()\\]|\\.)*\)", body):
            text.append(t.group(0)[1:-1].decode("latin-1", "replace"))
    return " ".join(text)


def main():
    bad = []
    for name, path in GUIDES.items():
        if not os.path.isfile(path):
            bad.append("the %s guide is missing: %s" % (name, path))
            continue
        head = open(path, "rb").read(5)
        if head[:4] != b"%PDF":
            bad.append("the %s guide is not a PDF" % name)
        size = os.path.getsize(path)
        if size < 20000:
            bad.append("the %s guide is only %d bytes, so it is not the real thing" % (name, size))
        newest = max(os.path.getmtime(f) for f in SOURCES if os.path.isfile(f))
        if os.path.getmtime(path) < newest - 1:
            older = sorted((f for f in SOURCES
                            if os.path.isfile(f) and os.path.getmtime(f) > os.path.getmtime(path)),
                           key=os.path.getmtime, reverse=True)
            bad.append("the %s guide is older than %s - rebuild it with tools/mkguides.py"
                       % (name, ", ".join(os.path.basename(f) for f in older[:3])))
        print("  %-7s %6.0f KB  %s" % (name, size / 1024, os.path.basename(path)))

    # the figures the course guide quotes have to be the course's own
    if os.path.isfile(GUIDES["course"]):
        import collections
        kinds = collections.Counter()
        total = 0
        titles = []
        import specspy
        for n in range(1, 14):
            L = getattr(specspy, "L%d" % n)
            titles.append(L["title"])
            qs = json.load(open(os.path.join(TOOLS, "codebank", L["id"] + ".json"),
                                encoding="utf-8"))["questions"]
            total += len(qs)
            kinds.update(q.get("kind") or "build" for q in qs)
        words = " ".join(text_of(GUIDES["course"]).split())
        want = ("there are %d activities: %d to run, %d to predict, %d to change, %d to complete, "
                "%d to fix and %d to write" % (total, kinds["try"], kinds["predict"],
                                               kinds["change"], kinds["complete"],
                                               kinds["debug"], kinds["build"]))
        if want not in words:
            bad.append("the course guide does not quote the course's own figures (%s)" % want)
        missing = [t for t in titles if t not in words]
        if missing:
            bad.append("the course guide does not list these lessons: %s" % ", ".join(missing))
        print("  figures: %s" % want)

    print()
    for b in bad:
        print("  " + b)
    print("the printed guides are real and in step" if not bad else "%d problem(s)" % len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
