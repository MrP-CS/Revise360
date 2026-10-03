"""What is actually in this course, discovered rather than assumed.

Everything downstream - lesson plans, unit packs, coverage maps, the public
resource counts on the home page - reads this instead of hard-coding a list that
goes stale the first time a lesson is added.

It answers, for every published experience:

  which topic and unit it belongs to, and where it sits in the order;
  which module builds it, or that nothing does and it is hand-authored;
  which slide deck, worksheet, teacher answers and lesson plan it has;
  whether each of those files is actually on disk;
  whether it is public, student-facing or teacher-only;
  and which files must never leave the website.

    python3 inventory.py              # a readable summary and the gaps
    python3 inventory.py --json       # the whole record, for other tools
    python3 inventory.py --check      # exit 1 if anything is missing or orphaned

The record is written to build/inventory.json. It is a build artefact, not a
hand-maintained file: regenerate it rather than editing it.
"""
import os
import re
import sys
import json
import glob
import importlib
import collections

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S, OUT_S

ROOT = os.path.dirname(HERE)

# A unit is a topic: the thing a teacher buys, plans and downloads in one go.
# The Python course is a unit too, even though it is not a specification topic.
SPEC = "OCR GCSE Computer Science J277"

# What may never be put in a downloadable teaching package, by where it lives.
# Section 13B of the brief: the experiences are the online product.
WEBSITE_ONLY = [
    "experiences/",          # scene definitions, station data, question banks
    "js/",                   # the player, the runtime, the editor
    "css/",
    "vendor/",
    "assets/",
    "media/",
    "backend/",
    "answers/",              # teacher keys - separate release, never in a student pack
]


def modules():
    """Every lesson-spec module, and the lessons each one builds."""
    out = {}
    for f in sorted(glob.glob(os.path.join(HERE, "specs*.py"))):
        name = os.path.basename(f)[:-3]
        try:
            M = importlib.import_module(name)
        except Exception as e:                       # a broken module is a finding
            out[name] = {"error": str(e), "lessons": []}
            continue
        ls = []
        for attr in dir(M):
            if not re.fullmatch(r"L\d+", attr):
                continue
            L = getattr(M, attr)
            if not isinstance(L, dict) or "id" not in L:
                continue
            ls.append((int(attr[1:]), attr, L))
        ls.sort()
        out[name] = {"lessons": [dict(attr=a, id=L["id"], topic=L.get("topic"),
                                      lesson=L.get("lesson"), title=L.get("title"),
                                      img=L.get("img"),
                                      stations=[s["name"] for s in L.get("stations", [])],
                                      keywords=L.get("keywords", []),
                                      has_ws="ws" in L,
                                      objectives=(L.get("ws") or {}).get("objectives", []))
                                 for _n, a, L in ls]}
    return out


def on_disk(rel):
    """Is this site-relative path actually there? Query strings are cache busters."""
    if not rel:
        return None
    return os.path.isfile(os.path.join(ROOT, rel.split("?")[0]))


