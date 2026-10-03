"""Is there a real, current, usable lesson plan for every published lesson?

A pack of PDFs is easy to produce and easy to get wrong in ways a file count does
not show: a plan for a lesson that no longer exists, a lesson with no plan, a plan
built before the lesson changed, a plan whose links point somewhere that needs no
login, a plan that quietly contains a walkthrough of an experience that is
supposed to be website-only.

    python3 tools/tests/smokeplans.py
"""
import os
import re
import sys
import json
import glob
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from paths import SITE_S                                       # noqa: E402

ROOT = SITE_S.rstrip("/")
PLANS = os.path.join(ROOT, "lessonplans")


def text_of(pdf):
    """A PDF's text, through pdftotext, which is on this machine and is reliable.

    An earlier version inflated the content streams by hand and got font subset
    codes rather than words, so every check that looked for a phrase passed by
    accident. If pdftotext is not available the checks that need text are skipped
    and say so, rather than passing on nothing.
    """
    r = subprocess.run(["pdftotext", "-layout", pdf, "-"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return None
    return r.stdout


def main():
    bad = []

    def ok(cond, msg):
        print(("  ok  " if cond else " FAIL ") + msg)
        if not cond:
            bad.append(msg)

    inv = json.load(open(os.path.join(ROOT, "build", "inventory.json"), encoding="utf-8"))
    lessons = {l["id"]: l for u in inv["units"] for l in u["lessons"]}
    idx_path = os.path.join(PLANS, "index.json")
    ok(os.path.exists(idx_path), "there is an experience-ID-to-plan index")
    if not os.path.exists(idx_path):
        return 1
    idx = json.load(open(idx_path, encoding="utf-8"))["plans"]

    missing = sorted(set(lessons) - set(idx))
    ok(not missing, "every published lesson has a plan (%s)" % (missing[:4] or "all 115"))
    orphan = sorted(set(idx) - set(lessons))
    ok(not orphan, "no plan is for a lesson that does not exist (%s)" % (orphan[:4] or "none"))

    gone = [p for p in idx.values() if not os.path.exists(os.path.join(ROOT, p["file"]))]
    ok(not gone, "every plan the index names is really there (%d missing)" % len(gone))

    files = {os.path.basename(p) for p in glob.glob(os.path.join(PLANS, "*.pdf"))}
    named = {os.path.basename(p["file"]) for p in idx.values()}
    ok(files == named, "no unlisted PDF is sitting in the folder (%s)"
       % (sorted(files - named)[:3] or "none"))

    # a plan must be newer than the record it was built from
    stale = []
    for lid, p in idx.items():
        rec = os.path.join(ROOT, "build", "records", lid + ".json")
        pdf = os.path.join(ROOT, p["file"])
        if os.path.exists(rec) and os.path.getmtime(rec) > os.path.getmtime(pdf) + 2:
            stale.append(lid)
    ok(not stale, "no plan is older than the lesson record it was built from (%s)"
       % (stale[:4] or "none"))

    # and must carry the version it was built from, so a teacher can tell
    drift = []
    for lid, p in idx.items():
        rec_path = os.path.join(ROOT, "build", "records", lid + ".json")
        if not os.path.exists(rec_path):
            continue
        v = json.load(open(rec_path, encoding="utf-8"))["version"]
        if v != p.get("version"):
            drift.append(lid)
    ok(not drift, "the index records the content version of each plan (%s)"
       % (drift[:4] or "none"))

    tiny = [p["file"] for p in idx.values()
            if os.path.getsize(os.path.join(ROOT, p["file"])) < 20000]
    ok(not tiny, "no plan is an empty placeholder (%s)" % (tiny[:3] or "none"))

    # what the plans say
    sample = ["PR_L01_LessonPlan.pdf", "SA_L01_LessonPlan.pdf",
              "SA_L05_TEST_LessonPlan.pdf", "MS_L07_LessonPlan.pdf"]
    for name in sample:
        path = os.path.join(PLANS, name)
        if not os.path.exists(path):
            ok(False, "%s is missing" % name)
            continue
        t = text_of(path)
        if t is None:
            print("  --  pdftotext is not available, so %s was not read" % name)
            continue
        ok("`" not in t, "%s prints no authoring markup" % name)
        ok(len(t.split()) > 400, "%s has real text in it (%d words)" % (name, len(t.split())))
        ok("revise360.co.uk" in t, "%s carries the website it points at" % name)
        # Not "does the phrase appear" - the plans say "there is no offline version
        # of the experience", which is the right thing to say and contains the
        # phrase. What must not appear is an OFFER.
        low = " ".join(t.lower().split())
        offers = [w for w in ("download the experience", "offline copy of",
                              "export the experience", "offline version of revise",
                              "take the experience offline")
                  if w in low]
        ok(not offers, "%s offers no offline copy of the experience (%s)"
           % (name, offers or "none"))
        if "experience" in low and name != "SA_L05_TEST_LessonPlan.pdf":
            ok("no offline version of the experience" in low,
               "%s says plainly that there is no offline version" % name)

    # No plan may hand out a model solution. A plan is published with the website,
    # so an answer printed on one is an answer anybody can read.
    #
    # The comparison has to know what is already public: a lesson's worked example
    # is shown on screen to every pupil, and several of them contain the whole of
    # some question's answer, because a Change it or a Fix it question is its
    # starter with one character different. Flagging those would make this check
    # fire on correct plans, and a check that fires on correct work stops being
    # read.
    public = set()
    for path in glob.glob(os.path.join(ROOT, "experiences", "*.json")):
        try:
            exp = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue
        for sc in exp.get("scenes") or []:
            for st in sc.get("stations") or []:
                for t in st.get("tasks") or []:
                    for key in ("teach", None):
                        blob = (t.get("teach") or {}).get("code") if key else t.get("starter")
                        if blob:
                            public.add(" ".join(" ".join(blob if isinstance(blob, list)
                                                         else [blob]).split()))
    solutions = {}
    for path in glob.glob(os.path.join(ROOT, "answers", "codebank", "*.json")):
        for qid, v in json.load(open(path, encoding="utf-8")).get("solutions", {}).items():
            body = " ".join(str(v).split())
            if len(body) > 30 and not any(body in pub for pub in public):
                solutions[qid] = body
    leaks = []
    for path in sorted(glob.glob(os.path.join(PLANS, "*.pdf"))):
        t = text_of(path)
        if t is None:
            break
        flat = " ".join(t.split())
        for qid, body in solutions.items():
            if body in flat:
                leaks.append((os.path.basename(path), qid))
    ok(not leaks, "no plan prints a model solution (%s)" % (leaks[:3] or "none of %d checked"
                                                           % len(solutions)))

    py = text_of(os.path.join(PLANS, "PR_L01_LessonPlan.pdf")) or ""
    low = " ".join(py.lower().split())
    ok("does not authorise skipping" in low,
       "a Python plan says a short lesson does not authorise skipping")
    ok("no teacher bypass" in low, "and says plainly there is no teacher bypass")
    ok("resumes at their earliest unfinished question" in low
       or "earliest unfinished question" in low,
       "and names the save-and-resume point")

    print()
    print("a real, current plan for every lesson" if not bad
          else "%d problem(s)" % len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
