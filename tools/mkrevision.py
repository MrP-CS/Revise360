"""Build the Revision 360 question bank from the authoring modules.

  python3 tools/revindex.py --write     # first: the station index this checks against
  python3 tools/mkrevision.py           # report what would change
  python3 tools/mkrevision.py --write   # write revision/

Reads tools/revbank/t*.py, one module a topic, and writes

  revision/manifest.json          what exists, how much of it, and where
  revision/<topic>/<lesson>.json  the questions, grouped by the lesson they revisit
  revision/ids.json               which number each question was given, and when

Section 62 says never use an array position as the identifier. So ids come out
of ids.json, which remembers the number each question was first given, keyed by
the question's own text rather than by where it sits. Move a question, reorder a
file, split a subtopic: the id does not change, and a learner's history keeps
pointing at the question they answered. A number is never reused, even after a
question is deleted, so an old history can still be read.
"""
import hashlib
import importlib
import json
import pathlib
import sys

import revschema as S
from paths import SITE

BANK = SITE / "revision"
AUTHORING = pathlib.Path(__file__).resolve().parent / "revbank"
IDS = BANK / "ids.json"


def key_of(topic, q):
    """What identifies a question across edits: the topic, the type and the stem.
    Not the subtopic, so moving one between subtopics keeps its id; not the
    options, so fixing a typo in a distractor keeps it."""
    h = hashlib.sha256(("%s\u001f%s\u001f%s" % (topic, q["type"], q["q"])).encode()).hexdigest()
    return h[:16]


def load_ids():
    if IDS.exists():
        return json.loads(IDS.read_text(encoding="utf-8"))
    return {"note": ("The number each revision question was first given. Keyed by topic, "
                     "type and stem, so editing a question's options or moving it between "
                     "subtopics keeps its id. Numbers are never reused."),
            "next": {}, "given": {}}


def modules():
    out = []
    for f in sorted(AUTHORING.glob("t*.py")):
        if f.name == "__init__.py":
            continue
        out.append(importlib.import_module("revbank." + f.stem))
    return out


def lesson_of(station_id):
    return station_id.rsplit("-s", 1)[0]


def build(write=False):
    stations = S.load_stations()
    ids = load_ids()
    given, nxt = ids["given"], ids["next"]
    files, problems, all_q = {}, [], []

    # Across every module, not within one. A topic may be authored in more than
    # one file now - the drill a generator produces sits beside the questions
    # written by hand - and a stem collision between two files is exactly the
    # one that would have gone unnoticed, because each file looked clean.
    seen_stems = {}

    for mod in modules():
        topic = mod.TOPIC
        if topic not in S.TOPIC_TITLE:
            problems.append("%s: %r is not a topic" % (mod.__name__, topic))
            continue
        for block in mod.BANK:
            lid = lesson_of(block["revisit"])
            for q in block["questions"]:
                q = dict(q)
                q["subtopic"] = block["subtopic"]
                q["revisit"] = block["revisit"]
                q["revisitReason"] = block["revisitReason"]
                q["outcomes"] = block["outcomes"]
                q["topic"] = topic
                k = key_of(topic, q)
                if k in seen_stems:
                    problems.append("%s: two questions share a stem (%s and %s): %r"
                                    % (topic, seen_stems[k], mod.__name__, q["q"][:70]))
                seen_stems[k] = mod.__name__
                if k not in given:
                    n = nxt.get(topic, 0) + 1
                    nxt[topic] = n
                    given[k] = {"n": n, "slug": block["slug"], "stem": q["q"][:90]}
                rec = given[k]
                q["id"] = "rq-%s-%s-%04d" % (topic, rec["slug"], rec["n"])
                q["contentVersion"] = q.get("contentVersion", 1)
                q["reviewStatus"] = q.get("reviewStatus", "VALIDATED")
                problems.extend(S.resolve(q, stations))
                files.setdefault((topic, lid), []).append(q)
                all_q.append(q)

    # ---- the manifest
    topics = []
    for topic in sorted({t for t, _ in files}, key=lambda t: (S.PAPER[t], t)):
        mine = [(lid, qs) for (t, lid), qs in sorted(files.items()) if t == topic]
        topics.append({
            "topic": topic, "title": S.TOPIC_TITLE[topic], "paper": S.PAPER[topic],
            "questions": sum(len(qs) for _, qs in mine),
            "marks": sum(q["marks"] for _, qs in mine for q in qs),
            "files": ["%s/%s.json" % (topic, lid) for lid, _ in mine],
            "subtopics": sorted({q["subtopic"] for _, qs in mine for q in qs}),
        })
    manifest = {
        "note": ("Built by tools/mkrevision.py from tools/revbank. The engine reads this "
                 "first and fetches only the files for the topics a learner has chosen."),
        "version": 1,
        "questions": len(all_q),
        "marks": sum(q["marks"] for q in all_q),
        "topics": topics,
    }

    if write:
        BANK.mkdir(parents=True, exist_ok=True)
        for (topic, lid), qs in sorted(files.items()):
            d = BANK / topic
            d.mkdir(parents=True, exist_ok=True)
            (d / (lid + ".json")).write_text(json.dumps(
                {"topic": topic, "lesson": lid, "questions": qs},
                indent=1, ensure_ascii=False), encoding="utf-8")
        (BANK / "manifest.json").write_text(
            json.dumps(manifest, indent=1, ensure_ascii=False), encoding="utf-8")
        ids["given"], ids["next"] = given, nxt
        IDS.write_text(json.dumps(ids, indent=1, ensure_ascii=False), encoding="utf-8")

    return manifest, all_q, problems


def report(manifest, all_q, problems):
    print("%d questions, %d marks, %d topics"
          % (manifest["questions"], manifest["marks"], len(manifest["topics"])))
    for t in manifest["topics"]:
        print("  %-4s paper %d  %4d questions  %4d marks  %2d files  %d subtopics"
              % (t["topic"], t["paper"], t["questions"], t["marks"],
                 len(t["files"]), len(t["subtopics"])))
    fam = {}
    for q in all_q:
        fam[S.FAMILY[q["type"]]] = fam.get(S.FAMILY[q["type"]], 0) + 1
    n = len(all_q) or 1
    print("balance:", ", ".join("%s %d%%" % (k, round(100 * v / n)) for k, v in sorted(fam.items())),
          "| exam-style %d%%" % round(100 * sum(1 for q in all_q if q.get("examStyle")) / n))
    for p in problems:
        print("  problem: " + p)


def main():
    manifest, all_q, problems = build("--write" in sys.argv)
    report(manifest, all_q, problems)
    if "--write" in sys.argv:
        print("wrote revision/")
    else:
        print("(nothing written; pass --write)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
