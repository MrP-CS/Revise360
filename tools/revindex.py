"""The index Revision 360 recommends against: every lesson and every station.

Spec sections 30 to 32 say a revision question must point at the one station
that teaches the concept, and that the pointer must come from the course's own
records rather than from matching words. So this reads build/records/*.json -
the canonical record of what each lesson contains - and the experience JSON
beside it, and writes one file the site and the QA tools both read:

  revision/stations.json

A question stores `revisit: "ms-l02-s2"`. That is a station id straight out of
the record, so there is nothing to guess: tools/revqa.py fails if the id is not
in this index, and the player reads the index to say

  Revisit 1.2 Lesson 2 - Swap space, station 2: What is virtual memory?

and to open that very station. The index also carries where the station lives
inside the experience - which scene, and which position in that scene - because
a record flattens every scene into one list and the player needs the pair back
to open a station. Working that out here, once, is why the index exists at all:
the alternative is every reader re-deriving it and one of them getting it wrong.

  python3 tools/revindex.py           # report what it would write
  python3 tools/revindex.py --write   # write revision/stations.json
"""
import json
import sys

from paths import SITE

OUT = SITE / "revision" / "stations.json"


def experience_of(lid):
    f = SITE / "experiences" / (lid + ".json")
    if not f.exists():
        return None
    return json.loads(f.read_text(encoding="utf-8"))


def build():
    """Walk the records, pair each station with its place in the experience."""
    lessons, problems = {}, []
    for f in sorted((SITE / "build" / "records").glob("*.json")):
        rec = json.loads(f.read_text(encoding="utf-8"))
        lid = rec["id"]
        exp = experience_of(lid)
        # The record flattens every scene in order. Re-walk the experience the
        # same way so station n lines up with (scene, position-in-scene). This
        # is the pairing record.py threw away, and the one the player needs.
        flat = []
        for si, sc in enumerate(exp["scenes"] if exp else []):
            for k, st in enumerate(sc.get("stations") or []):
                flat.append((si, sc["id"], k, st))
        stations = []
        # The record lists its stations in flatten order, which is why the
        # position in this list is the index into `flat` and st["n"] is not:
        # a final challenge is numbered "final" rather than counted.
        for i, st in enumerate(rec.get("stations", [])):
            place = flat[i] if i < len(flat) else None
            if place and place[3].get("name") != st["name"]:
                problems.append("%s station %s: the record calls it %r and the "
                                "experience calls it %r"
                                % (lid, st["n"], st["name"], place[3].get("name")))
            stations.append({
                "id": st["id"],
                "n": st["n"],
                "name": st["name"],
                "teaches": st.get("explains") or [],
                "scene": place[1] if place else None,
                "sceneIndex": place[0] if place else None,
                "k": place[2] if place else None,
            })
        if exp and len(flat) != len(rec.get("stations", [])):
            problems.append("%s: the record has %d stations and the experience has %d"
                            % (lid, len(rec.get("stations", [])), len(flat)))
        lessons[lid] = {
            "id": lid,
            "unit": rec["unit"],
            "unitTitle": rec["unit_title"],
            "lesson": rec["lesson"],
            "title": rec["title"],
            "kind": rec.get("kind"),
            "hasExperience": bool(exp),
            "outcomes": [o["id"] for o in rec.get("outcomes", [])],
            "outcomeText": {o["id"]: o["text"] for o in rec.get("outcomes", [])},
            "stations": stations,
        }
    return lessons, problems


def units(lessons):
    """Unit number to title, in specification order, Python course last."""
    out = {}
    for L in lessons.values():
        out.setdefault(L["unit"], L["unitTitle"])
    return {k: out[k] for k in sorted(out, key=lambda u: (u == "PY", u))}


def main():
    lessons, problems = build()
    index = {
        "note": ("Derived by tools/revindex.py from build/records and the experience "
                 "JSON beside it. Revision questions name a station id from here; "
                 "tools/revqa.py fails on one that is not."),
        "units": units(lessons),
        "lessons": lessons,
    }
    n_st = sum(len(L["stations"]) for L in lessons.values())
    placed = sum(1 for L in lessons.values() for s in L["stations"] if s["k"] is not None)
    print("%d lessons, %d stations, %d of them openable in an experience"
          % (len(lessons), n_st, placed))
    for p in problems:
        print("  mismatch: " + p)
    if "--write" in sys.argv:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(index, indent=1, ensure_ascii=False), encoding="utf-8")
        print("wrote " + str(OUT.relative_to(SITE)))
    else:
        print("(nothing written; pass --write)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
