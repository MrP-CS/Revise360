"""Recover wall-panel text from a surviving build script into the experience.

Two lessons in topic 1.3 are built in parts by the oldest scripts in the course,
l1.py (nw-l01, three parts) and l6.py (nw-l06, two parts), which predate the
specs module convention. Their wall text is passed straight to the painter as a
literal and ends up only in the rendered JPEG, so the coverage trace could not
read a word of what either lesson teaches and said so.

The text is not lost. It is in the script. This imports the script, replaces the
painter with one that writes down what it was asked to draw instead of drawing
it, calls each face in order, and attaches the result to the matching station in
experiences/<lesson>.json as `bullets` and `challenge`.

It is a transcription-free recovery: the strings are the same objects the
renderer uses, so there is no chance of a typo, and re-running it after an edit
to the script keeps the two in step. It does not re-render, because it does not
change what is painted - only where the words are also kept.

Station 5 of each part is a hand-drawn panel rather than a station2 card, so it
has no bullets to recover. Those are left alone and reported.

  python3 recoverwalls.py            # say what would change
  python3 recoverwalls.py --write    # change it
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
import json, importlib

# The faces of each part, in the order a pupil meets them. Only the ones that
# carry station cards are walked: the briefing and the floor hold no stations.
# `painter` is the name the script calls to draw a card; l1 and l6 define their
# own station2, and l4 uses lib360's station, which takes the same arguments.
LESSONS = {
    "nw-l01": ("l1", "station2",
               [["s1_right", "s1_back"], ["s2_right", "s2_back"], ["s3_right", "s3_back"]]),
    "nw-l06": ("l6", "station2", [["st_right", "st_back"], ["me_right", "me_back"]]),
    "nw-l04": ("l4", "station", [["right", "back", "left"]]),
}

# Topic 2.5 was never painted from literals at all: its wall text is already
# written down, in tools/topic25/content.json and lesson1.json, as a `facts`
# list per station. The coverage trace called all five lessons unreadable
# because it looks in the experience and the spec modules and neither holds
# them. Nothing needs recovering here - it needs copying across.
TOPIC25 = {"pl-l01": "lesson1.json", "pl-l02": "content.json", "pl-l03": "content.json",
           "pl-l04": "content.json", "pl-l05": "content.json"}


def from_topic25(lid):
    """[(number, title, bullets, challenge)] for one 2.5 lesson, in station order."""
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "topic25", TOPIC25[lid])
    doc = json.load(open(p, encoding="utf-8"))
    want = int(lid.split("-l")[1])
    if isinstance(doc, list):
        doc = next((x for x in doc if x.get("n") == want), None)
    if not doc or doc.get("n") != want:
        return None
    return [[(i + 1, s["name"], list(s.get("facts") or []), s.get("challenge"))
             for i, s in enumerate(doc["stations"])]]


def harvest(modname, painter, faces):
    """What each face would have painted, as (number, title, bullets, challenge).

    The card is matched to its station by the number painted on it, not by its
    title: nw-l01's wall says "Advantages of networks" where the station badge
    says "Advantages", and the number is the thing a pupil follows anyway."""
    mod = importlib.import_module(modname)
    got = []

    def spy(d, x0, n, title, what, chal, draw_fn, *a, **k):
        got.append((n, title, list(what), chal))

    # The face functions reach their helpers through module globals, and
    # `from x import *` binds the name once at import, so the patch has to go on
    # every module that holds a copy of it: the script itself, and whichever
    # module defined it.
    owners = [mod]
    for name in ("l1", "lib360"):
        try:
            m = importlib.import_module(name)
        except Exception:
            continue
        if hasattr(m, painter) and m not in owners:
            owners.append(m)
    saved = [(m, getattr(m, painter)) for m in owners if hasattr(m, painter)]
    for m, _ in saved:
        setattr(m, painter, spy)
    try:
        out = []
        for part in faces:
            got.clear()
            for f in part:
                getattr(mod, f)()
            out.append(list(got))
    finally:
        for m, fn in saved:
            setattr(m, painter, fn)
    return out


def sources():
    """Every lesson this can recover, as lid -> [[(n, title, bullets, challenge)]]."""
    out = {}
    for lid, (modname, painter, faces) in LESSONS.items():
        out[lid] = harvest(modname, painter, faces)
    for lid in TOPIC25:
        got = from_topic25(lid)
        if got:
            out[lid] = got
        else:
            print("  %s: not found in tools/topic25/%s" % (lid, TOPIC25[lid]))
    return out


def main(write=False):
    changed = problems = 0
    for lid, parts in sorted(sources().items()):
        p = SITE / "experiences" / (lid + ".json")
        exp = json.load(open(p, encoding="utf-8"))
        if len(parts) != len(exp["scenes"]):
            print("  %s: %d part(s) painted, %d scene(s) in the experience"
                  % (lid, len(parts), len(exp["scenes"])))
            problems += 1
            continue
        for sc, painted in zip(exp["scenes"], parts):
            by = {n: (t, b, c) for n, t, b, c in painted}
            for st in sc["stations"]:
                try:
                    n = int(st.get("label"))
                except (TypeError, ValueError):
                    n = None
                if n not in by:
                    print("  %s %s station %s %r: hand-drawn panel, no card to read"
                          % (lid, sc["id"], st.get("label"), st["name"]))
                    continue
                t, b, c = by.pop(n)
                if t != st["name"]:
                    print("  %s %s station %s: the wall says %r, the badge says %r"
                          % (lid, sc["id"], n, t, st["name"]))
                if st.get("bullets") == b and st.get("challenge") == c:
                    continue
                st["bullets"], st["challenge"] = b, c
                changed += 1
            # A card painted with no station to go with it is the serious
            # direction: the wall teaches something nothing asks about.
            for n, (t, _b, _c) in sorted(by.items()):
                print("  %s %s: wall card %d %r matches no station" % (lid, sc["id"], n, t))
                problems += 1
        if write:
            json.dump(exp, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print()
    print("%d station(s) %s wall text, %d problem(s)"
          % (changed, "given" if write else "would be given", problems))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main("--write" in sys.argv))
