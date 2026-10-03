"""Do the two copies of the marks rule agree about every activity in the course?

What an activity is worth is decided twice: `Store.marks` in js/store.js, which is
what a pupil's score is built from, and `task_marks` in tools/kit.py, which is
what the station totals, the lesson records and a teacher's pack are built from.
Two copies of one rule is a bad arrangement, but they cannot be merged: one runs
in a browser and the other in a build, and neither can call the other.

So this runs both over all 614 activities of every published lesson and fails on
any disagreement. It found one the day it was written: "arena" was worth nothing
in JavaScript and fell through to a crash in Python.

    PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tools/tests/smokemarks.py
"""
import os
import sys
import json
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from paths import SITE_S                                       # noqa: E402
from kit import task_marks                                     # noqa: E402

ROOT = SITE_S.rstrip("/")


def main():
    from playwright.sync_api import sync_playwright
    tasks = []
    for path in sorted(glob.glob(os.path.join(ROOT, "experiences", "*.json"))):
        try:
            exp = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue
        if "scenes" not in exp:
            continue
        for sc in exp["scenes"]:
            for si, st in enumerate(sc.get("stations") or []):
                for ti, t in enumerate(st.get("tasks") or []):
                    tasks.append(("%s/%s/%d/%d" % (exp["id"], sc.get("id"), si, ti), t))

    mine = []
    for where, t in tasks:
        try:
            mine.append(task_marks(t))
        except Exception as e:
            mine.append("python raised %s" % type(e).__name__)

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        pg = b.new_page()
        # store.js is a module for a page, so it needs the page's config to exist
        # before it runs. Nothing else about the page matters here.
        pg.set_content("<script>window.APP_CONFIG = {};</script><script>%s</script>"
                       % open(os.path.join(ROOT, "js", "store.js"), encoding="utf-8").read())
        if not pg.evaluate("() => !!(window.Store && window.Store.marks)"):
            print(" FAIL js/store.js did not define Store.marks on a bare page")
            b.close()
            return 1
        theirs = pg.evaluate("""ts => ts.map(t => {
            try { return window.Store.marks(t); }
            catch (e) { return "javascript threw " + e.name; }
        })""", [t for _, t in tasks])
        b.close()

    bad = [(where, a, b2) for (where, _), a, b2 in zip(tasks, mine, theirs) if a != b2]
    print("%d activity(ies) across %d lesson(s)"
          % (len(tasks), len(set(w.split("/")[0] for w, _ in tasks))))
    for where, a, b2 in bad[:20]:
        print(" FAIL %s: tools/kit.py says %r, js/store.js says %r" % (where, a, b2))
    if len(bad) > 20:
        print(" FAIL ... and %d more" % (len(bad) - 20))
    print()
    if bad:
        kinds = sorted({json.dumps(t.get("t")) for (w, t), a, b2
                        in zip(tasks, mine, theirs) if a != b2})
        print("%d disagreement(s), on task type(s): %s" % (len(bad), ", ".join(kinds)))
        return 1
    print("the build and the browser agree on what every activity is worth")
    return 0


if __name__ == "__main__":
    sys.exit(main())