def build():
    reg = json.load(open(os.path.join(ROOT, "experiences", "registry.json"), encoding="utf-8"))
    topics_file = json.load(open(os.path.join(ROOT, "experiences", "topics.json"), encoding="utf-8"))
    mods = modules()

    # id -> the module and lesson dict that builds it
    built_by = {}
    for mod, info in mods.items():
        for L in info.get("lessons", []):
            built_by[L["id"]] = dict(module=mod, **L)

    units = collections.OrderedDict()
    for g in topics_file.get("groups", []):
        for t in g.get("topics", []):
            units[t["id"]] = dict(id=t["id"], title=t["title"], group=g.get("name"),
                                  eyebrow=t.get("eyebrow"), description=t.get("description"),
                                  guides=[g2.get("file") for g2 in t.get("guides", [])],
                                  lessons=[])

    problems = []
    for e in reg.get("experiences", []):
        tid = e.get("topic")
        if tid not in units:
            problems.append("%s is in topic %r, which no topic list names" % (e.get("id"), tid))
            units.setdefault(tid, dict(id=tid, title="(not in topics.json)", group=None,
                                       description="", guides=[], lessons=[]))
        src = built_by.get(e["id"])
        bank = os.path.join(HERE, "codebank", e["id"] + ".json")
        rec = dict(
            id=e["id"], topic=tid, lesson=e.get("lesson"), title=e.get("title"),
            kind=("worksheet" if e.get("type") == "worksheet"
                  else "challenge" if (e.get("sprint") or e.get("badge")) else "experience"),
            description=e.get("description"),
            route="experience.html?id=" + e["id"] if e.get("type") != "worksheet" else None,
            source_module=src["module"] if src else None,
            stations=src["stations"] if src else [],
            objectives=src["objectives"] if src else [],
            keywords=src["keywords"] if src else [],
            scene=("experiences/%s.json" % e["id"]) if e.get("type") != "worksheet" else None,
            code_bank=("tools/codebank/%s.json" % e["id"]) if os.path.isfile(bank) else None,
            deck=e.get("powerpoint"), worksheet=e.get("worksheet"),
            audience="student",
        )
        for key in ("scene", "deck", "worksheet"):
            rec[key + "_ok"] = on_disk(rec[key])
            if rec[key] and not rec[key + "_ok"]:
                problems.append("%s: %s is listed but not on disk (%s)" % (e["id"], key, rec[key]))
        # where a canonical record for this lesson has to come from
        rec["source"] = ("module" if rec["source_module"]
                         else "derived" if rec["scene_ok"] or rec["worksheet_ok"]
                         else "missing")
        if rec["source"] == "missing":
            problems.append("%s has neither a specs module nor a published scene or "
                            "worksheet, so there is nothing to build a record from" % e["id"])
        # A challenge activity is a game, not a taught lesson: it has no deck or
        # worksheet by design, and demanding one would be a false alarm.
        if rec["kind"] == "experience":
            if not rec["deck"]:
                problems.append("%s has no lesson PowerPoint" % e["id"])
            if not rec["worksheet"]:
                problems.append("%s has no worksheet" % e["id"])
        if rec["kind"] == "worksheet" and not rec["worksheet"]:
            problems.append("%s is a paper assessment with no worksheet" % e["id"])
        units[tid]["lessons"].append(rec)

    # lessons a module builds that nothing publishes
    published = {e["id"] for e in reg.get("experiences", [])}
    for lid, src in sorted(built_by.items()):
        if lid not in published:
            problems.append("%s is built by %s but is not in the registry, so no pupil can "
                            "reach it" % (lid, src["module"]))

    # every file on the site that belongs to a lesson, so a pack can be built from
    # an allowlist rather than from a directory sweep
    for u in units.values():
        u["lessons"].sort(key=lambda r: (r["lesson"] or 99, r["id"]))
        u["counts"] = collections.Counter(r["kind"] for r in u["lessons"])
        u["decks"] = [r["deck"] for r in u["lessons"] if r["deck"]]
        u["worksheets"] = [r["worksheet"] for r in u["lessons"] if r["worksheet"]]

    stray = []
    for folder, pattern in (("presentations", "*.pptx"), ("worksheets", "*.docx")):
        listed = {os.path.basename((r[("deck" if folder == "presentations" else "worksheet")] or "").split("?")[0])
                  for u in units.values() for r in u["lessons"]}
        for f in sorted(glob.glob(os.path.join(ROOT, folder, pattern))):
            if os.path.basename(f) not in listed:
                stray.append(os.path.relpath(f, ROOT))
    for s in stray:
        problems.append("%s is on the site but no lesson links to it" % s)

    return dict(spec=SPEC, baseline=head(), units=list(units.values()),
                modules={k: len(v.get("lessons", [])) for k, v in mods.items()},
                website_only=WEBSITE_ONLY, problems=problems, stray=stray)


def head():
    import subprocess
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%H %cI %s"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
        sha, when, subject = out.split(" ", 2)
        return dict(commit=sha, when=when, subject=subject)
    except Exception:
        return dict(commit=None)


def main(argv):
    inv = build()
    os.makedirs(OUT_S, exist_ok=True)
    path = os.path.join(OUT_S, "inventory.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(inv, fh, indent=1, ensure_ascii=False)

    if "--json" in argv:
        print(json.dumps(inv, indent=1, ensure_ascii=False))
        return 0

    b = inv["baseline"]
    print("baseline  %s  %s" % ((b.get("commit") or "?")[:10], b.get("subject", "")))
    print("%d units, %d published lessons" %
          (len(inv["units"]), sum(len(u["lessons"]) for u in inv["units"])))
    print()
    print("  %-5s %-46s %5s %5s %5s %5s" % ("unit", "title", "exps", "decks", "wsheets", "code"))
    tot = collections.Counter()
    for u in inv["units"]:
        code = sum(1 for r in u["lessons"] if r["code_bank"])
        print("  %-5s %-46s %5d %5d %5d %5d"
              % (u["id"], u["title"][:46], len(u["lessons"]), len(u["decks"]),
                 len(u["worksheets"]), code))
        tot["lessons"] += len(u["lessons"]); tot["decks"] += len(u["decks"])
        tot["worksheets"] += len(u["worksheets"]); tot["code"] += code
    print("  %-5s %-46s %5d %5d %5d %5d" % ("", "all", tot["lessons"], tot["decks"],
                                            tot["worksheets"], tot["code"]))
    print("\nwritten to %s" % path)
    if inv["problems"]:
        print("\n%d thing(s) to look at:" % len(inv["problems"]))
        for p in inv["problems"]:
            print("  " + p)
    else:
        print("\nnothing missing, orphaned or unbuildable")
    if "--check" in argv and inv["problems"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
